import { EmployerWithApprovals } from '../types/lmia';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface RenderStrategy {
  strategy: 'heatmap' | 'clusters' | 'individual_markers';
  maxPoints: number;
  description: string;
}

export class LMIAMapManager {
  private map: any;
  private zoom: number;
  private data: EmployerWithApprovals[];
  private currentStrategy: RenderStrategy;
  private isLoading: boolean = false;
  private onLoadingChange?: (loading: boolean) => void;
  private onStrategyChange?: (strategy: RenderStrategy) => void;

  constructor(map: any, onLoadingChange?: (loading: boolean) => void, onStrategyChange?: (strategy: RenderStrategy) => void) {
    this.map = map;
    this.zoom = map.getZoom();
    this.data = [];
    this.currentStrategy = this.getRenderStrategy(this.zoom);
    this.onLoadingChange = onLoadingChange;
    this.onStrategyChange = onStrategyChange;

    // Listen for zoom changes
    this.map.on('zoomend', () => {
      this.zoom = this.map.getZoom();
      this.renderBasedOnZoom();
    });
  }

  // Load data for a specific year
  async loadData(year: number, quarter: string = 'Q1'): Promise<void> {
    this.showLoading();
    
    try {
      // Fetch data from server
      const bounds = this.getMapBounds();
      const params = new URLSearchParams({
        north: bounds.north.toString(),
        south: bounds.south.toString(),
        east: bounds.east.toString(),
        west: bounds.west.toString(),
        zoom: this.zoom.toString(),
        year: year.toString(),
        quarter: quarter
      });
      
      const response = await fetch(`http://localhost:3001/api/employers?${params}`);
      const result = await response.json();
      
      // Convert server response to our format
      this.data = result.type === 'clusters' 
        ? result.clusters.flatMap((cluster: any) => cluster.points)
        : result.markers || [];
      
      this.renderBasedOnZoom();
    } catch (error) {
      console.error('Failed to load data:', error);
      this.data = [];
    } finally {
      this.hideLoading();
    }
  }

  // Render based on current zoom level
  renderBasedOnZoom(): void {
    const newStrategy = this.getRenderStrategy(this.zoom);
    
    if (newStrategy.strategy !== this.currentStrategy.strategy) {
      this.currentStrategy = newStrategy;
      this.onStrategyChange?.(this.currentStrategy);
    }

    const zoom = this.zoom;
    
    if (zoom < 7) {
      // Show heatmap or aggregated province/city counts
      this.renderHeatmap();
    } else if (zoom < 12) {
      // Show clusters
      this.renderClusters();
    } else {
      // Show individual markers for visible area only
      this.renderVisibleMarkers();
    }
  }

  // Get render strategy based on zoom level
  private getRenderStrategy(zoom: number): RenderStrategy {
    if (zoom < 7) {
      return {
        strategy: 'heatmap',
        maxPoints: 50,
        description: 'Province-level heatmap'
      };
    } else if (zoom < 12) {
      return {
        strategy: 'clusters',
        maxPoints: 500,
        description: 'City-level clusters'
      };
    } else {
      return {
        strategy: 'individual_markers',
        maxPoints: 1000,
        description: 'Individual employer markers'
      };
    }
  }

  // Render heatmap for low zoom levels
  private renderHeatmap(): void {
    console.log('Rendering heatmap for zoom level:', this.zoom);
    
    // Aggregate data by province
    const provinceData = this.aggregateByRegion(this.data);
    
    // Create heatmap markers for each province
    this.clearMarkers();
    
    Object.entries(provinceData).forEach(([province, employers]) => {
      if (employers.length === 0) return;
      
      // Calculate center point for province
      const centerLat = employers.reduce((sum, emp) => sum + emp.latitude, 0) / employers.length;
      const centerLng = employers.reduce((sum, emp) => sum + emp.longitude, 0) / employers.length;
      
      // Create heatmap marker
      const heatIntensity = Math.min(employers.length / 100, 1); // Normalize to 0-1
      const marker = this.createHeatmapMarker(centerLat, centerLng, employers.length, heatIntensity);
      
      this.map.addLayer(marker);
    });
  }

  // Render clusters for medium zoom levels
  private renderClusters(): void {
    console.log('Rendering clusters for zoom level:', this.zoom);
    
    // Use existing clustering logic
    this.clearMarkers();
    
    // Group by city and create cluster markers
    const cityGroups = this.groupByCity(this.data);
    
    Object.entries(cityGroups).forEach(([city, employers]) => {
      if (employers.length === 0) return;
      
      const centerLat = employers.reduce((sum, emp) => sum + emp.latitude, 0) / employers.length;
      const centerLng = employers.reduce((sum, emp) => sum + emp.longitude, 0) / employers.length;
      
      const marker = this.createClusterMarker(centerLat, centerLng, employers.length);
      this.map.addLayer(marker);
    });
  }

