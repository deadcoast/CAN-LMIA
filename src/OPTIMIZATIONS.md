# MAP OPTIMIZATIONS

## Why the Map is Slow

With ~15k markers, you're likely rendering all of them as individual DOM elements, which causes:

- Browser rendering bottleneck (15k DOM nodes)
- Memory overhead for each marker instance
- Event listener multiplication
- Constant reflow/repaint calculations

## How Large-Scale Maps Handle This

Professional mapping applications use several key strategies:

### 1. **Clustering at Multiple Zoom Levels**

Since you mentioned clustering didn't work properly with zoom, here's a proper implementation approach:

```javascript
// Using Leaflet.markercluster as example
const markers = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 80,
    disableClusteringAtZoom: 16,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
});

// Add markers in chunks to prevent blocking
function addMarkersInChunks(data, chunkSize = 1000) {
    let index = 0;
    
    function addChunk() {
        const chunk = data.slice(index, index + chunkSize);
        chunk.forEach(item => {
            markers.addLayer(L.marker([item.lat, item.lng]));
        });
        
        index += chunkSize;
        if (index < data.length) {
            requestAnimationFrame(addChunk);
        }
    }
    
    addChunk();
}
```

### 2. **Server-Side Tile Generation**

Instead of sending all 15k points to the client:

- Generate vector tiles server-side using tools like Tippecanoe
- Serve only visible data for current viewport
- Use MapBox Vector Tiles (MVT) format

### 3. **Dynamic Loading Based on Viewport**

Only load data that's visible:

```javascript
// API endpoint that accepts bbox parameters
async function loadVisibleData(map) {
    const bounds = map.getBounds();
    const params = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        zoom: map.getZoom()
    };
    
    const response = await fetch(`/api/employers?${new URLSearchParams(params)}`);
    return response.json();
}

// Update on map move
map.on('moveend', debounce(() => {
    loadVisibleData(map).then(data => {
        updateMarkers(data);
    });
}, 300));
```

### 4. **Canvas/WebGL Rendering**

Use libraries that render to canvas instead of DOM:

```javascript
// Using Leaflet.Canvas-Markers for example
const ciLayer = L.canvasIconLayer({}).addTo(map);

// Add markers to canvas layer (much faster than DOM)
employers.forEach(employer => {
    const marker = L.marker([employer.lat, employer.lng], {
        icon: L.divIcon({
            html: '<div class="marker"></div>',
            iconSize: [20, 20]
        })
    });
    ciLayer.addLayer(marker);
});
```

### 5. **Progressive Enhancement Strategy**

```javascript
class LMIAMapManager {
    constructor(map) {
        this.map = map;
        this.zoom = map.getZoom();
        this.data = [];
    }
    
    loadData(year) {
        // Show loading indicator
        this.showLoading();
        
        // Fetch data
        fetch(`/api/lmia/${year}`)
            .then(res => res.json())
            .then(data => {
                this.data = data;
                this.renderBasedOnZoom();
            });
    }
    
    renderBasedOnZoom() {
        const zoom = this.map.getZoom();
        
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
    
    renderHeatmap() {
        // Use aggregated data points
        const heatData = this.aggregateByRegion(this.data);
        // Render using heatmap layer
    }
}
```

## Recommended Solution for Your Case

Given your Canadian LMIA database, I recommend:

1. **Immediate Fix**: Implement proper clustering with Supercluster

    ```javascript
    import Supercluster from 'supercluster';

    const index = new Supercluster({
        radius: 40,
        maxZoom: 16,
        minPoints: 2
    });

    // Load your points
    index.load(employers.map(e => ({
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [e.lng, e.lat]
        },
        properties: e
    })));

    // Get clusters for current viewport
    const clusters = index.getClusters(
        [west, south, east, north],
        Math.floor(map.getZoom())
    );
    ```

2. **Backend Optimization**: Add API endpoints that:

    - Return aggregated counts at low zoom levels
    - Filter by viewport boundaries
    - Implement pagination or chunking

3. **Frontend Optimization**:

    - Use Web Workers for clustering calculations
    - Implement virtual scrolling for the statistics view
    - Add debouncing to map interactions

This approach is how services like Google Maps, Airbnb, and other mapping platforms handle millions of points efficiently. The key is to never render everything at once - always filter, aggregate, or cluster based on what the user can actually see and interact with.

