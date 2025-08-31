import { Employer, LMIAApproval, EmployerWithApprovals } from '../types/lmia';

// Server API configuration
const SERVER_URL = 'http://localhost:3001';

// Viewport bounds interface
export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  zoom: number;
}

// Server response interfaces
interface ServerClusterResponse {
  type: 'clusters';
  total: number;
  clusters: Array<{
    type: 'cluster';
    lat: number;
    lng: number;
    count: number;
    points: Employer[];
  }>;
  strategy: string;
}

interface ServerMarkerResponse {
  type: 'markers';
  total: number;
  showing: number;
  markers: Employer[];
  strategy: string;
}

type ServerResponse = ServerClusterResponse | ServerMarkerResponse;

// Convert server employer data to our format
function convertServerEmployer(serverEmp: any): EmployerWithApprovals {
  return {
    id: serverEmp.id || `${serverEmp.employer_name}-${serverEmp.province_territory}`.replace(/\s+/g, '-').toLowerCase(),
    employer_name: serverEmp.employer_name,
    address: serverEmp.address,
    city: serverEmp.city,
    province_territory: serverEmp.province_territory,
    postal_code: serverEmp.postal_code || '',
    latitude: serverEmp.latitude,
    longitude: serverEmp.longitude,
    incorporate_status: serverEmp.incorporate_status || 'Unknown',
    approvals: [], // No approvals data from server
    total_positions: serverEmp.total_positions || 1,
    total_lmias: serverEmp.total_lmias || 1,
    primary_program: serverEmp.primary_program || 'Unknown',
    primary_occupation: serverEmp.primary_occupation || 'Unknown'
  };
}

// Convert server response to our data format
function convertServerResponse(response: ServerResponse): { employers: EmployerWithApprovals[]; approvals: LMIAApproval[]; strategy: string; totalAvailable: number; allEmployers?: EmployerWithApprovals[] } {
  let employers: EmployerWithApprovals[] = [];
  let approvals: LMIAApproval[] = [];
  let allEmployers: EmployerWithApprovals[] = [];
  
  if (response.type === 'clusters') {
    // Create cluster representations for map display (performance)
    employers = response.clusters.map((cluster, index) => {
      // Create a representative employer for the cluster
      const representativeEmployer = convertServerEmployer(cluster.points[0]);
      
      return {
        ...representativeEmployer,
        id: `cluster-${index}`,
        employer_name: `Cluster (${cluster.count} employers)`,
        total_positions: cluster.points.reduce((sum, point) => sum + (point.total_positions || 1), 0),
        total_lmias: cluster.points.length,
        primary_program: 'Cluster',
        primary_occupation: `${cluster.count} employers`,
        // Store cluster data for potential expansion
        clusterData: {
          count: cluster.count,
          points: cluster.points.map(convertServerEmployer)
        }
      } as EmployerWithApprovals & { clusterData?: any };
    });
    
    // Extract all individual employers for statistics
    allEmployers = response.clusters.flatMap(cluster => 
      cluster.points.map(convertServerEmployer)
    );
    
    // No dummy approvals - use real data from server
    approvals = [];
  } else if (response.type === 'markers') {
    employers = response.markers.map(convertServerEmployer);
    allEmployers = employers; // Same data for both
    // No dummy approvals - use real data from server
    approvals = [];
  }
  
  return {
    employers,
    approvals,
    strategy: response.strategy,
    totalAvailable: response.total,
    allEmployers
  };
}

// Main function to load data from server
export async function loadServerData(
  year: number, 
  quarter: string, 
  bounds: ViewportBounds
): Promise<{ employers: EmployerWithApprovals[]; approvals: LMIAApproval[]; strategy: string; totalAvailable: number; allEmployers?: EmployerWithApprovals[] }> {
  
  try {
    const params = new URLSearchParams({
      north: bounds.north.toString(),
      south: bounds.south.toString(),
      east: bounds.east.toString(),
      west: bounds.west.toString(),
      zoom: bounds.zoom.toString(),
      year: year.toString(),
      quarter: quarter
    });
    
    const response = await fetch(`${SERVER_URL}/api/employers?${params}`);
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    const serverResponse: ServerResponse = await response.json();
    const result = convertServerResponse(serverResponse);
    
    console.log(`Server data: ${result.employers.length}/${result.totalAvailable} employers (${result.strategy})`);
    
    return result;
  } catch (error) {
    console.error('Failed to load data from server:', error);
    throw error;
  }
}

// Function to get available data from server
export async function getServerAvailableData(): Promise<{ years: number[]; quarters: { [year: number]: string[] } }> {
  try {
    const response = await fetch(`${SERVER_URL}/api/available-data`);
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get available data from server:', error);
    return { years: [2025], quarters: { 2025: ['Q1'] } };
  }
}

// Function to check server health
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER_URL}/api/health`);
    return response.ok;
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
}
