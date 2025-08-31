import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple coordinate mapping function
function getCoordinates(province, city) {
  const coordinates = {
    'Ontario': { 'Toronto': { lat: 43.6532, lng: -79.3832 }, 'default': { lat: 44.0000, lng: -79.0000 } },
    'British Columbia': { 'Vancouver': { lat: 49.2827, lng: -123.1207 }, 'default': { lat: 49.0000, lng: -123.0000 } },
    'Alberta': { 'Calgary': { lat: 51.0447, lng: -114.0719 }, 'default': { lat: 52.0000, lng: -114.0000 } },
    'Quebec': { 'Montreal': { lat: 45.5017, lng: -73.5673 }, 'default': { lat: 46.0000, lng: -72.0000 } },
    'Manitoba': { 'Winnipeg': { lat: 49.8951, lng: -97.1384 }, 'default': { lat: 50.0000, lng: -97.0000 } },
    'Saskatchewan': { 'Saskatoon': { lat: 52.1579, lng: -106.6702 }, 'default': { lat: 51.0000, lng: -106.0000 } },
    'Nova Scotia': { 'Halifax': { lat: 44.6488, lng: -63.5752 }, 'default': { lat: 45.0000, lng: -63.0000 } },
    'New Brunswick': { 'Saint John': { lat: 45.2733, lng: -66.0633 }, 'default': { lat: 46.0000, lng: -66.0000 } },
    'Newfoundland and Labrador': { 'St. John\'s': { lat: 47.5615, lng: -52.7126 }, 'default': { lat: 48.0000, lng: -53.0000 } },
    'Prince Edward Island': { 'Charlottetown': { lat: 46.2382, lng: -63.1311 }, 'default': { lat: 46.0000, lng: -63.0000 } },
    'Northwest Territories': { 'Yellowknife': { lat: 62.4540, lng: -114.3718 }, 'default': { lat: 62.0000, lng: -114.0000 } },
    'Nunavut': { 'Iqaluit': { lat: 63.7467, lng: -68.5170 }, 'default': { lat: 64.0000, lng: -68.0000 } },
    'Yukon': { 'Whitehorse': { lat: 60.7212, lng: -135.0568 }, 'default': { lat: 61.0000, lng: -135.0000 } }
  };

  const prov = province || 'Ontario';
  const cityKey = city || 'default';
  
  if (coordinates[prov] && coordinates[prov][cityKey]) {
    return coordinates[prov][cityKey];
  } else if (coordinates[prov] && coordinates[prov]['default']) {
    return coordinates[prov]['default'];
  } else {
    return { lat: 56.1304, lng: -106.3468 };
  }
}

// Convert Excel data to GeoJSON
function convertExcelToGeoJSON(filePath, year, quarter) {
  try {
    console.log(`Converting ${filePath} to GeoJSON...`);
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    const features = [];
    
    // Find header row
    let headerIndex = -1;
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row.length > 0) {
        const firstCell = String(row[0]).toLowerCase();
        if (firstCell.includes('province') || firstCell.includes('employer')) {
          headerIndex = i;
          break;
        }
      }
    }
    
    if (headerIndex === -1) {
      console.warn(`No header found in ${filePath}`);
      return { type: 'FeatureCollection', features: [] };
    }
    
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
      
      if (rowData['Employer'] && rowData['Address']) {
        const employerName = rowData['Employer'];
        const address = rowData['Address'];
        const province = rowData['Province/Territory'] || 'Unknown';
        const positions = parseInt(rowData['Positions Approved'] || rowData['Approved Positions'] || '1') || 1;
        const stream = rowData['Stream'] || rowData['Program Stream'] || 'Unknown';
        const occupation = rowData['Occupations under NOC 2011'] || rowData['Occupation'] || 'Unknown';
        
        // Extract city from address
        const addressParts = address.split(',').map(part => part.trim());
        const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : 'Unknown';
        
        // Get coordinates
        const coords = getCoordinates(province, city);
        
        // Create GeoJSON feature
        const feature = {
          type: 'Feature',
          properties: {
            id: `${employerName}-${province}-${city}`.replace(/\s+/g, '-').toLowerCase(),
            employer_name: employerName,
            address: address,
            city: city,
            province_territory: province,
            positions_approved: positions,
            program_stream: stream,
            occupation: occupation,
            year: year,
            quarter: quarter
          },
          geometry: {
            type: 'Point',
            coordinates: [coords.lng, coords.lat]
          }
        };
        
        features.push(feature);
      }
    }
    
    console.log(`Converted ${features.length} employers from ${filePath}`);
    return {
      type: 'FeatureCollection',
      features: features
    };
    
  } catch (error) {
    console.error(`Error converting ${filePath}:`, error);
    return { type: 'FeatureCollection', features: [] };
  }
}

// Main conversion function
async function convertAllDataToGeoJSON() {
  const dataDir = path.join(__dirname, '..', 'public', 'data', 'LMIA-DATA');
  const outputDir = path.join(__dirname, '..', 'tiles');
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const allFeatures = [];
  
  // Process each year
  const years = fs.readdirSync(dataDir).filter(dir => {
    const fullPath = path.join(dataDir, dir);
    return fs.statSync(fullPath).isDirectory() && !isNaN(parseInt(dir));
  });
  
  for (const year of years) {
    const yearDir = path.join(dataDir, year);
    const files = fs.readdirSync(yearDir);
    
    for (const file of files) {
      if (file.endsWith('.xlsx')) {
        const filePath = path.join(yearDir, file);
        const geoJSON = convertExcelToGeoJSON(filePath, parseInt(year), 'Q1');
        allFeatures.push(...geoJSON.features);
      }
    }
  }
  
  // Create combined GeoJSON
  const combinedGeoJSON = {
    type: 'FeatureCollection',
    features: allFeatures
  };
  
  // Write combined GeoJSON
  const outputPath = path.join(outputDir, 'lmia_combined.geojson');
  fs.writeFileSync(outputPath, JSON.stringify(combinedGeoJSON, null, 2));
  
  console.log(`\n✅ Conversion complete!`);
  console.log(`📊 Total features: ${allFeatures.length}`);
  console.log(`📁 Output file: ${outputPath}`);
  console.log(`\n🚀 Next steps:`);
  console.log(`1. Install tippecanoe: brew install tippecanoe`);
  console.log(`2. Convert to vector tiles: tippecanoe -o lmia.mbtiles -z14 -Z4 --drop-densest-as-needed ${outputPath}`);
  console.log(`3. Start tile server: tileserver-gl-light lmia.mbtiles`);
}

// Run conversion
convertAllDataToGeoJSON().catch(console.error);