## The Correct Solution: Show Everything, Just Smarter

When zoomed out, you should show **ALL 15,000 points**, but in an aggregated way:

### 1. **Clusters Show Real Counts**

When zoomed out, show cluster markers with the ACTUAL count of employers:

```javascript
// This cluster represents ALL 3,847 employers in Toronto area
// Not just 500!
{
  type: 'cluster',
  count: 3847,  // Real total
  lat: 43.6532,
  lng: -79.3832
}
```

The cluster bubble would show "3,847" so users know there are thousands of employers there.

### 2. **Heat Maps for Density**

At country level, show a heat map where color intensity = number of employers:

- Dark red = 1000+ employers
- Orange = 500-1000
- Yellow = 100-500
- Light = <100

Users immediately see Toronto/Vancouver/Montreal are hot spots with thousands of employers.

### 3. **Progressive Detail Strategy**

```javascript
function getRenderStrategy(zoom, bounds) {
  if (zoom < 5) {
    // Country view: Show province summaries
    return {
      'Ontario': 6543,    // ALL employers in Ontario
      'British Columbia': 3201,  // ALL employers in BC
      'Quebec': 2847,     // ALL employers in Quebec
      // etc...
    };
  } else if (zoom < 8) {
    // Regional view: Show city clusters
    return {
      'Toronto': 3847,
      'Vancouver': 2103,
      'Montreal': 1502,
      // Every city with actual totals
    };
  } else if (zoom < 12) {
    // City view: Show neighborhood clusters
    // Still representing ALL employers
  } else {
    // Street level: Show individual employers
    // Here you finally show actual pins
  }
}
```

### 4. **Visual Indicators of Data Density**

```javascript
// Show count badges on clusters
function createClusterIcon(count) {
  let size, color;
  
  if (count > 1000) {
    size = 60;
    color = '#ff0000';  // Big red circle
  } else if (count > 500) {
    size = 50;
    color = '#ff6600';  // Orange
  } else if (count > 100) {
    size = 40;
    color = '#ffaa00';  // Yellow
  } else {
    size = 30;
    color = '#00ff00';  // Green
  }
  
  return L.divIcon({
    html: `<div style="background:${color}; width:${size}px; height:${size}px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">
            ${count.toLocaleString()}
          </div>`
  });
}
```

## Complete Example: Showing ALL Data Properly

```javascript
// Backend: Always return appropriate representation
app.get('/api/employers', (req, res) => {
  const { north, south, east, west, zoom } = req.query;
  
  // Filter to viewport
  const inBounds = lmiaData.filter(emp => 
    emp.lat >= south && emp.lat <= north && 
    emp.lng >= west && emp.lng <= east
  );
  
  if (zoom < 8) {
    // Return clusters/summaries that represent ALL data
    const clusters = clusterPoints(inBounds);
    res.json({
      type: 'clusters',
      total: inBounds.length,  // Tell frontend the real total
      clusters: clusters        // Aggregated representation
    });
  } else if (zoom < 12) {
    // Return smaller clusters
    const fineClusters = clusterPoints(inBounds, { radius: 20 });
    res.json({
      type: 'clusters',
      total: inBounds.length,
      clusters: fineClusters
    });
  } else {
    // Only at street level show individual markers
    // But still include total so user knows if there's more
    res.json({
      type: 'markers',
      total: inBounds.length,
      showing: Math.min(inBounds.length, 1000),
      markers: inBounds.slice(0, 1000)
    });
  }
});
```

## The Result Users See

1. **Zoomed out**: Map shows clusters saying "3,847", "1,502", etc. - users see there's TONS of data
2. **Zooming in**: Clusters split into smaller clusters, still showing real counts
3. **Zoomed in fully**: Individual employer pins appear

Users always know the full scope of the data. The numbers on clusters represent the ACTUAL count of employers in that area, not some arbitrary limit.

This is how Google Maps shows millions of businesses - you see the density, just not 1 million individual pins at once (which would be a useless blob anyway).


----


You can absolutely test server-side tile generation in development! You don't need a web host - you'll run everything locally. Here's how:

## Understanding Server-Side Tiles

First, let me clarify what this means: instead of sending all 15k points to the browser, your local server will:
1. Pre-process the data into "tiles" (small chunks based on geographic areas)
2. Only send the tiles that are currently visible on the map