  // Render individual markers for high zoom levels
  private renderVisibleMarkers(): void {
    console.log('Rendering individual markers for zoom level:', this.zoom);
    
    // Filter to visible area only
    const bounds = this.getMapBounds();
    const visibleEmployers = this.data.filter(emp => 
      emp.latitude >= bounds.south &&
      emp.latitude <= bounds.north &&
      emp.longitude >= bounds.west &&
      emp.longitude <= bounds.east
    );
    
    this.clearMarkers();
    
    // Limit to max points for performance
    const limitedEmployers = visibleEmployers.slice(0, this.currentStrategy.maxPoints);
    
    limitedEmployers.forEach(employer => {
      const marker = this.createIndividualMarker(employer);
      this.map.addLayer(marker);
    });
  }

  // Aggregate data by region (province)
  private aggregateByRegion(data: EmployerWithApprovals[]): { [key: string]: EmployerWithApprovals[] } {
    const regions: { [key: string]: EmployerWithApprovals[] } = {};
    
    data.forEach(employer => {
      const region = employer.province_territory;
      if (!regions[region]) {
        regions[region] = [];
      }
      regions[region].push(employer);
    });
    
    return regions;
  }

  // Group data by city
  private groupByCity(data: EmployerWithApprovals[]): { [key: string]: EmployerWithApprovals[] } {
    const cities: { [key: string]: EmployerWithApprovals[] } = {};
    
    data.forEach(employer => {
      const cityKey = `${employer.city}-${employer.province_territory}`;
      if (!cities[cityKey]) {
        cities[cityKey] = [];
      }
      cities[cityKey].push(employer);
    });
    
    return cities;
  }

  // Create heatmap marker
  private createHeatmapMarker(lat: number, lng: number, count: number, intensity: number): any {
    const size = Math.max(30, Math.min(80, count / 10));
    const color = this.getHeatmapColor(intensity);
    
    return (window as any).L.marker([lat, lng], {
      icon: (window as any).L.divIcon({
        html: `<div style="
          background: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 12px;
          border: 2px solid white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          ${count.toLocaleString()}
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      })
    });
  }

  // Create cluster marker
  private createClusterMarker(lat: number, lng: number, count: number): any {
    const size = Math.max(25, Math.min(50, count / 5));
    
    return (window as any).L.marker([lat, lng], {
      icon: (window as any).L.divIcon({
        html: `<div style="
          background: #2563eb;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 10px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          ${count}
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      })
    });
  }

  // Create individual marker
  private createIndividualMarker(employer: EmployerWithApprovals): any {
    const size = Math.min(Math.max(employer.total_positions / 5 + 20, 25), 40);
    const color = employer.primary_program === 'High-wage' ? '#0F4C75' : '#14B8A6';
    
    return (window as any).L.marker([employer.latitude, employer.longitude], {
      icon: (window as any).L.divIcon({
        html: `<div style="
          background: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 8px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          ${employer.total_positions}
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      })
    });
  }

  // Get heatmap color based on intensity
  private getHeatmapColor(intensity: number): string {
    if (intensity > 0.8) return '#dc2626'; // Dark red
    if (intensity > 0.6) return '#ea580c'; // Orange
    if (intensity > 0.4) return '#d97706'; // Amber
    if (intensity > 0.2) return '#ca8a04'; // Yellow
    return '#16a34a'; // Green
  }

  // Get current map bounds
  private getMapBounds(): MapBounds {
    const bounds = this.map.getBounds();
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };
  }

  // Clear all markers
  private clearMarkers(): void {
    this.map.eachLayer((layer: any) => {
      if (layer instanceof (window as any).L.Marker) {
        this.map.removeLayer(layer);
      }
    });
  }

  // Show loading indicator
  private showLoading(): void {
    this.isLoading = true;
    this.onLoadingChange?.(true);
  }

  // Hide loading indicator
  private hideLoading(): void {
    this.isLoading = false;
    this.onLoadingChange?.(false);
  }

  // Get current strategy
  getCurrentStrategy(): RenderStrategy {
    return this.currentStrategy;
  }

  // Get current data
  getCurrentData(): EmployerWithApprovals[] {
    return this.data;
  }

  // Check if loading
  isLoading(): boolean {
    return this.isLoading;
  }
}
