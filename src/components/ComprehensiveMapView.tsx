import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { EmployerWithApprovals } from '../types/lmia';
import ChunkedMarkerLoader from './ChunkedMarkerLoader';
import CanvasMarkerRenderer from './CanvasMarkerRenderer';
import HeatmapRenderer from './HeatmapRenderer';
import { useClusteringWorker } from '../hooks/useClusteringWorker';
import 'leaflet/dist/leaflet.css';

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

interface ComprehensiveMapViewProps {
  employers: EmployerWithApprovals[];
  onEmployerSelect: (employer: EmployerWithApprovals) => void;
  onViewportChange?: (bounds: any) => void;
}

const ComprehensiveMapView: React.FC<ComprehensiveMapViewProps> = ({ 
  employers, 
  onEmployerSelect,
  onViewportChange
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [renderMode, setRenderMode] = useState<'chunked' | 'canvas' | 'heatmap'>('chunked');
  const [zoom, setZoom] = useState(4);
  const [isWorkerReady, setIsWorkerReady] = useState(false);


  
  // Import and use clustering worker
  const { clusterData, aggregateData, isWorkerReady: workerReady } = useClusteringWorker();

  // Update worker ready state
  useEffect(() => {
    setIsWorkerReady(workerReady);
  }, [workerReady]);

  // Handle zoom changes to switch render modes and trigger viewport updates
  const handleZoomEnd = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      setZoom(currentZoom);
      
      // Switch render mode based on zoom level
      if (currentZoom < 6) {
        setRenderMode('heatmap');
      } else if (currentZoom < 10) {
        setRenderMode('canvas');
      } else {
        setRenderMode('chunked');
      }

      // Trigger viewport change for server data loading
      if (onViewportChange) {
        const bounds = mapRef.current.getBounds();
        const viewportBounds = {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          zoom: currentZoom
        };
        onViewportChange(viewportBounds);
      }
    }
  };

  // Handle map move events
  const handleMoveEnd = () => {
    if (mapRef.current && onViewportChange) {
      const bounds = mapRef.current.getBounds();
      const currentZoom = mapRef.current.getZoom();
      const viewportBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        zoom: currentZoom
      };
      onViewportChange(viewportBounds);
    }
  };

  // Test clustering worker
  const testClusteringWorker = async () => {
    if (isWorkerReady && employers.length > 0) {
      try {
        console.log('Testing clustering worker...');
        const clusters = await clusterData(employers.slice(0, 100), 40, 2);
        console.log('Clustering result:', clusters);
      } catch (error) {
        console.error('Clustering worker test failed:', error);
      }
    }
  };

  return (
    <div className="h-full w-full relative bg-gray-100 rounded-lg overflow-hidden shadow-inner">
      <MapContainer
        center={[56.1304, -106.3468]} // Geographic center of Canada
        zoom={4}
        className="h-full w-full"
        ref={mapRef}
        whenReady={() => {
          if (mapRef.current) {
            mapRef.current.on('zoomend', handleZoomEnd);
            mapRef.current.on('moveend', handleMoveEnd);
          }
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater employers={employers} />
        
        {/* Render based on current mode */}
        {renderMode === 'chunked' && (
          <ChunkedMarkerLoader
            employers={employers}
            onEmployerSelect={onEmployerSelect}
            chunkSize={500}
          />
        )}
        
        {renderMode === 'canvas' && (
          <CanvasMarkerRenderer
            employers={employers}
            onEmployerSelect={onEmployerSelect}
          />
        )}
        
        {renderMode === 'heatmap' && (
          <HeatmapRenderer
            employers={employers}
            intensity="medium"
            radius={30}
          />
        )}
      </MapContainer>

      {/* Control panel */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        {/* Render mode indicator */}
        <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              renderMode === 'heatmap' ? 'bg-red-500' :
              renderMode === 'canvas' ? 'bg-blue-500' :
              'bg-green-500'
            }`}></div>
            <span className="text-sm font-medium text-gray-700">
              {renderMode === 'heatmap' ? 'Heat Map' :
               renderMode === 'canvas' ? 'Canvas Rendering' :
               'Chunked Loading'}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Zoom: {zoom.toFixed(1)}
          </div>
        </div>

        {/* Worker status */}
        <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isWorkerReady ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-700">
              Web Worker: {isWorkerReady ? 'Ready' : 'Not Ready'}
            </span>
          </div>
          {isWorkerReady && (
            <button
              onClick={testClusteringWorker}
              className="mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Test Clustering
            </button>
          )}
        </div>

        {/* Performance stats */}
        <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-1">Performance</div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Employers: {employers.length.toLocaleString()}</div>
            <div>Mode: {renderMode}</div>
            <div>Zoom: {zoom.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Optimization status */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Optimizations Active</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Server-side API</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Viewport filtering</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Chunked loading</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Canvas rendering</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Heat map density</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isWorkerReady ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span>Web Workers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveMapView;
