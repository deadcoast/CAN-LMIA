import React, { useState, useMemo } from 'react';
import { Statistics, EmployerWithApprovals } from '../types/lmia';
import ProvincialDistributionChart from './charts/ProvincialDistributionChart';
import OccupationTrendChart from './charts/OccupationTrendChart';
import ProgramDistributionChart from './charts/ProgramDistributionChart';
import YearlyTrendChart from './charts/YearlyTrendChart';
import QuarterlyAnalysisChart from './charts/QuarterlyAnalysisChart';
import { TrendingUp, Users, Briefcase, MapPin, Calendar, BarChart3 } from 'lucide-react';
import { purplePassionTheme } from '../theme/purplePassionTheme';

interface EnhancedStatisticsViewProps {
  statistics: Statistics;
  employers: EmployerWithApprovals[];
  isLoading?: boolean;
}

const EnhancedStatisticsView: React.FC<EnhancedStatisticsViewProps> = ({
  employers,
  isLoading = false
}) => {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<string | 'all'>('all');

  // Get available years and quarters from data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    employers.forEach(employer => {
      employer.approvals.forEach(approval => {
        years.add(approval.year);
      });
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [employers]);

  const availableQuarters = useMemo(() => {
    const quarters = new Set<string>();
    employers.forEach(employer => {
      employer.approvals.forEach(approval => {
        if (selectedYear === 'all' || approval.year === selectedYear) {
          quarters.add(approval.quarter);
        }
      });
    });
    return Array.from(quarters).sort();
  }, [employers, selectedYear]);

  // Filter data based on selected year and quarter
  const filteredEmployers = useMemo(() => {
    return employers.filter(employer => {
      return employer.approvals.some(approval => {
        const yearMatch = selectedYear === 'all' || approval.year === selectedYear;
        const quarterMatch = selectedQuarter === 'all' || approval.quarter === selectedQuarter;
        return yearMatch && quarterMatch;
      });
    });
  }, [employers, selectedYear, selectedQuarter]);

  // Calculate filtered statistics
  const filteredStatistics = useMemo(() => {
    const filteredApprovals = filteredEmployers.flatMap(emp => emp.approvals);
    
    const occupationCounts: Record<string, number> = {};
    const programCounts: Record<string, number> = {};
    const provinceCounts: Record<string, number> = {};
    
    let totalPositions = 0;
    let totalLMIAs = 0;
    
    filteredApprovals.forEach(approval => {
      // Occupations
      occupationCounts[approval.occupation] = (occupationCounts[approval.occupation] || 0) + 1;
      
      // Programs
      programCounts[approval.program_stream] = (programCounts[approval.program_stream] || 0) + 1;
      
      // Provinces
      const employer = filteredEmployers.find(emp => emp.id === approval.employer_id);
      if (employer) {
        provinceCounts[employer.province_territory] = (provinceCounts[employer.province_territory] || 0) + 1;
      }
      
      totalPositions += approval.approved_positions;
      totalLMIAs += approval.approved_lmias;
    });

    return {
      total_employers: filteredEmployers.length,
      total_positions: totalPositions,
      total_lmias: totalLMIAs,
      top_occupations: Object.entries(occupationCounts)
        .map(([occupation, count]) => ({ occupation, count }))
        .sort((a, b) => b.count - a.count),
      top_programs: Object.entries(programCounts)
        .map(([program, count]) => ({ program, count }))
        .sort((a, b) => b.count - a.count),
      provinces_distribution: Object.entries(provinceCounts)
        .map(([province, count]) => ({ province, count }))
        .sort((a, b) => b.count - a.count)
    };
  }, [filteredEmployers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div 
      className="space-y-6 min-h-screen p-4"
      style={{ backgroundColor: purplePassionTheme.backgrounds.primary }}
    >
      {/* Header with Filters */}
      <div 
        className="rounded-lg shadow-md border p-6"
        style={{ 
          backgroundColor: purplePassionTheme.backgrounds.card,
          borderColor: purplePassionTheme.borders.primary
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 
              className="text-2xl font-bold"
              style={{ color: purplePassionTheme.text.primary }}
            >
              LMIA Statistics Dashboard
            </h1>
            <p 
              className="mt-1"
              style={{ color: purplePassionTheme.text.secondary }}
            >
              Comprehensive analysis of Canadian Labour Market Impact Assessment data
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Calendar 
                className="w-5 h-5" 
                style={{ color: purplePassionTheme.text.secondary }}
              />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: purplePassionTheme.backgrounds.surface,
                  borderColor: purplePassionTheme.borders.primary,
                  color: purplePassionTheme.text.primary,
                  border: `1px solid ${purplePassionTheme.borders.primary}`
                }}
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <BarChart3 
                className="w-5 h-5" 
                style={{ color: purplePassionTheme.text.secondary }}
              />
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: purplePassionTheme.backgrounds.surface,
                  borderColor: purplePassionTheme.borders.primary,
                  color: purplePassionTheme.text.primary,
                  border: `1px solid ${purplePassionTheme.borders.primary}`
                }}
              >
                <option value="all">All Quarters</option>
                {availableQuarters.map(quarter => (
                  <option key={quarter} value={quarter}>{quarter}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="rounded-lg shadow-md p-6 text-white"
          style={{ background: purplePassionTheme.gradients.primary }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total Employers</p>
              <p className="text-3xl font-bold">{filteredStatistics.total_employers.toLocaleString()}</p>
            </div>
            <Briefcase className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div 
          className="rounded-lg shadow-md p-6 text-white"
          style={{ background: purplePassionTheme.gradients.secondary }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total Positions</p>
              <p className="text-3xl font-bold">{filteredStatistics.total_positions.toLocaleString()}</p>
            </div>
            <Users className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div 
          className="rounded-lg shadow-md p-6 text-white"
          style={{ background: purplePassionTheme.gradients.accent }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total LMIAs</p>
              <p className="text-3xl font-bold">{filteredStatistics.total_lmias.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div 
          className="rounded-lg shadow-md p-6 text-white"
          style={{ background: purplePassionTheme.gradients.dark }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Avg Positions/LMIA</p>
              <p className="text-3xl font-bold">
                {filteredStatistics.total_lmias > 0 
                  ? (filteredStatistics.total_positions / filteredStatistics.total_lmias).toFixed(1) 
                  : '0'}
              </p>
            </div>
            <MapPin className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProvincialDistributionChart 
          statistics={filteredStatistics} 
          title={`Provincial Distribution ${selectedYear !== 'all' ? `(${selectedYear})` : ''}`}
        />
        <ProgramDistributionChart 
          statistics={filteredStatistics}
          title={`Program Streams ${selectedYear !== 'all' ? `(${selectedYear})` : ''}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OccupationTrendChart 
          statistics={filteredStatistics}
          title={`Top Occupations ${selectedYear !== 'all' ? `(${selectedYear})` : ''}`}
        />
        <YearlyTrendChart 
          employers={filteredEmployers}
          title="Yearly Trends"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <QuarterlyAnalysisChart 
          employers={filteredEmployers}
          title="Quarterly Analysis"
        />
      </div>
    </div>
  );
};

export default EnhancedStatisticsView;
