import React, { useMemo } from 'react';
import { List } from 'react-window';
import { EmployerWithApprovals } from '../types/lmia';

interface VirtualizedStatisticsListProps {
  employers: EmployerWithApprovals[];
  height?: number;
  itemHeight?: number;
}

// Individual row component for virtual scrolling
const EmployerRow: React.FC<{
  index: number;
  style: React.CSSProperties;
  data: {
    employers: EmployerWithApprovals[];
  };
}> = ({ index, style, data }) => {
  const employer = data.employers[index];
  
  if (!employer) {
    return (
      <div style={style} className="flex items-center justify-center p-4 border-b border-gray-200">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div style={style} className="flex items-center p-4 border-b border-gray-200 hover:bg-gray-50">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{employer.employer_name}</div>
        <div className="text-sm text-gray-600">{employer.address}</div>
        <div className="text-xs text-gray-500">
          {employer.province_territory} • {employer.city}
        </div>
      </div>
      
      <div className="flex items-center space-x-4 text-sm">
        <div className="text-center">
          <div className="font-semibold text-blue-600">{employer.total_positions}</div>
          <div className="text-xs text-gray-500">Positions</div>
        </div>
        
        <div className="text-center">
          <div className="font-semibold text-green-600">{employer.total_lmias}</div>
          <div className="text-xs text-gray-500">LMIAs</div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-gray-500 max-w-20 truncate">
            {employer.primary_program}
          </div>
        </div>
      </div>
    </div>
  );
};

// Virtualized statistics list component
const VirtualizedStatisticsList: React.FC<VirtualizedStatisticsListProps> = ({
  employers,
  height = 400,
  itemHeight = 80
}) => {
  // Memoize the data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    employers: employers
  }), [employers]);

  // Calculate total statistics
  const totalStats = useMemo(() => {
    const totalPositions = employers.reduce((sum, emp) => sum + emp.total_positions, 0);
    const totalLMIAs = employers.reduce((sum, emp) => sum + emp.total_lmias, 0);
    const uniqueProvinces = new Set(employers.map(emp => emp.province_territory)).size;
    const uniqueCities = new Set(employers.map(emp => emp.city)).size;

    return {
      totalPositions,
      totalLMIAs,
      uniqueProvinces,
      uniqueCities
    };
  }, [employers]);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header with statistics */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Employer Statistics</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalStats.totalPositions.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Positions</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalStats.totalLMIAs.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total LMIAs</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalStats.uniqueProvinces}</div>
            <div className="text-sm text-gray-600">Provinces</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{totalStats.uniqueCities}</div>
            <div className="text-sm text-gray-600">Cities</div>
          </div>
        </div>
      </div>

      {/* Virtual scrolling list */}
      <div className="relative">
        <List
          height={height}
          itemCount={employers.length}
          itemSize={itemHeight}
          itemData={itemData}
          overscanCount={5} // Render 5 extra items for smooth scrolling
        >
          {EmployerRow}
        </List>
        
        {/* Loading indicator overlay */}
        {employers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-gray-600">Loading employers...</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with performance info */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing {employers.length.toLocaleString()} employers
          </div>
          <div>
            Virtual scrolling enabled
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualizedStatisticsList;
