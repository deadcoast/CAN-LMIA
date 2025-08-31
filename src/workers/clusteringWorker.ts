// Web Worker for clustering calculations
// This runs in the background to prevent blocking the main thread

interface Employer {
  id: string;
  latitude: number;
  longitude: number;
  total_positions: number;
  primary_program: string;
}

interface ClusterPoint {
  type: 'Feature';
  properties: {
    employer: Employer;
    cluster: boolean;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

interface ClusterResult {
  type: 'cluster' | 'point';
  lat: number;
  lng: number;
  count?: number;
  points?: Employer[];
  employer?: Employer;
}

// Simple clustering algorithm
function clusterPoints(points: ClusterPoint[], radius: number = 40, minPoints: number = 2): ClusterResult[] {
  const clusters: ClusterResult[] = [];
  const processed = new Set<number>();
  
  points.forEach((point, index) => {
    if (processed.has(index)) return;
    
    const cluster: ClusterResult = {
      type: 'cluster',
      lat: point.geometry.coordinates[1],
      lng: point.geometry.coordinates[0],
      count: 1,
      points: [point.properties.employer]
    };
    
    // Find nearby points
    for (let i = index + 1; i < points.length; i++) {
      if (processed.has(i)) continue;
      
      const distance = Math.sqrt(
        Math.pow(point.geometry.coordinates[1] - points[i].geometry.coordinates[1], 2) + 
        Math.pow(point.geometry.coordinates[0] - points[i].geometry.coordinates[0], 2)
      );
      
      // Convert radius from meters to degrees (rough approximation)
      const radiusInDegrees = radius / 111000;
      
      if (distance < radiusInDegrees) {
        cluster.count!++;
        cluster.points!.push(points[i].properties.employer);
        processed.add(i);
      }
    }
    
    processed.add(index);
    
    // Only create cluster if it has enough points
    if (cluster.count! >= minPoints) {
      clusters.push(cluster);
    } else {
      // Add individual points
      cluster.points!.forEach(emp => {
        clusters.push({
          type: 'point',
          lat: emp.latitude,
          lng: emp.longitude,
          employer: emp
        });
      });
    }
  });
  
  return clusters;
}

// Handle messages from main thread
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  try {
    switch (type) {
      case 'ready':
        // Worker is ready
        self.postMessage({
          type: 'ready'
        });
        break;
        
      case 'cluster':
        const { points, radius, minPoints } = data;
        const clusters = clusterPoints(points, radius, minPoints);
        
        self.postMessage({
          type: 'cluster_result',
          data: clusters
        });
        break;
        
      case 'aggregate':
        const { employers, groupBy } = data;
        const aggregated = aggregateData(employers, groupBy);
        
        self.postMessage({
          type: 'aggregate_result',
          data: aggregated
        });
        break;
        
      default:
        self.postMessage({
          type: 'error',
          data: { message: 'Unknown message type' }
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      data: { message: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
};

// Aggregate data by region or city
function aggregateData(employers: Employer[], groupBy: 'province' | 'city'): { [key: string]: Employer[] } {
  const groups: { [key: string]: Employer[] } = {};
  
  employers.forEach(employer => {
    let key: string;
    
    if (groupBy === 'province') {
      // Extract province from address or use a default
      key = 'Unknown Province'; // In real implementation, extract from address
    } else {
      // Extract city from address or use a default
      key = 'Unknown City'; // In real implementation, extract from address
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(employer);
  });
  
  return groups;
}

// Export for TypeScript
export {};
