import React, { useState, useEffect } from 'react';
import { Zap, Database, Eye, Clock } from 'lucide-react';
import { purplePassionTheme } from '../theme/purplePassionTheme';

interface PerformanceIndicatorProps {
  totalEmployers: number;
  visibleEmployers: number;
  strategy: string;
  isLoading: boolean;
  loadTime?: number;
}

const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({
  totalEmployers,
  visibleEmployers,
  strategy,
  isLoading,
  loadTime
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'province_summary': return 'Province Summary';
      case 'city_clusters': return 'City Clusters';
      case 'neighborhood_clusters': return 'Neighborhood Clusters';
      case 'individual_markers': return 'Individual Markers';
      default: return 'Unknown';
    }
  };

  const getPerformanceColor = (ratio: number) => {
    if (ratio > 0.8) return purplePassionTheme.colors.secondary;
    if (ratio > 0.5) return purplePassionTheme.colors.magenta;
    if (ratio > 0.1) return purplePassionTheme.colors.primary;
    return purplePassionTheme.colors.accent;
  };

  const efficiency = totalEmployers > 0 ? (visibleEmployers / totalEmployers) : 0;
  const performanceGain = totalEmployers > 0 ? Math.round((1 - efficiency) * 100) : 0;

  return (
    <div 
      className="rounded-lg shadow-md border p-3"
      style={{ 
        backgroundColor: purplePassionTheme.backgrounds.card,
        borderColor: purplePassionTheme.borders.primary
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap 
            className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`}
            style={{ 
              color: isLoading 
                ? purplePassionTheme.colors.magenta 
                : purplePassionTheme.colors.primary 
            }}
          />
          <span 
            className="text-sm font-medium"
            style={{ color: purplePassionTheme.text.secondary }}
          >
            {isLoading ? 'Loading...' : 'Optimized'}
          </span>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-medium"
          style={{ 
            color: purplePassionTheme.colors.accent
          }}
        >
          {showDetails ? 'Hide' : 'Details'}
        </button>
      </div>

      {showDetails && (
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Database 
                className="w-3 h-3" 
                style={{ color: purplePassionTheme.text.secondary }}
              />
              <span style={{ color: purplePassionTheme.text.secondary }}>Total Data:</span>
            </div>
            <span 
              className="font-medium"
              style={{ color: purplePassionTheme.text.primary }}
            >
              {totalEmployers.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Eye 
                className="w-3 h-3" 
                style={{ color: purplePassionTheme.text.secondary }}
              />
              <span style={{ color: purplePassionTheme.text.secondary }}>Visible:</span>
            </div>
            <span 
              className="font-medium"
              style={{ color: getPerformanceColor(efficiency) }}
            >
              {visibleEmployers.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Zap 
                className="w-3 h-3" 
                style={{ color: purplePassionTheme.text.secondary }}
              />
              <span style={{ color: purplePassionTheme.text.secondary }}>Strategy:</span>
            </div>
            <span 
              className="font-medium"
              style={{ color: purplePassionTheme.colors.accent }}
            >
              {getStrategyDescription(strategy)}
            </span>
          </div>
          
          {loadTime && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Clock 
                  className="w-3 h-3" 
                  style={{ color: purplePassionTheme.text.secondary }}
                />
                <span style={{ color: purplePassionTheme.text.secondary }}>Load Time:</span>
              </div>
              <span 
                className="font-medium"
                style={{ color: purplePassionTheme.colors.primary }}
              >
                {loadTime}ms
              </span>
            </div>
          )}
          
          <div 
            className="pt-2 border-t"
            style={{ borderColor: purplePassionTheme.borders.primary }}
          >
            <div className="flex items-center justify-between">
              <span style={{ color: purplePassionTheme.text.secondary }}>Performance Gain:</span>
              <span 
                className="font-bold"
                style={{ color: purplePassionTheme.colors.primary }}
              >
                {performanceGain}% faster
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceIndicator;
