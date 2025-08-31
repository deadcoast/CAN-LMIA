import React from 'react';
import { X } from 'lucide-react';
import { FilterState } from '../types/lmia';
// Real filter data - will be populated from server
const programStreams = ['High Wage', 'Low Wage', 'Seasonal Agricultural Worker Program', 'Other'];
const provinces = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 
  'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 
  'Saskatchewan', 'Yukon'
];
const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
const years = [2020, 2021, 2022, 2023, 2024, 2025];

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClose: () => void;
  isOpen: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onClose,
  isOpen
}) => {
  if (!isOpen) return null;

  const handleMultiSelectChange = (
    field: 'program_stream' | 'province_territory',
    value: string
  ) => {
    const currentValues = filters[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({ [field]: newValues });
  };

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-40 border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Advanced Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Time Period */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Time Period</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={filters.year}
                onChange={(e) => onFiltersChange({ year: parseInt(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quarter</label>
              <select
                value={filters.quarter}
                onChange={(e) => onFiltersChange({ quarter: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">All Quarters</option>
                {quarters.map(quarter => (
                  <option key={quarter} value={quarter}>{quarter}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Program Streams */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Program Streams</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {programStreams.map(stream => (
                <label key={stream} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                  <input
                    type="checkbox"
                    checked={filters.program_stream?.includes(stream) || false}
                    onChange={() => handleMultiSelectChange('program_stream', stream)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{stream}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Provinces */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Provinces & Territories</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {provinces.map(province => (
                <label key={province} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                  <input
                    type="checkbox"
                    checked={filters.province_territory?.includes(province) || false}
                    onChange={() => handleMultiSelectChange('province_territory', province)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{province}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Position Threshold */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Position Requirements</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Approved Positions: {filters.min_positions}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={filters.min_positions}
                onChange={(e) => onFiltersChange({ min_positions: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>100+</span>
              </div>
            </div>
          </div>

          {/* NOC Code Search */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Occupation</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NOC Code</label>
              <input
                type="text"
                placeholder="e.g., 21211"
                value={filters.noc_code}
                onChange={(e) => onFiltersChange({ noc_code: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Clear Filters */}
          <div className="pt-4 border-t">
            <button
              onClick={() => onFiltersChange({
                quarter: '',
                program_stream: [],
                province_territory: [],
                noc_code: '',
                min_positions: 1,
                search_query: ''
              })}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;