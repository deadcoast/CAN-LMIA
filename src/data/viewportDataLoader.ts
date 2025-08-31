import { Employer, LMIAApproval } from '../types/lmia';
import { loadComprehensiveLMIAData } from './comprehensiveDataLoader';

// Viewport bounds interface
export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  zoom: number;
}

// Cached data to avoid reloading
let cachedData: { [key: string]: { employers: Employer[]; approvals: LMIAApproval[] } } = {};
let currentYear = 0;
let currentQuarter = '';

// Function to filter employers by viewport bounds
export function filterEmployersByViewport(
  employers: Employer[], 
  bounds: ViewportBounds
): Employer[] {
  return employers.filter(employer => 
    employer.latitude >= bounds.south &&
    employer.latitude <= bounds.north &&
    employer.longitude >= bounds.west &&
    employer.longitude <= bounds.east
  );
}

// Function to get appropriate data based on zoom level
export function getRenderStrategy(zoom: number, bounds: ViewportBounds) {
  if (zoom < 5) {
    // Country view: Show province summaries
    return {
      strategy: 'province_summary',
      maxPoints: 50,
      description: 'Province-level aggregation'
    };
  } else if (zoom < 8) {
    // Regional view: Show city clusters
    return {
      strategy: 'city_clusters',
      maxPoints: 200,
      description: 'City-level clustering'
    };
  } else if (zoom < 12) {
    // City view: Show neighborhood clusters
    return {
      strategy: 'neighborhood_clusters',
      maxPoints: 500,
      description: 'Neighborhood-level clustering'
    };
  } else {
    // Street level: Show individual employers
    return {
      strategy: 'individual_markers',
      maxPoints: 1000,
      description: 'Individual employer markers'
    };
  }
}

// Main function to load viewport-optimized data
export async function loadViewportData(
  year: number, 
  quarter: string, 
  bounds: ViewportBounds
): Promise<{ employers: Employer[]; approvals: LMIAApproval[]; strategy: string; totalAvailable: number }> {
  
  const cacheKey = `${year}-${quarter}`;
  
  // Load full dataset if not cached or year/quarter changed
  if (!cachedData[cacheKey] || currentYear !== year || currentQuarter !== quarter) {
    console.log(`Loading full dataset for ${year} ${quarter}`);
    const employers = await loadComprehensiveLMIAData();
    const fullData = { employers, approvals: [] };
    cachedData[cacheKey] = fullData;
    currentYear = year;
    currentQuarter = quarter;
  }
  
  const fullData = cachedData[cacheKey];
  const strategy = getRenderStrategy(bounds.zoom, bounds);
  
  // Filter to viewport
  const viewportEmployers = filterEmployersByViewport(fullData.employers, bounds);
  
  // Apply strategy-based filtering
  let filteredEmployers = viewportEmployers;
  
  if (strategy.strategy === 'province_summary') {
    // Group by province and take top employers per province
    const provinceGroups: { [key: string]: Employer[] } = {};
    viewportEmployers.forEach(emp => {
      if (!provinceGroups[emp.province_territory]) {
        provinceGroups[emp.province_territory] = [];
      }
      provinceGroups[emp.province_territory].push(emp);
    });
    
    filteredEmployers = Object.values(provinceGroups)
      .map(provinceEmps => 
        provinceEmps.sort((a, b) => (b as any).total_positions - (a as any).total_positions).slice(0, 5)
      )
      .flat();
  } else if (strategy.strategy === 'city_clusters') {
    // Group by city and take top employers per city
    const cityGroups: { [key: string]: Employer[] } = {};
    viewportEmployers.forEach(emp => {
      const cityKey = `${emp.city}-${emp.province_territory}`;
      if (!cityGroups[cityKey]) {
        cityGroups[cityKey] = [];
      }
      cityGroups[cityKey].push(emp);
    });
    
    filteredEmployers = Object.values(cityGroups)
      .map(cityEmps => 
        cityEmps.sort((a, b) => (b as any).total_positions - (a as any).total_positions).slice(0, 10)
      )
      .flat();
  }
  
  // Limit to max points for performance
  filteredEmployers = filteredEmployers.slice(0, strategy.maxPoints);
  
  // Get corresponding approvals
  const filteredApprovals = fullData.approvals.filter(approval => 
    filteredEmployers.some(emp => emp.id === approval.employer_id)
  );
  
  console.log(`Viewport data: ${filteredEmployers.length}/${viewportEmployers.length} employers (${strategy.description})`);
  
  return {
    employers: filteredEmployers,
    approvals: filteredApprovals,
    strategy: strategy.strategy,
    totalAvailable: viewportEmployers.length
  };
}

// Function to clear cache (useful for memory management)
export function clearDataCache() {
  cachedData = {};
  currentYear = 0;
  currentQuarter = '';
  console.log('Data cache cleared');
}

// Function to get cache statistics
export function getCacheStats() {
  const cacheKeys = Object.keys(cachedData);
  const totalEmployers = Object.values(cachedData).reduce((sum, data) => sum + data.employers.length, 0);
  const totalApprovals = Object.values(cachedData).reduce((sum, data) => sum + data.approvals.length, 0);
  
  return {
    cachedPeriods: cacheKeys.length,
    totalEmployers,
    totalApprovals,
    currentYear,
    currentQuarter
  };
}