## Local Development Setup

### Option 1: Simple Node.js/Express Solution (Easiest)

Create a local Express server that serves filtered data:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

// Your LMIA data (load from JSON/CSV file)
const lmiaData = require('./lmia_2025.json');

// Endpoint that returns only visible employers
app.get('/api/employers', (req, res) => {
    const { north, south, east, west, zoom } = req.query;
    
    // Filter data to only what's in the current viewport
    const visibleEmployers = lmiaData.filter(employer => {
        return employer.lat >= south && 
               employer.lat <= north && 
               employer.lng >= west && 
               employer.lng <= east;
    });
    
    // If zoomed out, return clusters instead of individual points
    if (zoom < 10) {
        const clustered = clusterData(visibleEmployers, zoom);
        return res.json(clustered);
    }
    
    // Return max 500 points to keep performance good
    res.json(visibleEmployers.slice(0, 500));
});

app.listen(3001, () => {
    console.log('Tile server running on http://localhost:3001');
});
```

Your frontend code:
```javascript
// In your map component
async function updateMapData() {
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    
    const response = await fetch(`http://localhost:3001/api/employers?${new URLSearchParams({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        zoom: zoom
    })}`);
    
    const data = await response.json();
    // Now render only this filtered data on your map
    renderMarkers(data);
}

// Update when map moves
map.on('moveend', updateMapData);
```

### Option 2: Use TileServer GL (More Professional)

This serves actual vector tiles locally:

1. Install TileServer GL:
```bash
npm install -g tileserver-gl-light
```

2. Convert your data to MBTiles format using Tippecanoe:
```bash
# Install tippecanoe (on Mac)
brew install tippecanoe

# Convert your GeoJSON to vector tiles
tippecanoe -o lmia_2025.mbtiles \
  -z14 -Z4 \
  --drop-densest-as-needed \
  lmia_2025.geojson
```

3. Run the tile server locally:
```bash
tileserver-gl-light lmia_2025.mbtiles
```

This starts a server at `http://localhost:8080` that serves vector tiles.

### Option 3: Python with FastAPI (If you prefer Python)

```python
# server.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

# Load your data
with open('lmia_2025.json') as f:
    lmia_data = json.load(f)

@app.get("/api/employers")
def get_employers(north: float, south: float, east: float, west: float, zoom: int):
    # Filter to viewport
    visible = [
        emp for emp in lmia_data
        if south <= emp['lat'] <= north and west <= emp['lng'] <= east
    ]
    
    # Limit results based on zoom
    max_points = 100 if zoom < 10 else 500
    return visible[:max_points]

# Run with: uvicorn server:app --reload
```

## Quick Testing Setup (Minimal Example)

Here's a complete working example you can test right now:

**1. Create `package.json`:**
```json
{
  "name": "lmia-map-server",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

**2. Create `server.js`:**
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

// Generate fake LMIA data for testing
const generateTestData = () => {
    const data = [];
    for (let i = 0; i < 15000; i++) {
        data.push({
            id: i,
            company: `Company ${i}`,
            lat: 49 + Math.random() * 10, // Canada latitude range
            lng: -123 + Math.random() * 50, // Canada longitude range
        });
    }
    return data;
};

const lmiaData = generateTestData();

app.get('/api/employers', (req, res) => {
    const { north, south, east, west } = req.query;
    
    const filtered = lmiaData.filter(emp => 
        emp.lat >= parseFloat(south) && 
        emp.lat <= parseFloat(north) && 
        emp.lng >= parseFloat(west) && 
        emp.lng <= parseFloat(east)
    );
    
    console.log(`Returning ${filtered.length} of ${lmiaData.length} points`);
    res.json(filtered);
});

app.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
});
```

**3. Install and run:**
```bash
npm install
npm start
```

**4. Update your frontend to fetch from this local server:**
```javascript
// Instead of loading all data at once
const bounds = map.getBounds();
const response = await fetch(`http://localhost:3001/api/employers?${new URLSearchParams({
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest()
})}`);
const visibleData = await response.json();
```

## Benefits You'll See Immediately

- Instead of 15k markers, you'll only render 50-500 at a time
- Map becomes instantly responsive
- Zooming and panning are smooth
- Memory usage drops significantly
