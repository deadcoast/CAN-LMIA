import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { EmployerWithApprovals } from '../types/lmia';

interface SimpleMarkersProps {
  employers: EmployerWithApprovals[];
  onEmployerSelect: (employer: EmployerWithApprovals) => void;
}

// Custom marker icon function
const createCustomIcon = (programStream: string, positionCount: number) => {
  const size = Math.min(Math.max(positionCount / 5 + 20, 25), 40);
  const color = programStream === 'High-wage' ? '#0F4C75' : '#14B8A6';
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="6" fill="white" opacity="0.8"/>
        <text x="12" y="16" text-anchor="middle" fill="${color}" font-size="8" font-weight="bold">${positionCount}</text>
      </svg>
    `)}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

const SimpleMarkers: React.FC<SimpleMarkersProps> = ({ employers, onEmployerSelect }) => {
  console.log('SimpleMarkers: Rendering', employers.length, 'markers');
  
  return (
    <>
      {employers.map((employer) => (
        <Marker
          key={employer.id}
          position={[employer.latitude, employer.longitude]}
          icon={createCustomIcon(employer.primary_program, employer.total_positions)}
        >
          <Popup>
            <div className="p-2 min-w-[250px]">
              <h3 className="font-semibold text-gray-900 mb-2">{employer.employer_name}</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Location:</span> {employer.address}</p>
                <p><span className="font-medium">Province:</span> {employer.province_territory}</p>
                <p><span className="font-medium">Total Positions:</span> {employer.total_positions}</p>
                <p><span className="font-medium">Total LMIAs:</span> {employer.total_lmias}</p>
                <p><span className="font-medium">Primary Program:</span> {employer.primary_program}</p>
                <p><span className="font-medium">Primary Occupation:</span> {employer.primary_occupation}</p>
              </div>
              <button
                onClick={() => onEmployerSelect(employer)}
                className="mt-3 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default SimpleMarkers;
