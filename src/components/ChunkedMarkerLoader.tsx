import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { EmployerWithApprovals } from '../types/lmia';

interface ChunkedMarkerLoaderProps {
  employers: EmployerWithApprovals[];
  onEmployerSelect: (employer: EmployerWithApprovals) => void;
  chunkSize?: number;
}

// Custom marker icon function
const createCustomIcon = (programStream: string, positionCount: number, isCluster: boolean = false) => {
  const size = isCluster ? Math.min(Math.max(positionCount / 10 + 30, 35), 60) : Math.min(Math.max(positionCount / 5 + 20, 25), 40);
  const color = isCluster ? '#FF6B35' : (programStream === 'High-wage' ? '#0F4C75' : '#14B8A6');
  
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
      color: white;
      font-size: ${size > 40 ? '12px' : size > 30 ? '10px' : '8px'};
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      cursor: pointer;
    ">
      ${isCluster ? 'C' : positionCount}
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  };
};

const ChunkedMarkerLoader: React.FC<ChunkedMarkerLoaderProps> = ({ 
  employers, 
  onEmployerSelect, 
  chunkSize = 1000 
}) => {
  const map = useMap();
  const [loadedMarkers, setLoadedMarkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const markersRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Clear existing markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = [];
    setLoadedMarkers([]);
  }, [map]);

  // Add markers in chunks to prevent blocking
  const addMarkersInChunks = useCallback((data: EmployerWithApprovals[], chunkSize: number) => {
    let index = 0;
    setIsLoading(true);
    setCurrentIndex(0);
    
    const addChunk = () => {
      const chunk = data.slice(index, index + chunkSize);
      
      chunk.forEach(employer => {
        const isCluster = employer.id.startsWith('cluster-');
        const marker = (window as any).L.marker([employer.latitude, employer.longitude], {
          icon: (window as any).L.divIcon(createCustomIcon(employer.primary_program, employer.total_positions, isCluster))
        });

        let popupContent = '';
        if (isCluster) {
          popupContent = `
            <div class="p-2 min-w-[250px]">
              <h3 class="font-semibold text-gray-900 mb-2">${employer.employer_name}</h3>
              <div class="space-y-1 text-sm">
                <p><span class="font-medium">Location:</span> ${employer.address}</p>
                <p><span class="font-medium">Province:</span> ${employer.province_territory}</p>
                <p><span class="font-medium">Total Positions:</span> ${employer.total_positions}</p>
                <p><span class="font-medium">Total LMIAs:</span> ${employer.total_lmias}</p>
                <p><span class="font-medium">Type:</span> Cluster of ${employer.total_lmias} employers</p>
              </div>
              <button
                onclick="window.selectEmployer('${employer.id}')"
                class="mt-3 w-full py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium"
              >
                View Cluster Details
              </button>
            </div>
          `;
        } else {
          popupContent = `
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
        }
        
        marker.bindPopup(popupContent);
        
        map.addLayer(marker);
        markersRef.current.push(marker);
      });
      
      setLoadedMarkers(prev => [...prev, ...chunk]);
      setCurrentIndex(index + chunkSize);
      
      index += chunkSize;
      if (index < data.length) {
        // Use requestAnimationFrame to prevent blocking
        animationFrameRef.current = requestAnimationFrame(addChunk);
      } else {
        setIsLoading(false);
        console.log(`Chunked loading complete: ${data.length} markers loaded in chunks of ${chunkSize}`);
      }
    };
    
    addChunk();
  }, [map]);

  // Load new data when employers change
  useEffect(() => {
    if (employers.length === 0) {
      clearMarkers();
      return;
    }

    // Clear existing markers and start chunked loading
    clearMarkers();
    addMarkersInChunks(employers, chunkSize);

    // Set up global function for popup buttons
    (window as any).selectEmployer = (employerId: string) => {
      const employer = employers.find(emp => emp.id === employerId);
      if (employer) {
        onEmployerSelect(employer);
      }
    };



    return () => {
      // Cleanup animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [employers, chunkSize, clearMarkers, addMarkersInChunks, onEmployerSelect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMarkers();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [clearMarkers]);

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      {isLoading && (
        <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-700">
              Loading markers: {currentIndex}/{employers.length}
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex / employers.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChunkedMarkerLoader;
