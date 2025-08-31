import { useRef, useCallback, useEffect, useState } from 'react';
import { EmployerWithApprovals } from '../types/lmia';

interface ClusterResult {
  type: 'cluster' | 'point';
  lat: number;
  lng: number;
  count?: number;
  points?: EmployerWithApprovals[];
  employer?: EmployerWithApprovals;
}

interface UseClusteringWorkerReturn {
  clusterData: (employers: EmployerWithApprovals[], radius?: number, minPoints?: number) => Promise<ClusterResult[]>;
  aggregateData: (employers: EmployerWithApprovals[], groupBy: 'province' | 'city') => Promise<{ [key: string]: EmployerWithApprovals[] }>;
  isWorkerReady: boolean;
}

export const useClusteringWorker = (): UseClusteringWorkerReturn => {
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState<boolean>(false);

  // Initialize worker
  useEffect(() => {
    try {
      console.log('Initializing clustering worker...');
      // Create worker from the clustering worker file
      workerRef.current = new Worker(new URL('../workers/clusteringWorker.ts', import.meta.url), {
        type: 'module'
      });

      workerRef.current.onmessage = (e) => {
        const { type } = e.data;
        console.log('Worker message received:', type);
        if (type === 'ready') {
          console.log('Clustering worker is ready!');
          setIsWorkerReady(true);
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Clustering worker error:', error);
        setIsWorkerReady(false);
      };

      // Send ready message
      workerRef.current.postMessage({ type: 'ready' });

    } catch (error) {
      console.error('Failed to create clustering worker:', error);
      setIsWorkerReady(false);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Cluster data using worker
  const clusterData = useCallback(async (
    employers: EmployerWithApprovals[], 
    radius: number = 40, 
    minPoints: number = 2
  ): Promise<ClusterResult[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isWorkerReady.current) {
        console.warn('Worker not ready, falling back to main thread clustering');
        // Fallback to main thread clustering
        resolve(clusterDataMainThread(employers, radius, minPoints));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Clustering timeout'));
      }, 10000); // 10 second timeout

      const handleMessage = (e: MessageEvent) => {
        const { type, data } = e.data;
        
        if (type === 'cluster_result') {
          clearTimeout(timeout);
          workerRef.current?.removeEventListener('message', handleMessage);
          resolve(data);
        } else if (type === 'error') {
          clearTimeout(timeout);
          workerRef.current?.removeEventListener('message', handleMessage);
          reject(new Error(data.message));
        }
      };

      workerRef.current.addEventListener('message', handleMessage);

      // Convert employers to GeoJSON format
      const points = employers.map(employer => ({
        type: 'Feature' as const,
        properties: {
          employer: employer,
          cluster: false
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [employer.longitude, employer.latitude]
        }
      }));

      workerRef.current.postMessage({
        type: 'cluster',
        data: { points, radius, minPoints }
      });
    });
  }, []);

  // Aggregate data using worker
  const aggregateData = useCallback(async (
    employers: EmployerWithApprovals[], 
    groupBy: 'province' | 'city'
  ): Promise<{ [key: string]: EmployerWithApprovals[] }> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isWorkerReady.current) {
        console.warn('Worker not ready, falling back to main thread aggregation');
        // Fallback to main thread aggregation
        resolve(aggregateDataMainThread(employers, groupBy));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Aggregation timeout'));
      }, 5000); // 5 second timeout

      const handleMessage = (e: MessageEvent) => {
        const { type, data } = e.data;
        
        if (type === 'aggregate_result') {
          clearTimeout(timeout);
          workerRef.current?.removeEventListener('message', handleMessage);
          resolve(data);
        } else if (type === 'error') {
          clearTimeout(timeout);
          workerRef.current?.removeEventListener('message', handleMessage);
          reject(new Error(data.message));
        }
      };

      workerRef.current.addEventListener('message', handleMessage);

      workerRef.current.postMessage({
        type: 'aggregate',
        data: { employers, groupBy }
      });
    });
  }, []);

  return {
    clusterData,
    aggregateData,
    isWorkerReady
  };
};

// Fallback clustering function for main thread
function clusterDataMainThread(
  employers: EmployerWithApprovals[], 
  radius: number = 40, 
  minPoints: number = 2
): ClusterResult[] {
  const clusters: ClusterResult[] = [];
  const processed = new Set<number>();
  
  employers.forEach((employer, index) => {
    if (processed.has(index)) return;
    
    const cluster: ClusterResult = {
      type: 'cluster',
      lat: employer.latitude,
      lng: employer.longitude,
      count: 1,
      points: [employer]
    };
    
    // Find nearby points
    for (let i = index + 1; i < employers.length; i++) {
      if (processed.has(i)) continue;
      
      const distance = Math.sqrt(
        Math.pow(employer.latitude - employers[i].latitude, 2) + 
        Math.pow(employer.longitude - employers[i].longitude, 2)
      );
      
      // Convert radius from meters to degrees (rough approximation)
      const radiusInDegrees = radius / 111000;
      
      if (distance < radiusInDegrees) {
        cluster.count!++;
        cluster.points!.push(employers[i]);
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

// Fallback aggregation function for main thread
function aggregateDataMainThread(
  employers: EmployerWithApprovals[], 
  groupBy: 'province' | 'city'
): { [key: string]: EmployerWithApprovals[] } {
  const groups: { [key: string]: EmployerWithApprovals[] } = {};
  
  employers.forEach(employer => {
    const key = groupBy === 'province' ? employer.province_territory : employer.city;
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(employer);
  });
  
  return groups;
}
