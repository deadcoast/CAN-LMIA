import React from 'react';
import StatisticsPanel from '../components/StatisticsPanel';
// import VirtualizedStatisticsList from '../components/VirtualizedStatisticsList';
import { useEmployerData } from '../hooks/useEmployerData';

const StatisticsPage: React.FC = () => {
  const { 
    statistics, 
    employers,
    isLoading, 
    error, 
    dataSource 
  } = useEmployerData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading State */}
      {isLoading && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 font-medium">Loading LMIA data...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center space-x-3">
            <div className="text-yellow-600">⚠️</div>
            <span className="text-yellow-700">{error}</span>
          </div>
        </div>
      )}

      {/* Data Source Indicator */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-center space-x-4">
          <div className="text-sm text-gray-600">
            LMIA Statistics Dashboard
            {dataSource === 'excel' && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Real Data
              </span>
            )}
            {dataSource === 'mock' && (
              <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                Sample Data
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Panel - Full Page */}
      <div className="p-6 space-y-6">
        <StatisticsPanel statistics={statistics} isVisible={true} />
        
        {/* Virtualized Employer List - Temporarily disabled */}
        {!isLoading && !error && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employer List</h3>
            <div className="text-gray-600">
              Showing {employers.length} employers
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsPage;
