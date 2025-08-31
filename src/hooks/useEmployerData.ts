import { useState, useMemo, useCallback, useEffect } from 'react';
import { FilterState, Statistics, EmployerWithApprovals } from '../types/lmia';
// Removed mockData import - using real data only
import { loadComprehensiveLMIAData } from '../data/comprehensiveDataLoader';
import { loadServerData, checkServerHealth, ViewportBounds } from '../data/serverDataLoader';

// Get available data to set initial filters (will be updated from server)
const availableYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const latestYear = Math.max(...availableYears);
const latestQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];

const initialFilters: FilterState = {
  year: latestYear,
  quarter: latestQuarters[0] || '',
  program_stream: [],
  province_territory: [],
  noc_code: '',
  min_positions: 1,
  search_query: '',
  radius_km: 50
};

export const useEmployerData = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [employers, setEmployers] = useState<EmployerWithApprovals[]>([]);
  const [allEmployers, setAllEmployers] = useState<EmployerWithApprovals[]>([]); // For statistics
  // Removed approvals state - using employer data directly
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'mock' | 'excel' | 'server'>('mock');
  const [serverAvailable, setServerAvailable] = useState<boolean>(false);
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);
  const [renderStrategy, setRenderStrategy] = useState<string>('province_summary');
  const [totalAvailable, setTotalAvailable] = useState<number>(0);
  const [loadTime, setLoadTime] = useState<number>(0);


  // Check server availability and load data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if server is available
        const serverHealthy = await checkServerHealth();
        setServerAvailable(serverHealthy);
        
        if (serverHealthy) {
          console.log('Server is available, using server-based data loading');
          setDataSource('server');
          
          // Load initial data with full Canada viewport
          const initialBounds = {
            north: 90,
            south: -90,
            east: 180,
            west: -180,
            zoom: 4
          };
          
          try {
            const result = await loadServerData(filters.year, filters.quarter, initialBounds);
            setEmployers(result.employers);
            setAllEmployers(result.allEmployers || result.employers);
            // No approvals to set - using employer data directly
            setRenderStrategy(result.strategy);
            setTotalAvailable(result.totalAvailable);
            console.log(`Loaded initial server data: ${result.employers.length}/${result.totalAvailable} employers`);
          } catch (err) {
            console.error('Failed to load initial server data:', err);
            // Fall back to local data
            const excelEmployers = await loadComprehensiveLMIAData();
            if (excelEmployers.length > 0) {
              setEmployers(excelEmployers);
              setAllEmployers(excelEmployers);
              setDataSource('excel');
            } else {
              setEmployers([]);
              setAllEmployers([]);
              setDataSource('mock');
            }
          }
        } else {
          console.log('Server not available, falling back to local data loading');
          // Load local data as fallback
          const excelEmployers = await loadComprehensiveLMIAData();
          
          if (excelEmployers.length > 0) {
            setEmployers(excelEmployers);
            setAllEmployers(excelEmployers);
            setDataSource('excel');
            console.log(`Loaded ${excelEmployers.length} employers from local data`);
          } else {
            setEmployers([]);
            setAllEmployers([]);
            setDataSource('mock');
          }
        }
      } catch (err) {
        console.error('Failed to initialize data:', err);
        setEmployers([]);
        setAllEmployers([]);
        setDataSource('mock');
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [filters.year, filters.quarter]);



  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Function to update viewport and load optimized data
  const updateViewport = useCallback(async (bounds: ViewportBounds) => {
    setViewportBounds(bounds);
    
    if (dataSource === 'server') {
      setIsLoading(true);
      const startTime = performance.now();
      
      try {
        const result = await loadServerData(filters.year, filters.quarter, bounds);
        setEmployers(result.employers);
        setAllEmployers(result.allEmployers || result.employers);
        // No approvals to set - using employer data directly
        setRenderStrategy(result.strategy);
        setTotalAvailable(result.totalAvailable);
        setLoadTime(Math.round(performance.now() - startTime));
        
        console.log(`Server viewport update: ${result.employers.length}/${result.totalAvailable} employers (${result.strategy}) in ${Math.round(performance.now() - startTime)}ms`);
      } catch (err) {
        console.error('Failed to load server data:', err);
        setError('Failed to load server data');
      } finally {
        setIsLoading(false);
      }
    }
  }, [filters.year, filters.quarter, dataSource]);

  const filteredEmployers = useMemo(() => {
    // For now, just return employers directly since we're not using approvals
    return employers;
  }, [employers]);

  const statistics = useMemo((): Statistics => {
    const employers = allEmployers; // Use all employers for statistics, not just filtered ones
    
    // Calculate occupation distribution
    const occupationCounts = employers.reduce((acc, emp) => {
      const occupation = emp.primary_occupation || 'Unknown';
      acc[occupation] = (acc[occupation] || 0) + emp.total_positions;
      return acc;
    }, {} as Record<string, number>);

    // Calculate program distribution
    const programCounts = employers.reduce((acc, emp) => {
      const program = emp.primary_program || 'Unknown';
      acc[program] = (acc[program] || 0) + emp.total_positions;
      return acc;
    }, {} as Record<string, number>);

    // Calculate province distribution
    const provinceCounts = employers.reduce((acc, emp) => {
      acc[emp.province_territory] = (acc[emp.province_territory] || 0) + emp.total_positions;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_employers: employers.length,
      total_positions: employers.reduce((sum, emp) => sum + emp.total_positions, 0),
      total_lmias: employers.reduce((sum, emp) => sum + emp.total_lmias, 0),
      top_occupations: Object.entries(occupationCounts)
        .map(([occupation, count]) => ({ occupation, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      top_programs: Object.entries(programCounts)
        .map(([program, count]) => ({ program, count }))
        .sort((a, b) => b.count - a.count),
      provinces_distribution: Object.entries(provinceCounts)
        .map(([province, count]) => ({ province, count }))
        .sort((a, b) => b.count - a.count)
    };
  }, [allEmployers]);



  const exportData = useCallback(() => {
    const csvContent = [
      ['Employer Name', 'Address', 'Province', 'Total Positions', 'Total LMIAs', 'Primary Program', 'Primary Occupation'].join(','),
      ...filteredEmployers.map(emp => [
        `"${emp.employer_name}"`,
        `"${emp.address}"`,
        emp.province_territory,
        emp.total_positions,
        emp.total_lmias,
        emp.primary_program,
        `"${emp.primary_occupation}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lmia-data-${dataSource}-${filters.year}-${filters.quarter || 'all-quarters'}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, [filteredEmployers, filters, dataSource]);

  return {
    filters,
    updateFilters,
    employers: filteredEmployers,
    statistics,
    exportData,
    isLoading,
    error,
    dataSource,
    serverAvailable,
    updateViewport,
    viewportBounds,
    renderStrategy,
    totalAvailable,
    loadTime
  };
};