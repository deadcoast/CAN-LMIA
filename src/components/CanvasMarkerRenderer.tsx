import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { EmployerWithApprovals } from '../types/lmia';

interface CanvasMarkerRendererProps {
  employers: EmployerWithApprovals[];
  onEmployerSelect: (employer: EmployerWithApprovals) => void;
}

// Canvas marker renderer for high-performance rendering
const CanvasMarkerRenderer: React.FC<CanvasMarkerRendererProps> = ({ 
  employers, 
  onEmployerSelect 
}) => {
  const map = useMap();
  const canvasLayerRef = useRef<any>(null);
  const [isCanvasSupported, setIsCanvasSupported] = useState(false);

  // Check if canvas rendering is supported
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const isSupported = !!(canvas.getContext && canvas.getContext('2d'));
    setIsCanvasSupported(isSupported);
    console.log('Canvas rendering supported:', isSupported);
  }, []);

  // Create canvas marker icon
  const createCanvasIcon = (programStream: string, positionCount: number) => {
    const size = Math.min(Math.max(positionCount / 5 + 20, 25), 40);
    const color = programStream === 'High-wage' ? '#0F4C75' : '#14B8A6';
    
    // Create a canvas element for the icon
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw circle
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw text
      ctx.fillStyle = 'white';
      ctx.font = `${size > 30 ? '10px' : '8px'} Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(positionCount.toString(), size / 2, size / 2);
    }
    
    return canvas.toDataURL();
  };

  // Initialize canvas layer
  useEffect(() => {
    if (!isCanvasSupported || !window.L || !window.L.canvasIconLayer) {
      console.log('Canvas rendering not available, falling back to DOM markers');
      return;
    }

    // Create canvas icon layer
    canvasLayerRef.current = (window.L as any).canvasIconLayer({}).addTo(map);
    console.log('Canvas layer initialized');

    return () => {
      if (canvasLayerRef.current) {
        map.removeLayer(canvasLayerRef.current);
      }
    };
  }, [map, isCanvasSupported]);

  // Add markers to canvas layer
  useEffect(() => {
    if (!canvasLayerRef.current || !isCanvasSupported) return;

    // Clear existing markers
    canvasLayerRef.current.clearLayers();

    // Add markers to canvas layer (much faster than DOM)
    employers.forEach(employer => {
      const marker = (window.L as any).marker([employer.latitude, employer.longitude], {
        icon: (window.L as any).divIcon({
          html: `<div style="
            background: url('${createCanvasIcon(employer.primary_program, employer.total_positions)}') no-repeat center;
            width: ${Math.min(Math.max(employer.total_positions / 5 + 20, 25), 40)}px;
            height: ${Math.min(Math.max(employer.total_positions / 5 + 20, 25), 40)}px;
            cursor: pointer;
          "></div>`,
          iconSize: [Math.min(Math.max(employer.total_positions / 5 + 20, 25), 40), Math.min(Math.max(employer.total_positions / 5 + 20, 25), 40)],
          iconAnchor: [Math.min(Math.max(employer.total_positions / 5 + 20, 25), 40) / 2, Math.min(Math.max(employer.total_positions / 5 + 20, 25), 40) / 2]
        })
      });

      // Add click handler
      marker.on('click', () => {
        onEmployerSelect(employer);
      });

      // Add hover effect
      marker.on('mouseover', () => {
        marker.getElement()?.style.setProperty('transform', 'scale(1.1)');
        marker.getElement()?.style.setProperty('transition', 'transform 0.2s');
      });

      marker.on('mouseout', () => {
        marker.getElement()?.style.setProperty('transform', 'scale(1)');
      });

      canvasLayerRef.current.addLayer(marker);
    });

    console.log(`Canvas rendering: ${employers.length} markers added to canvas layer`);
  }, [employers, onEmployerSelect, isCanvasSupported]);

  return (
    <div className="absolute top-4 left-4 z-[1000]">
      {isCanvasSupported && (
        <div className="bg-white rounded-lg shadow-md p-2 border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-700">Canvas Rendering</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasMarkerRenderer;
