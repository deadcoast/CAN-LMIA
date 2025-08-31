import React from 'react';
import { Search, Download, Filter, MapPin, BarChart3, Map } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { purplePassionTheme } from '../theme/purplePassionTheme';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExportData: () => void;
  onToggleFilters: () => void;
  showFilters: boolean;
  dataSource: 'mock' | 'excel';
}

const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onExportData,
  onToggleFilters,
  showFilters,
  dataSource
}) => {
  const location = useLocation();
  return (
    <div 
      className="shadow-lg border-b sticky top-0 z-50"
      style={{ 
        backgroundColor: purplePassionTheme.backgrounds.card,
        borderColor: purplePassionTheme.borders.primary
      }}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div 
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ backgroundColor: purplePassionTheme.colors.primary }}
            >
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 
                className="text-xl font-bold"
                style={{ color: purplePassionTheme.text.primary }}
              >
                LMIA Database
              </h1>
              <p 
                className="text-sm"
                style={{ color: purplePassionTheme.text.secondary }}
              >
                Canadian Labour Market Impact Assessment Visualization
                {dataSource === 'excel' && (
                  <span 
                    className="ml-2 px-2 py-1 text-xs rounded-full"
                    style={{ 
                      backgroundColor: purplePassionTheme.colors.primary,
                      color: purplePassionTheme.text.primary
                    }}
                  >
                    Live Data
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
              </p>
            </div>
          </div>

          {/* Navigation and Actions */}
          <div className="flex items-center space-x-4">
            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <Link
                to="/"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === '/' 
                    ? 'shadow-md' 
                    : ''
                }`}
                style={{
                  backgroundColor: location.pathname === '/' 
                    ? purplePassionTheme.colors.primary 
                    : purplePassionTheme.backgrounds.surface,
                  color: location.pathname === '/' 
                    ? purplePassionTheme.text.primary 
                    : purplePassionTheme.text.secondary
                }}
              >
                <Map className="w-4 h-4" />
                <span className="font-medium">Map View</span>
              </Link>
              
              <Link
                to="/statistics"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === '/statistics' 
                    ? 'shadow-md' 
                    : ''
                }`}
                style={{
                  backgroundColor: location.pathname === '/statistics' 
                    ? purplePassionTheme.colors.primary 
                    : purplePassionTheme.backgrounds.surface,
                  color: location.pathname === '/statistics' 
                    ? purplePassionTheme.text.primary 
                    : purplePassionTheme.text.secondary
                }}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="font-medium">Statistics</span>
              </Link>
            </div>

            {/* Search Bar - Only show on Map page */}
            {location.pathname === '/' && (
              <div className="relative">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                  style={{ color: purplePassionTheme.text.secondary }}
                />
                <input
                  type="text"
                  placeholder="Search employers, locations, occupations..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all duration-200"
                  style={{
                    backgroundColor: purplePassionTheme.backgrounds.surface,
                    borderColor: purplePassionTheme.borders.primary,
                    color: purplePassionTheme.text.primary,
                    border: `1px solid ${purplePassionTheme.borders.primary}`
                  }}
                />
              </div>
            )}

            {/* Action Buttons */}
            {location.pathname === '/' && (
              <button
                onClick={onToggleFilters}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  showFilters ? 'shadow-md' : ''
                }`}
                style={{
                  backgroundColor: showFilters 
                    ? purplePassionTheme.colors.secondary 
                    : purplePassionTheme.backgrounds.surface,
                  color: showFilters 
                    ? purplePassionTheme.text.primary 
                    : purplePassionTheme.text.secondary
                }}
              >
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filters</span>
              </button>
            )}

            <button
              onClick={onExportData}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              style={{
                backgroundColor: purplePassionTheme.colors.accent,
                color: purplePassionTheme.text.primary
              }}
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;