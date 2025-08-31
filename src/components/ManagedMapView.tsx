import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { EmployerWithApprovals } from '../types/lmia';
import { LMIAMapManager, RenderStrategy } from '../utils/LMIAMapManager';
import 'leaflet/dist/leaflet.css';

// Map manager component
const MapManager: React.FC<{
  onEmployerSelect: (employer: EmployerWithApprovals) => void;
  onStrategyChange: (strategy: RenderStrategy) => void;
  onLoadingChange: (loading: boolean) => void;
}> = ({ onEmployerSelect, onStrategyChange, onLoadingChange }) => {
  const map = useMap();
  const managerRef = useRef<LMIAMapManager | null>(null);

  useEffect(() => {
    // Initialize map manager
    managerRef.current = new LMIAMapManager(
      map,
      onLoadingChange,
      onStrategyChange
    );

    // Load initial data
    managerRef.current.loadData(2025, 'Q1');

    return () => {
      // Cleanup
      if (managerRef.current) {
        // Add cleanup logic if needed
      }
    };
  }, [map, onEmployerSelect, onStrategyChange, onLoadingChange]);

  return null;
};

// Map updater component
const MapUpdater: React.FC<{ employers: EmployerWithApprovals[] }> = ({ employers }) => {
  const map = useMap();
  
  useEffect(() => {
    if (employers.length > 0) {
      const group = new (window as any).L.featureGroup(
        employers.map(emp => (window as any).L.marker([emp.latitude, emp.longitude]))
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [employers, map]);
  
  return null;
};

interface ManagedMapViewProps {
  employers: EmployerWithApprovals[];
  onEmployerSelect: (employer: EmployerWithApprovals) => void;
}

const ManagedMapView: React.FC<ManagedMapViewProps> = ({ employers, onEmployerSelect }) => {
  const mapRef = useRef<L.Map | null>(null);
  const [currentStrategy, setCurrentStrategy] = useState<RenderStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStrategyChange = (strategy: RenderStrategy) => {
    setCurrentStrategy(strategy);
    console.log('Strategy changed to:', strategy.description);
  };

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

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
        <MapManager
          onEmployerSelect={onEmployerSelect}
          onStrategyChange={handleStrategyChange}
          onLoadingChange={handleLoadingChange}
        />
      </MapContainer>

      {/* Strategy indicator */}
      {currentStrategy && (
        <div className="absolute top-4 right-4 z-[1000]">
          <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                currentStrategy.strategy === 'heatmap' ? 'bg-red-500' :
                currentStrategy.strategy === 'clusters' ? 'bg-blue-500' :
                'bg-green-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-700">
                {currentStrategy.description}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Max points: {currentStrategy.maxPoints}
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 left-4 z-[1000]">
          <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-700">Loading map data...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagedMapView;
