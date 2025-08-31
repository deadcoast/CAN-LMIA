import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { purplePassionTheme } from '../theme/purplePassionTheme';
// Available data configuration
const availableYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const availableQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];

interface YearSelectorProps {
  selectedYear: number;
  selectedQuarter: string;
  onYearChange: (year: number) => void;
  onQuarterChange: (quarter: string) => void;
}

const YearSelector: React.FC<YearSelectorProps> = ({
  selectedYear,
  selectedQuarter,
  onYearChange,
  onQuarterChange
}) => {
  const years = availableYears;
  return (
    <div 
      className="rounded-lg shadow-md border p-4"
      style={{ 
        backgroundColor: purplePassionTheme.backgrounds.card,
        borderColor: purplePassionTheme.borders.primary
      }}
    >
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar 
            className="w-5 h-5" 
            style={{ color: purplePassionTheme.colors.primary }}
          />
          <span 
            className="font-medium"
            style={{ color: purplePassionTheme.text.primary }}
          >
            Time Period
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Year Selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              className="appearance-none rounded-lg px-4 py-2 pr-8 font-semibold focus:ring-2 focus:border-transparent outline-none cursor-pointer transition-colors duration-200"
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
            <ChevronDown 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" 
              style={{ color: purplePassionTheme.colors.primary }}
            />
          </div>

          {/* Quarter Selector */}
          <div className="relative">
            <select
              value={selectedQuarter}
              onChange={(e) => onQuarterChange(e.target.value)}
              className="appearance-none rounded-lg px-4 py-2 pr-8 font-semibold focus:ring-2 focus:border-transparent outline-none cursor-pointer transition-colors duration-200"
              style={{
                backgroundColor: purplePassionTheme.backgrounds.surface,
                borderColor: purplePassionTheme.borders.primary,
                color: purplePassionTheme.text.primary,
                border: `1px solid ${purplePassionTheme.borders.primary}`
              }}
            >
              <option value="">All Quarters</option>
              {availableQuarters.map(quarter => (
                <option key={quarter} value={quarter}>{quarter}</option>
              ))}
            </select>
            <ChevronDown 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" 
              style={{ color: purplePassionTheme.colors.secondary }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearSelector;