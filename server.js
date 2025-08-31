import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Load LMIA data from Excel files
let lmiaData = [];
let dataCache = {};

// Function to load data from Excel file
function loadLMIAData(year, quarter) {
  const cacheKey = `${year}-${quarter}`;
  if (dataCache[cacheKey]) {
    return dataCache[cacheKey];
  }

  try {
    const filePath = path.join(__dirname, 'public', 'data', 'LMIA-DATA', year.toString());
    const files = fs.readdirSync(filePath).filter(file => file.endsWith('.xlsx'));
    
    let targetFile = '';
    if (quarter === 'Q1-Q4' || quarter === 'Q1-Q2') {
      targetFile = files[0];
    } else {
      const quarterIndex = ['Q1', 'Q2', 'Q3', 'Q4'].indexOf(quarter);
      if (quarterIndex >= 0 && quarterIndex < files.length) {
        targetFile = files[quarterIndex];
      } else {
        targetFile = files[0];
      }
    }

    const fullPath = path.join(filePath, targetFile);
    console.log(`Loading data from: ${fullPath}`);

    let data = [];
    if (targetFile.endsWith('.xlsx')) {
      const workbook = XLSX.readFile(fullPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Find header row
      let headerIndex = -1;
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && row.length > 0) {
          const firstCell = String(row[0]).toLowerCase();
          // Look for the actual header row, not the title row
          if (firstCell === 'province/territory' || (firstCell.includes('province') && row.length > 5)) {
            headerIndex = i;
            break;
          }
        }
      }
      
      if (headerIndex === -1) return [];
      
      const headers = jsonData[headerIndex].map(h => String(h).trim());
      
      for (let i = headerIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 3) continue;
        
        const rowData = {};
        headers.forEach((header, index) => {
          if (row[index] !== undefined && row[index] !== '') {
            rowData[header] = String(row[index]);
          }
        });
        
                  if (rowData['Employer'] && rowData['Address'] && rowData['Province/Territory'] !== 'Employers carrying on business in Canada with Head Office outside of Canada') {
          // Convert to our format
          const employer = {
            id: `${rowData['Employer']}-${rowData['Province/Territory'] || 'Unknown'}`.replace(/\s+/g, '-').toLowerCase(),
            employer_name: rowData['Employer'],
            address: rowData['Address'],
            city: extractCityFromAddress(rowData['Address']),
            province_territory: (rowData['Province/Territory'] || 'Unknown').trim(),
            postal_code: extractPostalCode(rowData['Address']),
            latitude: 0, // Will be geocoded
            longitude: 0, // Will be geocoded
            incorporate_status: rowData['Incorporate Status'] || 'Unknown',
            total_positions: parseInt(rowData['Approved Positions'] || '1') || 1,
            total_lmias: parseInt(rowData['Approved LMIAs'] || '1') || 1,
            primary_program: rowData['Program Stream'] || 'Unknown',
            primary_occupation: rowData['Occupation'] || 'Unknown'
          };
          
          // Simple coordinate mapping (in production, use proper geocoding)
          const coordinates = getCoordinates(employer.province_territory, employer.city);
          employer.latitude = coordinates.lat;
          employer.longitude = coordinates.lng;
          
          data.push(employer);
        }
      }
    }
    
    dataCache[cacheKey] = data;
    console.log(`Loaded ${data.length} employers for ${year} ${quarter}`);
    return data;
  } catch (error) {
    console.error(`Error loading data for ${year} ${quarter}:`, error);
    return [];
  }
}

// Extract city from address string
function extractCityFromAddress(address) {
  if (!address) return 'Unknown';
  
  // Split by comma and get the second-to-last part (usually the city)
  const parts = address.split(',').map(part => part.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return 'Unknown';
}

// Extract postal code from address string
function extractPostalCode(address) {
  if (!address) return '';
  
  // Look for Canadian postal code pattern (A1A 1A1)
  const postalCodeMatch = address.match(/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/);
  return postalCodeMatch ? postalCodeMatch[0] : '';
}

// Enhanced coordinate mapping function with more cities
function getCoordinates(province, city) {
  const coordinates = {
    'Ontario': { 
      'Toronto': { lat: 43.6532, lng: -79.3832 },
      'Ottawa': { lat: 45.4215, lng: -75.6972 },
      'Hamilton': { lat: 43.2557, lng: -79.8711 },
      'London': { lat: 42.9849, lng: -81.2453 },
      'Kitchener': { lat: 43.4501, lng: -80.4829 },
      'Windsor': { lat: 42.3149, lng: -83.0364 },
      'Oshawa': { lat: 43.8971, lng: -78.8658 },
      'Barrie': { lat: 44.3894, lng: -79.6903 },
      'Kingston': { lat: 44.2312, lng: -76.4860 },
      'Guelph': { lat: 43.5448, lng: -80.2482 },
      'Brampton': { lat: 43.6834, lng: -79.7663 },
      'Mississauga': { lat: 43.5890, lng: -79.6441 },
      'Markham': { lat: 43.8668, lng: -79.2663 },
      'Vaughan': { lat: 43.8361, lng: -79.4983 },
      'Richmond Hill': { lat: 43.8828, lng: -79.4403 },
      'Oakville': { lat: 43.4675, lng: -79.6877 },
      'Burlington': { lat: 43.3255, lng: -79.7990 },
      'Scarborough': { lat: 43.7731, lng: -79.2578 },
      'Etobicoke': { lat: 43.6532, lng: -79.5672 },
      'North York': { lat: 43.7615, lng: -79.4111 },
      'Woodbridge': { lat: 43.7834, lng: -79.5995 },
      'Waterloo': { lat: 43.4643, lng: -80.5204 },
      'Cambridge': { lat: 43.3616, lng: -80.3144 },
      'St. Catharines': { lat: 43.1594, lng: -79.2469 },
      'Niagara Falls': { lat: 43.0896, lng: -79.0849 },
      'Thunder Bay': { lat: 48.3809, lng: -89.2477 },
      'Sudbury': { lat: 46.5220, lng: -81.0176 },
      'Peterborough': { lat: 44.3091, lng: -78.3197 },
      'Sault Ste. Marie': { lat: 46.5219, lng: -84.3461 },
      'default': { lat: 44.0000, lng: -79.0000 } 
    },
    'British Columbia': { 
      'Vancouver': { lat: 49.2827, lng: -123.1207 },
      'Victoria': { lat: 48.4284, lng: -123.3656 },
      'Surrey': { lat: 49.1913, lng: -122.8490 },
      'Burnaby': { lat: 49.2488, lng: -122.9805 },
      'Richmond': { lat: 49.1666, lng: -123.1336 },
      'Abbotsford': { lat: 49.0504, lng: -122.3045 },
      'Coquitlam': { lat: 49.2838, lng: -122.7932 },
      'Saanich': { lat: 48.4840, lng: -123.3810 },
      'Delta': { lat: 49.0847, lng: -122.9000 },
      'Kelowna': { lat: 49.8880, lng: -119.4960 },
      'Langley': { lat: 49.1041, lng: -122.6600 },
      'North Vancouver': { lat: 49.3163, lng: -123.0693 },
      'Nanaimo': { lat: 49.1659, lng: -123.9401 },
      'Kamloops': { lat: 50.6745, lng: -120.3273 },
      'Prince George': { lat: 53.9171, lng: -122.7497 },
      'Chilliwack': { lat: 49.1579, lng: -121.9514 },
      'Vernon': { lat: 50.2671, lng: -119.2720 },
      'Courtenay': { lat: 49.6886, lng: -124.9936 },
      'Penticton': { lat: 49.4906, lng: -119.5858 },
      'Port Coquitlam': { lat: 49.2621, lng: -122.7811 },
      'New Westminster': { lat: 49.2057, lng: -122.9110 },
      'default': { lat: 49.0000, lng: -123.0000 } 
    },
    'Alberta': { 
      'Calgary': { lat: 51.0447, lng: -114.0719 },
      'Edmonton': { lat: 53.5461, lng: -113.4938 },
      'Red Deer': { lat: 52.2681, lng: -113.8112 },
      'Lethbridge': { lat: 49.6939, lng: -112.8418 },
      'St. Albert': { lat: 53.6333, lng: -113.6167 },
      'Medicine Hat': { lat: 50.0394, lng: -110.6764 },
      'Grande Prairie': { lat: 55.1708, lng: -118.7947 },
      'Airdrie': { lat: 51.2833, lng: -114.0167 },
      'Spruce Grove': { lat: 53.5333, lng: -113.9167 },
      'Leduc': { lat: 53.2667, lng: -113.5500 },
      'default': { lat: 52.0000, lng: -114.0000 } 
    },
    'Quebec': { 
      'Montreal': { lat: 45.5017, lng: -73.5673 },
      'Quebec City': { lat: 46.8139, lng: -71.2080 },
      'Québec': { lat: 46.8139, lng: -71.2080 },
      'Laval': { lat: 45.6066, lng: -73.7124 },
      'Gatineau': { lat: 45.4775, lng: -75.7013 },
      'Longueuil': { lat: 45.5312, lng: -73.5188 },
      'Sherbrooke': { lat: 45.4042, lng: -71.8929 },
      'Saguenay': { lat: 48.4281, lng: -71.0689 },
      'Levis': { lat: 46.8033, lng: -71.1779 },
      'Trois-Rivières': { lat: 46.3432, lng: -72.5432 },
      'Terrebonne': { lat: 45.7000, lng: -73.6333 },
      'Boucherville': { lat: 45.5906, lng: -73.4360 },
      'Drummondville': { lat: 45.8833, lng: -72.4833 },
      'Brossard': { lat: 45.4584, lng: -73.4650 },
      'Saint-Jean-sur-Richelieu': { lat: 45.3167, lng: -73.2667 },
      'Repentigny': { lat: 45.7333, lng: -73.4500 },
      'default': { lat: 46.0000, lng: -72.0000 } 
    },
    'Manitoba': { 
      'Winnipeg': { lat: 49.8951, lng: -97.1384 },
      'Brandon': { lat: 49.8483, lng: -99.9500 },
      'Steinbach': { lat: 49.5258, lng: -96.6847 },
      'Thompson': { lat: 55.7431, lng: -97.8556 },
      'Portage la Prairie': { lat: 49.9728, lng: -98.2919 },
      'Winkler': { lat: 49.1819, lng: -97.9397 },
      'Selkirk': { lat: 50.1436, lng: -96.8842 },
      'Morden': { lat: 49.1919, lng: -98.1014 },
      'Flin Flon': { lat: 54.7681, lng: -101.8647 },
      'The Pas': { lat: 53.8250, lng: -101.2539 },
      'default': { lat: 50.0000, lng: -97.0000 } 
    },
    'Saskatchewan': { 
      'Saskatoon': { lat: 52.1579, lng: -106.6702 },
      'Regina': { lat: 50.4452, lng: -104.6189 },
      'Prince Albert': { lat: 53.2033, lng: -105.7531 },
      'Moose Jaw': { lat: 50.3933, lng: -105.5519 },
      'Swift Current': { lat: 50.2881, lng: -107.7939 },
      'Yorkton': { lat: 51.2139, lng: -102.4619 },
      'North Battleford': { lat: 52.7575, lng: -108.2861 },
      'Estevan': { lat: 49.1419, lng: -102.9842 },
      'Weyburn': { lat: 49.6667, lng: -103.8500 },
      'Lloydminster': { lat: 53.2833, lng: -110.0000 },
      'default': { lat: 51.0000, lng: -106.0000 } 
    },
    'Nova Scotia': { 
      'Halifax': { lat: 44.6488, lng: -63.5752 },
      'Sydney': { lat: 46.1368, lng: -60.1942 },
      'Dartmouth': { lat: 44.6709, lng: -63.5773 },
      'Truro': { lat: 45.3667, lng: -63.2833 },
      'New Glasgow': { lat: 45.6000, lng: -62.6500 },
      'Glace Bay': { lat: 46.1969, lng: -59.9570 },
      'Kentville': { lat: 45.0833, lng: -64.4833 },
      'Amherst': { lat: 45.8167, lng: -64.2167 },
      'Bridgewater': { lat: 44.3833, lng: -64.5167 },
      'Yarmouth': { lat: 43.8333, lng: -66.1167 },
      'default': { lat: 45.0000, lng: -63.0000 } 
    },
    'New Brunswick': { 
      'Saint John': { lat: 45.2733, lng: -66.0633 },
      'Moncton': { lat: 46.0878, lng: -64.7782 },
      'Fredericton': { lat: 45.9636, lng: -66.6431 },
      'Dieppe': { lat: 46.1000, lng: -64.7167 },
      'Riverview': { lat: 46.0667, lng: -64.8000 },
      'Quispamsis': { lat: 45.4333, lng: -65.9500 },
      'Miramichi': { lat: 47.0333, lng: -65.5000 },
      'Edmundston': { lat: 47.3667, lng: -68.3333 },
      'Bathurst': { lat: 47.6167, lng: -65.6500 },
      'Campbellton': { lat: 48.0000, lng: -66.6667 },
      'default': { lat: 46.0000, lng: -66.0000 } 
    },
    'Newfoundland and Labrador': { 
      'St. John\'s': { lat: 47.5615, lng: -52.7126 },
      'Mount Pearl': { lat: 47.5167, lng: -52.8000 },
      'Corner Brook': { lat: 48.9500, lng: -57.9500 },
      'Conception Bay South': { lat: 47.5000, lng: -52.9833 },
      'Grand Falls-Windsor': { lat: 48.9333, lng: -55.6500 },
      'Gander': { lat: 48.9500, lng: -54.6000 },
      'Happy Valley-Goose Bay': { lat: 53.3167, lng: -60.3167 },
      'Labrador City': { lat: 52.9500, lng: -66.9167 },
      'Stephenville': { lat: 48.5500, lng: -58.5667 },
      'Torbay': { lat: 47.6500, lng: -52.7333 },
      'default': { lat: 48.0000, lng: -53.0000 } 
    },
    'Prince Edward Island': { 
      'Charlottetown': { lat: 46.2382, lng: -63.1311 },
      'Summerside': { lat: 46.4000, lng: -63.7833 },
      'Stratford': { lat: 46.2167, lng: -63.0833 },
      'Cornwall': { lat: 46.2333, lng: -63.2167 },
      'Montague': { lat: 46.1667, lng: -62.6500 },
      'Kensington': { lat: 46.4333, lng: -63.6333 },
      'Souris': { lat: 46.3500, lng: -62.2500 },
      'Alberton': { lat: 46.8167, lng: -64.0667 },
      'Georgetown': { lat: 46.1833, lng: -62.5333 },
      'Tignish': { lat: 46.9500, lng: -64.0333 },
      'default': { lat: 46.0000, lng: -63.0000 } 
    },
    'Northwest Territories': { 
      'Yellowknife': { lat: 62.4540, lng: -114.3718 },
      'Hay River': { lat: 60.8167, lng: -115.8000 },
      'Inuvik': { lat: 68.3607, lng: -133.7231 },
      'Fort Smith': { lat: 60.0000, lng: -111.8833 },
      'Behchoko': { lat: 62.8000, lng: -116.0000 },
      'Fort Simpson': { lat: 61.8500, lng: -121.3500 },
      'Tuktoyaktuk': { lat: 69.4500, lng: -133.0333 },
      'Aklavik': { lat: 68.2167, lng: -135.0167 },
      'Norman Wells': { lat: 65.2833, lng: -126.8333 },
      'Fort Providence': { lat: 61.3500, lng: -117.6500 },
      'default': { lat: 62.0000, lng: -114.0000 } 
    },
    'Nunavut': { 
      'Iqaluit': { lat: 63.7467, lng: -68.5170 },
      'Rankin Inlet': { lat: 62.8167, lng: -92.0833 },
      'Arviat': { lat: 61.1000, lng: -94.0500 },
      'Baker Lake': { lat: 64.3167, lng: -96.0167 },
      'Cambridge Bay': { lat: 69.1167, lng: -105.0500 },
      'Igloolik': { lat: 69.3833, lng: -81.8000 },
      'Pangnirtung': { lat: 66.1500, lng: -65.7167 },
      'Pond Inlet': { lat: 72.7000, lng: -77.9667 },
      'Kugluktuk': { lat: 67.8167, lng: -115.1000 },
      'Cape Dorset': { lat: 64.2333, lng: -76.5333 },
      'default': { lat: 64.0000, lng: -68.0000 } 
    },
    'Yukon': { 
      'Whitehorse': { lat: 60.7212, lng: -135.0568 },
      'Dawson City': { lat: 64.0667, lng: -139.4167 },
      'Watson Lake': { lat: 60.0667, lng: -128.7167 },
      'Haines Junction': { lat: 60.7500, lng: -137.5000 },
      'Carmacks': { lat: 62.0833, lng: -136.2833 },
      'Mayo': { lat: 63.6000, lng: -135.9000 },
      'Faro': { lat: 62.2167, lng: -133.3500 },
      'Teslin': { lat: 60.1667, lng: -132.7167 },
      'Pelly Crossing': { lat: 62.8167, lng: -136.5667 },
      'Ross River': { lat: 61.9833, lng: -132.4333 },
      'default': { lat: 61.0000, lng: -135.0000 } 
    }
  };

  const prov = province || 'Ontario';
  const cityKey = city || 'default';
  
  let coords;
  if (coordinates[prov] && coordinates[prov][cityKey]) {
    coords = coordinates[prov][cityKey];
  } else if (coordinates[prov] && coordinates[prov]['default']) {
    coords = coordinates[prov]['default'];
  } else {
    coords = { lat: 56.1304, lng: -106.3468 };
  }

  // Return exact coordinates - no randomization
  return {
    lat: coords.lat,
    lng: coords.lng
  };
}

// Simple clustering function
function clusterPoints(points, options = {}) {
  const { radius = 40, maxZoom = 16, minPoints = 2 } = options;
  const clusters = [];
  const processed = new Set();
  
  points.forEach((point, index) => {
    if (processed.has(index)) return;
    
    const cluster = {
      type: 'cluster',
      lat: point.latitude,
      lng: point.longitude,
      count: 1,
      points: [point]
    };
    
    // Find nearby points
    for (let i = index + 1; i < points.length; i++) {
      if (processed.has(i)) continue;
      
      const distance = Math.sqrt(
        Math.pow(point.latitude - points[i].latitude, 2) + 
        Math.pow(point.longitude - points[i].longitude, 2)
      );
      
      if (distance < radius / 111000) { // Rough conversion to degrees
        cluster.count++;
        cluster.points.push(points[i]);
        processed.add(i);
      }
    }
    
    processed.add(index);
    clusters.push(cluster);
  });
  
  return clusters;
}

// API endpoint that returns only visible employers
app.get('/api/employers', (req, res) => {
  const { north, south, east, west, zoom, year = 2025, quarter = 'Q1' } = req.query;
  
  console.log(`API request: ${year} ${quarter}, zoom: ${zoom}, bounds: ${south},${west} to ${north},${east}`);
  
  // Load data for the requested year/quarter
  const allData = loadLMIAData(parseInt(year), quarter);
  
  // Filter data to only what's in the current viewport
  const visibleEmployers = allData.filter(employer => {
    return employer.latitude >= parseFloat(south) && 
           employer.latitude <= parseFloat(north) && 
           employer.longitude >= parseFloat(west) && 
           employer.longitude <= parseFloat(east);
  });
  
  console.log(`Found ${visibleEmployers.length} employers in viewport out of ${allData.length} total`);
  
  // Return different response types based on zoom level
  if (parseInt(zoom) < 8) {
    // Return clusters/summaries that represent ALL data
    const clusters = clusterPoints(visibleEmployers, { radius: 80 });
    res.json({
      type: 'clusters',
      total: visibleEmployers.length,
      clusters: clusters,
      strategy: 'province_summary'
    });
  } else if (parseInt(zoom) < 12) {
    // Return smaller clusters
    const fineClusters = clusterPoints(visibleEmployers, { radius: 40 });
    res.json({
      type: 'clusters',
      total: visibleEmployers.length,
      clusters: fineClusters,
      strategy: 'city_clusters'
    });
  } else {
    // Only at street level show individual markers
    // But still include total so user knows if there's more
    const maxMarkers = Math.min(visibleEmployers.length, 1000);
    res.json({
      type: 'markers',
      total: visibleEmployers.length,
      showing: maxMarkers,
      markers: visibleEmployers.slice(0, maxMarkers),
      strategy: 'individual_markers'
    });
  }
});

// API endpoint for available years/quarters
app.get('/api/available-data', (req, res) => {
  const dataDir = path.join(__dirname, 'public', 'data', 'LMIA-DATA');
  const years = fs.readdirSync(dataDir).filter(dir => {
    const fullPath = path.join(dataDir, dir);
    return fs.statSync(fullPath).isDirectory() && !isNaN(parseInt(dir));
  }).map(Number).sort();
  
  const quarters = {};
  years.forEach(year => {
    const yearDir = path.join(dataDir, year.toString());
    const files = fs.readdirSync(yearDir);
    quarters[year] = files.map(file => {
      if (file.includes('q1')) return 'Q1';
      if (file.includes('q2')) return 'Q2';
      if (file.includes('q3')) return 'Q3';
      if (file.includes('q4')) return 'Q4';
      return 'Q1-Q4';
    }).filter((value, index, self) => self.indexOf(value) === index);
  });
  
  res.json({ years, quarters });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 LMIA Map Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET /api/employers - Get viewport-filtered employers`);
  console.log(`   GET /api/available-data - Get available years/quarters`);
  console.log(`   GET /api/health - Health check`);
});
