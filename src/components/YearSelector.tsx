import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { getAvailableData } from '../data/comprehensiveDataLoader';

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
  const { years, quarters } = getAvailableData();
  const availableQuarters = quarters[selectedYear] || [];
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Time Period</span>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Year Selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              className="appearance-none bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 pr-8 text-blue-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer hover:bg-blue-100 transition-colors duration-200"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-600 pointer-events-none" />
          </div>

          {/* Quarter Selector */}
          <div className="relative">
            <select
              value={selectedQuarter}
              onChange={(e) => onQuarterChange(e.target.value)}
              className="appearance-none bg-teal-50 border border-teal-200 rounded-lg px-4 py-2 pr-8 text-teal-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none cursor-pointer hover:bg-teal-100 transition-colors duration-200"
            >
              <option value="">All Quarters</option>
              {availableQuarters.map(quarter => (
                <option key={quarter} value={quarter}>{quarter}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-teal-600 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearSelector;