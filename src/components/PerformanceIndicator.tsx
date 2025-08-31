import React, { useState, useEffect } from 'react';
import { Zap, Database, Eye, Clock } from 'lucide-react';

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
    if (ratio > 0.8) return 'text-red-600';
    if (ratio > 0.5) return 'text-yellow-600';
    if (ratio > 0.1) return 'text-green-600';
    return 'text-blue-600';
  };

  const efficiency = totalEmployers > 0 ? (visibleEmployers / totalEmployers) : 0;
  const performanceGain = totalEmployers > 0 ? Math.round((1 - efficiency) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className={`w-4 h-4 ${isLoading ? 'text-yellow-500 animate-pulse' : 'text-green-500'}`} />
          <span className="text-sm font-medium text-gray-700">
            {isLoading ? 'Loading...' : 'Optimized'}
          </span>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          {showDetails ? 'Hide' : 'Details'}
        </button>
      </div>

      {showDetails && (
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Database className="w-3 h-3 text-gray-500" />
              <span className="text-gray-600">Total Data:</span>
            </div>
            <span className="font-medium">{totalEmployers.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Eye className="w-3 h-3 text-gray-500" />
              <span className="text-gray-600">Visible:</span>
            </div>
            <span className={`font-medium ${getPerformanceColor(efficiency)}`}>
              {visibleEmployers.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3 text-gray-500" />
              <span className="text-gray-600">Strategy:</span>
            </div>
            <span className="font-medium text-blue-600">
              {getStrategyDescription(strategy)}
            </span>
          </div>
          
          {loadTime && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">Load Time:</span>
              </div>
              <span className="font-medium text-green-600">
                {loadTime}ms
              </span>
            </div>
          )}
          
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Performance Gain:</span>
              <span className="font-bold text-green-600">
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
