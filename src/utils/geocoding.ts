// Canadian Geographic Names Database Geocoding Utility
// This module provides geocoding functionality using the Canadian Geographic Names Database

export interface GeoNameResult {
  latitude: number;
  longitude: number;
  name: string;
  province: string;
  genericTerm: string;
  relevance: number;
}

export interface GeocodingCache {
  [key: string]: GeoNameResult;
}

// Cache for geocoding results to avoid repeated lookups
const geocodingCache: GeocodingCache = {};

// Priority order for populated place types (higher priority = better match)
const POPULATED_PLACE_PRIORITY: { [key: string]: number } = {
  'City': 100,
  'Town': 90,
  'Municipality': 85,
  'District Municipality': 80,
  'Village Municipality': 75,
  'Township Municipality': 70,
  'Village': 65,
  'Urban Community': 60,
  'Community': 55,
  'Hamlet': 50,
  'Organized Hamlet': 45,
  'Compact Rural Community': 40,
  'Dispersed Rural Community': 35,
  'Locality': 30,
  'Named Locality': 25,
  'Settlement': 20,
  'Railway Point': 15,
  'Post Office': 10,
  'Residential Area': 5,
  'Neighbourhood': 1
};

// Fallback coordinates for each province (used when no match is found)
const PROVINCE_DEFAULTS: { [key: string]: { latitude: number; longitude: number } } = {
  'Ontario': { latitude: 44.0000, longitude: -79.0000 },
  'British Columbia': { latitude: 49.0000, longitude: -123.0000 },
  'Alberta': { latitude: 52.0000, longitude: -114.0000 },
  'Quebec': { latitude: 46.0000, longitude: -72.0000 },
  'Manitoba': { latitude: 50.0000, longitude: -97.0000 },
  'Saskatchewan': { latitude: 51.0000, longitude: -106.0000 },
  'Nova Scotia': { latitude: 45.0000, longitude: -63.0000 },
  'New Brunswick': { latitude: 46.0000, longitude: -66.0000 },
  'Newfoundland and Labrador': { latitude: 48.0000, longitude: -53.0000 },
  'Prince Edward Island': { latitude: 46.0000, longitude: -63.0000 },
  'Northwest Territories': { latitude: 62.0000, longitude: -114.0000 },
  'Nunavut': { latitude: 64.0000, longitude: -68.0000 },
  'Yukon': { latitude: 61.0000, longitude: -135.0000 }
};

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Check if a generic term represents a populated place
 */
function isPopulatedPlace(genericTerm: string): boolean {
  return genericTerm in POPULATED_PLACE_PRIORITY;
}

/**
 * Get priority score for a populated place type
 */
function getPlacePriority(genericTerm: string): number {
  return POPULATED_PLACE_PRIORITY[genericTerm] || 0;
}

/**
 * Search for a city in the Canadian Geographic Names Database
 * This function searches through the CSV data to find the best match
 */
export async function findCityInGeoNames(
  province: string, 
  city: string
): Promise<GeoNameResult | null> {
  const cacheKey = `${province.toLowerCase()}-${city.toLowerCase()}`;
  
  // Check cache first
  if (geocodingCache[cacheKey]) {
    return geocodingCache[cacheKey];
  }
  
  try {
    // Fetch the CSV data
    const response = await fetch('/data/CAN_GEO_NAMES/Canadian_Geo_Names.csv');
    const csvContent = await response.text();
    
    const lines = csvContent.split('\n');
    let bestMatch: GeoNameResult | null = null;
    let bestScore = -1;
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = parseCSVLine(line);
      if (columns.length < 15) continue;
      
      const name = columns[1].replace(/'/g, '');
      const genericTerm = columns[5];
      const csvProvince = columns[12];
      const latitude = parseFloat(columns[9]);
      const longitude = parseFloat(columns[10]);
      const relevance = parseInt(columns[13]) || 0;
      
      // Check if it's a populated place and matches our city/province
      if (isPopulatedPlace(genericTerm) && 
          name.toLowerCase() === city.toLowerCase() && 
          csvProvince.toLowerCase() === province.toLowerCase()) {
        
        const priority = getPlacePriority(genericTerm);
        const score = priority + (relevance / 1000000); // Add relevance as tiebreaker
        
        if (score > bestScore) {
          bestMatch = {
            latitude,
            longitude,
            name,
            province: csvProvince,
            genericTerm,
            relevance
          };
          bestScore = score;
        }
      }
    }
    
    // Cache the result
    if (bestMatch) {
      geocodingCache[cacheKey] = bestMatch;
    }
    
    return bestMatch;
  } catch (error) {
    console.warn('GeoNames lookup failed:', error);
    return null;
  }
}

/**
 * Get coordinates for a city, using the Canadian Geographic Names Database
 * Falls back to province default if no match is found
 */
export async function getCoordinates(
  province: string, 
  city: string
): Promise<{ latitude: number; longitude: number }> {
  const result = await findCityInGeoNames(province, city);
  
  if (result) {
    return {
      latitude: result.latitude,
      longitude: result.longitude
    };
  }
  
  // Fallback to province default
  const defaultCoords = PROVINCE_DEFAULTS[province] || PROVINCE_DEFAULTS['Ontario'];
  console.warn(`No coordinates found for ${city}, ${province}. Using province default.`);
  
  return defaultCoords;
}

/**
 * Batch geocode multiple cities for better performance
 */
export async function batchGeocode(
  requests: Array<{ province: string; city: string }>
): Promise<Map<string, { latitude: number; longitude: number }>> {
  const results = new Map<string, { latitude: number; longitude: number }>();
  
  // Process requests in parallel
  const promises = requests.map(async (request) => {
    const key = `${request.province}-${request.city}`;
    const coords = await getCoordinates(request.province, request.city);
    results.set(key, coords);
  });
  
  await Promise.all(promises);
  return results;
}

/**
 * Clear the geocoding cache (useful for testing or memory management)
 */
export function clearGeocodingCache(): void {
  Object.keys(geocodingCache).forEach(key => delete geocodingCache[key]);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: Object.keys(geocodingCache).length,
    keys: Object.keys(geocodingCache)
  };
}
