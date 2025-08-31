import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { EmployerWithApprovals } from '../types/lmia';
import MarkerClusterGroup from './MarkerClusterGroup';
import SimpleMarkers from './SimpleMarkers';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

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



interface MapViewProps {
  employers: EmployerWithApprovals[];
  onEmployerSelect: (employer: EmployerWithApprovals) => void;
}

// Component to handle map updates with clustering
const MapUpdater: React.FC<{ employers: EmployerWithApprovals[] }> = ({ employers }) => {
  const map = useMap();

  useEffect(() => {
    if (employers.length > 0) {
      // Fit bounds to show all employers
      const group = new window.L.featureGroup(
        employers.map(emp => window.L.marker([emp.latitude, emp.longitude]))
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [employers, map]);

  return null;
};

const MapView: React.FC<MapViewProps> = ({ employers, onEmployerSelect }) => {
  const mapRef = useRef<L.Map | null>(null);
  
  console.log('MapView: Received employers:', employers.length);

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
        {employers.length > 0 && (
          <SimpleMarkers 
            employers={employers} 
            onEmployerSelect={onEmployerSelect} 
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;