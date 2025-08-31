import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { EmployerWithApprovals } from '../types/lmia';

interface MarkerClusterGroupProps {
  employers: EmployerWithApprovals[];
  onEmployerSelect: (employer: EmployerWithApprovals) => void;
}

const MarkerClusterGroup: React.FC<MarkerClusterGroupProps> = ({ employers, onEmployerSelect }) => {
  const map = useMap();

  useEffect(() => {
    console.log('MarkerClusterGroup: Loading employers:', employers.length);
    
    // Import markercluster dynamically
    import('leaflet.markercluster').then((MarkerClusterGroup) => {
      console.log('MarkerClusterGroup: Imported successfully');
      // Clear existing markers
      map.eachLayer((layer) => {
        if (layer instanceof MarkerClusterGroup.default) {
          map.removeLayer(layer);
        }
      });

      // Create cluster group
      const clusterGroup = new MarkerClusterGroup.default({
        chunkedLoading: true,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
      });

      // Add markers to cluster group
      console.log('MarkerClusterGroup: Adding markers for', employers.length, 'employers');
      employers.forEach((employer, index) => {
        if (index < 5) console.log('Sample employer:', employer.employer_name, employer.latitude, employer.longitude);
        
        const marker = L.marker([employer.latitude, employer.longitude], {
          icon: createCustomIcon(employer.primary_program, employer.total_positions)
        });

        marker.bindPopup(`
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
        `);

        clusterGroup.addLayer(marker);
      });

      // Add cluster group to map
      console.log('MarkerClusterGroup: Adding cluster group to map');
      map.addLayer(clusterGroup);
      console.log('MarkerClusterGroup: Cluster group added successfully');

      // Set up global function for popup buttons
      (window as { selectEmployer?: (id: string) => void }).selectEmployer = (employerId: string) => {
        const employer = employers.find(emp => emp.id === employerId);
        if (employer) {
          onEmployerSelect(employer);
        }
      };
    });

    return () => {
      // Cleanup
      map.eachLayer((layer) => {
        if (layer instanceof (window as { L: { MarkerClusterGroup: typeof MarkerClusterGroup } }).L.MarkerClusterGroup) {
          map.removeLayer(layer);
        }
      });
    };
  }, [employers, map, onEmployerSelect]);

  return null;
};

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

export default MarkerClusterGroup;
