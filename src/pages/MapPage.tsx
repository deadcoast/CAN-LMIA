import React, { useState } from 'react';
import FilterPanel from '../components/FilterPanel';
import ComprehensiveMapView from '../components/ComprehensiveMapView';
import EmployerModal from '../components/EmployerModal';
import YearSelector from '../components/YearSelector';
import PerformanceIndicator from '../components/PerformanceIndicator';
import { useEmployerData } from '../hooks/useEmployerData';
import { EmployerWithApprovals } from '../types/lmia';

const MapPage: React.FC = () => {
  const { 
    filters, 
    updateFilters, 
    employers, 
    isLoading, 
    error, 
    dataSource,
    serverAvailable,
    updateViewport,
    renderStrategy,
    totalAvailable,
    loadTime
  } = useEmployerData();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState<EmployerWithApprovals | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex h-screen">
        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFiltersChange={updateFilters}
          onClose={() => setShowFilters(false)}
          isOpen={showFilters}
        />

        {/* Main Map Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${showFilters ? 'ml-80' : 'ml-0'}`}>
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

          {/* Controls Bar */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <YearSelector
                selectedYear={filters.year}
                selectedQuarter={filters.quarter}
                onYearChange={(year) => updateFilters({ year })}
                onQuarterChange={(quarter) => updateFilters({ quarter })}
              />
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-blue-600">{employers.length}</span> employers
                  {dataSource === 'server' && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Server Optimized
                    </span>
                  )}
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
                
                {/* Performance Indicator */}
                {(dataSource === 'excel' || dataSource === 'server') && (
                  <PerformanceIndicator
                    totalEmployers={totalAvailable}
                    visibleEmployers={employers.length}
                    strategy={renderStrategy}
                    isLoading={isLoading}
                    loadTime={loadTime}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 p-4">
            <ComprehensiveMapView
              employers={employers}
              onEmployerSelect={setSelectedEmployer}
              onViewportChange={updateViewport}
            />
          </div>
        </div>
      </div>

      {/* Employer Detail Modal */}
      <EmployerModal
        employer={selectedEmployer}
        onClose={() => setSelectedEmployer(null)}
      />

      {/* Overlay for mobile filter panel */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}
    </div>
  );
};

export default MapPage;
