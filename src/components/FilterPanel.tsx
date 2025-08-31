import React from 'react';
import { X } from 'lucide-react';
import { FilterState } from '../types/lmia';
import { purplePassionTheme } from '../theme/purplePassionTheme';
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
    <div 
      className="fixed inset-y-0 left-0 w-80 shadow-2xl z-40 border-r overflow-y-auto"
      style={{ 
        backgroundColor: purplePassionTheme.backgrounds.card,
        borderColor: purplePassionTheme.borders.primary
      }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 
            className="text-lg font-semibold"
            style={{ color: purplePassionTheme.text.primary }}
          >
            Advanced Filters
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors duration-200"
            style={{ 
              backgroundColor: purplePassionTheme.backgrounds.surface,
              color: purplePassionTheme.text.secondary
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Time Period */}
          <div className="space-y-4">
            <h3 
              className="text-sm font-medium border-b pb-2"
              style={{ 
                color: purplePassionTheme.text.primary,
                borderColor: purplePassionTheme.borders.primary
              }}
            >
              Time Period
            </h3>
            
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: purplePassionTheme.text.secondary }}
              >
                Year
              </label>
              <select
                value={filters.year}
                onChange={(e) => onFiltersChange({ year: parseInt(e.target.value) })}
                className="w-full p-2 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{
                  backgroundColor: purplePassionTheme.backgrounds.surface,
                  borderColor: purplePassionTheme.borders.primary,
                  color: purplePassionTheme.text.primary,
                  border: `1px solid ${purplePassionTheme.borders.primary}`
                }}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: purplePassionTheme.text.secondary }}
              >
                Quarter
              </label>
              <select
                value={filters.quarter}
                onChange={(e) => onFiltersChange({ quarter: e.target.value })}
                className="w-full p-2 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{
                  backgroundColor: purplePassionTheme.backgrounds.surface,
                  borderColor: purplePassionTheme.borders.primary,
                  color: purplePassionTheme.text.primary,
                  border: `1px solid ${purplePassionTheme.borders.primary}`
                }}
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
            <h3 
              className="text-sm font-medium border-b pb-2"
              style={{ 
                color: purplePassionTheme.text.primary,
                borderColor: purplePassionTheme.borders.primary
              }}
            >
              Program Streams
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {programStreams.map(stream => (
                <label 
                  key={stream} 
                  className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg"
                  style={{ 
                    backgroundColor: purplePassionTheme.backgrounds.surface
                  }}
                >
                  <input
                    type="checkbox"
                    checked={filters.program_stream?.includes(stream) || false}
                    onChange={() => handleMultiSelectChange('program_stream', stream)}
                    className="w-4 h-4 rounded focus:ring-2"
                    style={{
                      accentColor: purplePassionTheme.colors.primary,
                      borderColor: purplePassionTheme.borders.primary
                    }}
                  />
                  <span 
                    className="text-sm"
                    style={{ color: purplePassionTheme.text.secondary }}
                  >
                    {stream}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Provinces */}
          <div className="space-y-3">
            <h3 
              className="text-sm font-medium border-b pb-2"
              style={{ 
                color: purplePassionTheme.text.primary,
                borderColor: purplePassionTheme.borders.primary
              }}
            >
              Provinces & Territories
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {provinces.map(province => (
                <label 
                  key={province} 
                  className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg"
                  style={{ 
                    backgroundColor: purplePassionTheme.backgrounds.surface
                  }}
                >
                  <input
                    type="checkbox"
                    checked={filters.province_territory?.includes(province) || false}
                    onChange={() => handleMultiSelectChange('province_territory', province)}
                    className="w-4 h-4 rounded focus:ring-2"
                    style={{
                      accentColor: purplePassionTheme.colors.primary,
                      borderColor: purplePassionTheme.borders.primary
                    }}
                  />
                  <span 
                    className="text-sm"
                    style={{ color: purplePassionTheme.text.secondary }}
                  >
                    {province}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Position Threshold */}
          <div className="space-y-3">
            <h3 
              className="text-sm font-medium border-b pb-2"
              style={{ 
                color: purplePassionTheme.text.primary,
                borderColor: purplePassionTheme.borders.primary
              }}
            >
              Position Requirements
            </h3>
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: purplePassionTheme.text.secondary }}
              >
                Minimum Approved Positions: {filters.min_positions}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={filters.min_positions}
                onChange={(e) => onFiltersChange({ min_positions: parseInt(e.target.value) })}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  backgroundColor: purplePassionTheme.backgrounds.surface,
                  accentColor: purplePassionTheme.colors.primary
                }}
              />
              <div 
                className="flex justify-between text-xs mt-1"
                style={{ color: purplePassionTheme.text.secondary }}
              >
                <span>1</span>
                <span>100+</span>
              </div>
            </div>
          </div>

          {/* NOC Code Search */}
          <div className="space-y-3">
            <h3 
              className="text-sm font-medium border-b pb-2"
              style={{ 
                color: purplePassionTheme.text.primary,
                borderColor: purplePassionTheme.borders.primary
              }}
            >
              Occupation
            </h3>
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: purplePassionTheme.text.secondary }}
              >
                NOC Code
              </label>
              <input
                type="text"
                placeholder="e.g., 21211"
                value={filters.noc_code}
                onChange={(e) => onFiltersChange({ noc_code: e.target.value })}
                className="w-full p-2 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{
                  backgroundColor: purplePassionTheme.backgrounds.surface,
                  borderColor: purplePassionTheme.borders.primary,
                  color: purplePassionTheme.text.primary,
                  border: `1px solid ${purplePassionTheme.borders.primary}`
                }}
              />
            </div>
          </div>

          {/* Clear Filters */}
          <div 
            className="pt-4 border-t"
            style={{ borderColor: purplePassionTheme.borders.primary }}
          >
            <button
              onClick={() => onFiltersChange({
                quarter: '',
                program_stream: [],
                province_territory: [],
                noc_code: '',
                min_positions: 1,
                search_query: ''
              })}
              className="w-full py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              style={{
                backgroundColor: purplePassionTheme.backgrounds.surface,
                color: purplePassionTheme.text.secondary
              }}
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