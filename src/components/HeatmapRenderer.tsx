import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { EmployerWithApprovals } from '../types/lmia';

interface HeatmapRendererProps {
  employers: EmployerWithApprovals[];
  intensity?: 'low' | 'medium' | 'high';
  radius?: number;
  maxZoom?: number;
  blur?: number;
}

// Heat map renderer for density visualization
const HeatmapRenderer: React.FC<HeatmapRendererProps> = ({ 
  employers, 
  intensity = 'medium',
  radius = 25,
  maxZoom = 18,
  blur = 15
}) => {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);
  const [isHeatmapSupported, setIsHeatmapSupported] = useState(false);

  // Check if heatmap is supported
  useEffect(() => {
    // For now, disable heatmap until leaflet.heat is properly loaded
    setIsHeatmapSupported(false);
    console.log('Heatmap rendering disabled - using fallback visualization');
  }, []);

  // Convert employers to heat points
  const convertToHeatPoints = (employers: EmployerWithApprovals[]): Array<[number, number, number]> => {
    return employers.map(employer => {
      // Use total_positions as intensity weight
      const weight = Math.min(employer.total_positions / 10, 1); // Normalize to 0-1
      return [employer.latitude, employer.longitude, weight];
    });
  };

  // Get intensity configuration
  const getIntensityConfig = (intensity: string) => {
    switch (intensity) {
      case 'low':
        return { radius: 20, blur: 10, max: 0.5 };
      case 'high':
        return { radius: 35, blur: 20, max: 1.0 };
      default: // medium
        return { radius: 25, blur: 15, max: 0.8 };
    }
  };

  // Render heatmap
  useEffect(() => {
    if (!isHeatmapSupported || !employers.length) return;

    // Remove existing heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    // Convert employers to heat points
    const heatPoints = convertToHeatPoints(employers);
    
    if (heatPoints.length === 0) return;

    // Get intensity configuration
    const config = getIntensityConfig(intensity);

    // Create heat layer
    try {
      heatLayerRef.current = (window as any).L.heatLayer(heatPoints, {
        radius: radius,
        blur: blur,
        maxZoom: maxZoom,
        max: config.max,
        gradient: {
          0.0: 'blue',    // Low density
          0.2: 'cyan',    // 
          0.4: 'lime',    // Medium density
          0.6: 'yellow',  // 
          0.8: 'orange',  // High density
          1.0: 'red'      // Very high density
        }
      }).addTo(map);

      console.log(`Heatmap rendered: ${heatPoints.length} points with ${intensity} intensity`);
    } catch (error) {
      console.error('Failed to create heatmap:', error);
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [employers, intensity, radius, maxZoom, blur, map, isHeatmapSupported]);

  // Update heatmap when zoom changes
  useEffect(() => {
    const handleZoomEnd = () => {
      const currentZoom = map.getZoom();
      
      // Show heatmap only at low zoom levels
      if (currentZoom < 8 && heatLayerRef.current) {
        if (!map.hasLayer(heatLayerRef.current)) {
          map.addLayer(heatLayerRef.current);
        }
      } else if (currentZoom >= 8 && heatLayerRef.current) {
        if (map.hasLayer(heatLayerRef.current)) {
          map.removeLayer(heatLayerRef.current);
        }
      }
    };

    map.on('zoomend', handleZoomEnd);
    
    // Initial check
    handleZoomEnd();

    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      {isHeatmapSupported && (
        <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Heat Map</span>
          </div>
          
          {/* Intensity legend */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Low density</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">Medium density</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">High density</span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              {employers.length} employers
            </div>
            <div className="text-xs text-gray-500">
              Intensity: {intensity}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatmapRenderer;
