import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { EmployerWithApprovals } from '../types/lmia';
import { ViewportBounds } from '../data/viewportDataLoader';
import Supercluster from 'supercluster';
import 'leaflet/dist/leaflet.css';

// Type definitions for Leaflet
interface LeafletMarker {
  getLatLng(): { lat: number; lng: number };
}

interface LeafletFeatureGroup {
  getBounds(): {
    pad: (padding: number) => { getNorthEast: () => { lat: number; lng: number }; getSouthWest: () => { lat: number; lng: number } };
  };
}

declare global {
  interface Window {
    L: {
      featureGroup: (markers: LeafletMarker[]) => LeafletFeatureGroup;
      marker: (latlng: [number, number]) => LeafletMarker;
    };
  }
}

// Clustering configuration
const clusterConfig = {
  radius: 40,
  maxZoom: 16,
  minPoints: 2,
  minZoom: 0
};

// Create custom cluster icon
const createClusterIcon = (count: number, isCluster: boolean = true) => {
  let size, color, textColor;
  
  if (isCluster) {
    if (count > 1000) {
      size = 60;
      color = '#dc2626'; // Red
      textColor = 'white';
    } else if (count > 500) {
      size = 50;
      color = '#ea580c'; // Orange
      textColor = 'white';
    } else if (count > 100) {
      size = 40;
      color = '#d97706'; // Amber
      textColor = 'white';
    } else if (count > 50) {
      size = 35;
      color = '#ca8a04'; // Yellow
      textColor = 'black';
    } else {
      size = 30;
      color = '#16a34a'; // Green
      textColor = 'white';
    }
  } else {
    // Individual marker
    size = 25;
    color = '#2563eb'; // Blue
    textColor = 'white';
  }
  
  return {
    html: `<div style="
      background: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: ${textColor};
      font-size: ${size > 40 ? '12px' : '10px'};
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      cursor: pointer;
    ">
      ${count > 999 ? `${Math.floor(count/1000)}k+` : count}
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  };
};

// Map updater component
const MapUpdater: React.FC<{ employers: EmployerWithApprovals[] }> = ({ employers }) => {
  const map = useMap();
  
  useEffect(() => {
    if (employers.length > 0) {
      const group = new window.L.featureGroup(
        employers.map(emp => window.L.marker([emp.latitude, emp.longitude]))
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [employers, map]);
  
  return null;
};

// Viewport change handler component
const ViewportHandler: React.FC<{ onViewportChange?: (bounds: ViewportBounds) => void }> = ({ onViewportChange }) => {
  const map = useMap();
  
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  const handleViewportChange = useCallback(() => {
    if (!onViewportChange) return;
    
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    
    const viewportBounds: ViewportBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
      zoom: zoom
    };
    
    onViewportChange(viewportBounds);
  }, [map, onViewportChange]);
  
  const debouncedViewportChange = useCallback(
    debounce(handleViewportChange, 300),
    [handleViewportChange]
  );
  
  useEffect(() => {
    // Initial viewport
    handleViewportChange();
    
    // Listen for map changes
    map.on('moveend', debouncedViewportChange);
    map.on('zoomend', debouncedViewportChange);
    
    return () => {
      map.off('moveend', debouncedViewportChange);
      map.off('zoomend', debouncedViewportChange);
    };
  }, [map, debouncedViewportChange, handleViewportChange]);
  
  return null;
};

// Clustered markers component
const ClusteredMarkers: React.FC<{
  employers: EmployerWithApprovals[];
  onEmployerSelect: (employer: EmployerWithApprovals) => void;
}> = ({ employers, onEmployerSelect }) => {
  const map = useMap();
  const [clusters, setClusters] = useState<any[]>([]);
  const clusterRef = useRef<Supercluster | null>(null);
  const markersRef = useRef<any[]>([]);

  // Initialize clustering
  useEffect(() => {
    if (!clusterRef.current) {
      clusterRef.current = new Supercluster(clusterConfig);
    }

    // Convert employers to GeoJSON features
    const points = employers.map(employer => ({
      type: 'Feature' as const,
      properties: {
        employer: employer,
        cluster: false
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [employer.longitude, employer.latitude]
      }
    }));

    // Load points into cluster
    clusterRef.current.load(points);
    
    // Get initial clusters for current view
    updateClusters();
  }, [employers]);

  // Update clusters when map view changes
  const updateClusters = useCallback(() => {
    if (!clusterRef.current) return;

    const bounds = map.getBounds();
    const zoom = Math.floor(map.getZoom());
    
    const clusters = clusterRef.current.getClusters(
      [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ],
      zoom
    );

    setClusters(clusters);
  }, [map]);

  // Update clusters on map move/zoom
  useEffect(() => {
    const handleMoveEnd = () => {
      updateClusters();
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleMoveEnd);
    };
  }, [map, updateClusters]);

  // Render clusters and markers
  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers/clusters
    clusters.forEach(cluster => {
      const isCluster = cluster.properties.cluster;
      const count = cluster.properties.point_count || 1;
      
      const marker = window.L.marker([cluster.geometry.coordinates[1], cluster.geometry.coordinates[0]], {
        icon: window.L.divIcon(createClusterIcon(count, isCluster))
      });

      if (isCluster) {
        // Cluster marker - show popup with summary
        const clusterEmployers = cluster.properties.cluster_id 
          ? clusterRef.current?.getLeaves(cluster.properties.cluster_id, Infinity) || []
          : [];
        
        const popupContent = `
          <div class="p-3 min-w-[300px]">
            <h3 class="font-bold text-lg mb-2">${count.toLocaleString()} Employers</h3>
            <div class="space-y-2 text-sm">
              <p><span class="font-medium">Total Positions:</span> ${clusterEmployers.reduce((sum, leaf) => sum + (leaf.properties.employer?.total_positions || 0), 0).toLocaleString()}</p>
              <p><span class="font-medium">Total LMIAs:</span> ${clusterEmployers.reduce((sum, leaf) => sum + (leaf.properties.employer?.total_lmias || 0), 0).toLocaleString()}</p>
              <p><span class="font-medium">Top Programs:</span></p>
              <ul class="ml-4 space-y-1">
                ${getTopPrograms(clusterEmployers).map(program => `<li>• ${program}</li>`).join('')}
              </ul>
            </div>
            <button
              onclick="window.expandCluster('${cluster.properties.cluster_id}')"
              class="mt-3 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Explore Area
            </button>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Set up global function for cluster expansion
        (window as any).expandCluster = (clusterId: string) => {
          map.setZoom(Math.min(map.getZoom() + 2, 16));
          const clusterCenter = cluster.geometry.coordinates;
          map.setView([clusterCenter[1], clusterCenter[0]], map.getZoom());
        };
      } else {
        // Individual marker
        const employer = cluster.properties.employer;
        const popupContent = `
          <div class="p-2 min-w-[250px]">
            <h3 class="font-semibold text-gray-900 mb-2">${employer.employer_name}</h3>
            <div class="space-y-1 text-sm">
              <p><span class="font-medium">Location:</span> ${employer.address}</p>
              <p><span class="font-medium">Province:</span> ${employer.province_territory}</p>
              <p><span class="font-medium">Total Positions:</span> ${employer.total_positions}</p>
              <p><span class="font-medium">Total LMIAs:</span> ${employer.total_lmias}</p>
              <p><span class="font-medium">Primary Program:</span> ${employer.primary_program}</p>
              <p><span class="font-medium">Primary Occupation:</span> ${employer.primary_occupation}</p>
            </div>
            <button
              onclick="window.selectEmployer('${employer.id}')"
              class="mt-3 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              View Details
            </button>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Set up global function for employer selection
        (window as any).selectEmployer = (employerId: string) => {
          const employer = employers.find(emp => emp.id === employerId);
          if (employer) {
            onEmployerSelect(employer);
          }
        };
      }

      map.addLayer(marker);
      markersRef.current.push(marker);
    });
  }, [clusters, employers, onEmployerSelect, map]);

  return null;
};

// Helper function to get top programs from cluster
const getTopPrograms = (clusterEmployers: any[]): string[] => {
  const programCounts: { [key: string]: number } = {};
  
  clusterEmployers.forEach(leaf => {
    const program = leaf.properties.employer?.primary_program;
    if (program) {
      programCounts[program] = (programCounts[program] || 0) + 1;
    }
  });
  
  return Object.entries(programCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([program]) => program);
};

interface OptimizedMapViewProps {
  employers: EmployerWithApprovals[];
  onEmployerSelect: (employer: EmployerWithApprovals) => void;
  onViewportChange?: (bounds: ViewportBounds) => void;
}

const OptimizedMapView: React.FC<OptimizedMapViewProps> = ({ employers, onEmployerSelect, onViewportChange }) => {
  const mapRef = useRef<L.Map | null>(null);
  
  console.log('OptimizedMapView: Received employers:', employers.length);

  return (
    <div className="h-full w-full relative bg-gray-100 rounded-lg overflow-hidden shadow-inner">
      <MapContainer
        center={[56.1304, -106.3468]} // Geographic center of Canada
        zoom={4}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater employers={employers} />
        <ViewportHandler onViewportChange={onViewportChange} />
        {employers.length > 0 && (
          <ClusteredMarkers 
            employers={employers} 
            onEmployerSelect={onEmployerSelect} 
          />
        )}
      </MapContainer>
    </div>
  );
};

export default OptimizedMapView;
