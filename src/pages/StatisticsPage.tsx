import React from 'react';
import StatisticsPanel from '../components/StatisticsPanel';
import EnhancedStatisticsView from '../components/EnhancedStatisticsView';
// import VirtualizedStatisticsList from '../components/VirtualizedStatisticsList';
import { useEmployerData } from '../hooks/useEmployerData';
import { purplePassionTheme } from '../theme/purplePassionTheme';

const StatisticsPage: React.FC = () => {
  const { 
    statistics, 
    employers,
    isLoading, 
    error, 
    dataSource 
  } = useEmployerData();

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: purplePassionTheme.backgrounds.primary }}
    >
      {/* Loading State */}
      {isLoading && (
        <div 
          className="p-4 border-b"
          style={{ 
            backgroundColor: purplePassionTheme.backgrounds.surface,
            borderColor: purplePassionTheme.borders.primary
          }}
        >
          <div className="flex items-center justify-center space-x-3">
            <div 
              className="animate-spin rounded-full h-6 w-6 border-b-2"
              style={{ borderColor: purplePassionTheme.colors.primary }}
            ></div>
            <span 
              className="font-medium"
              style={{ color: purplePassionTheme.text.primary }}
            >
              Loading LMIA data...
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div 
          className="p-4 border-b"
          style={{ 
            backgroundColor: purplePassionTheme.backgrounds.surface,
            borderColor: purplePassionTheme.borders.primary
          }}
        >
          <div className="flex items-center space-x-3">
            <div style={{ color: purplePassionTheme.colors.secondary }}>⚠️</div>
            <span style={{ color: purplePassionTheme.text.primary }}>{error}</span>
          </div>
        </div>
      )}

      {/* Data Source Indicator */}
      <div 
        className="p-4 border-b"
        style={{ 
          backgroundColor: purplePassionTheme.backgrounds.card,
          borderColor: purplePassionTheme.borders.primary
        }}
      >
        <div className="flex items-center justify-center space-x-4">
          <div 
            className="text-sm"
            style={{ color: purplePassionTheme.text.secondary }}
          >
            LMIA Statistics Dashboard
            {dataSource === 'excel' && (
              <span 
                className="ml-2 px-2 py-1 text-xs rounded-full"
                style={{ 
                  backgroundColor: purplePassionTheme.colors.primary,
                  color: purplePassionTheme.text.primary
                }}
              >
                Real Data
              </span>
            )}
            {dataSource === 'mock' && (
              <span 
                className="ml-2 px-2 py-1 text-xs rounded-full"
                style={{ 
                  backgroundColor: purplePassionTheme.colors.secondary,
                  color: purplePassionTheme.text.primary
                }}
              >
                Sample Data
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Statistics View */}
      <div className="p-6">
        <EnhancedStatisticsView 
          statistics={statistics} 
          employers={employers}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default StatisticsPage;
