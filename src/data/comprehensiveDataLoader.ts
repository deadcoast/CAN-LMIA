import * as XLSX from 'xlsx';
import { LMIAApproval, EmployerWithApprovals } from '../types/lmia';

// Data structure interfaces for different years
interface BaseRow {
  'Province/Territory'?: string;
  'Employer': string;
  'Address': string;
  'Occupation': string;
  'Incorporate Status'?: string;
  'Approved LMIAs'?: string;
  'Approved Positions'?: string;
}

// Year-specific data structures
interface YearData {
  quarters: readonly string[];
  parseFunction: (data: any[], year: string, quarter: string) => BaseRow[];
}

// Helper function to extract NOC code from occupation string
function extractNOCCode(occupation: string): string {
  if (!occupation) return '';
  const nocMatch = occupation.match(/(\d{4,5})/);
  return nocMatch ? nocMatch[1] : '';
}

// Helper function to extract postal code from address
function extractPostalCode(address: string): string {
  if (!address) return '';
  const postalCodeMatch = address.match(/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/);
  return postalCodeMatch ? postalCodeMatch[0] : '';
}

// Helper function to get coordinates using Canadian Geographic Names Database
async function getCityCoordinates(province: string, city: string): Promise<{ latitude: number; longitude: number }> {
  // Temporarily use static coordinates to avoid geocoding delays
  const staticCoords: { [key: string]: { [key: string]: { lat: number; lng: number } } } = {
    'Ontario': {
      'Toronto': { lat: 43.6532, lng: -79.3832 },
      'Brampton': { lat: 43.6834, lng: -79.7663 },
      'Mississauga': { lat: 43.5890, lng: -79.6441 },
      'default': { lat: 44.0000, lng: -79.0000 }
    },
    'British Columbia': {
      'Vancouver': { lat: 49.2827, lng: -123.1207 },
      'Surrey': { lat: 49.1913, lng: -122.8490 },
      'default': { lat: 49.0000, lng: -123.0000 }
    },
    'Alberta': {
      'Calgary': { lat: 51.0447, lng: -114.0719 },
      'Edmonton': { lat: 53.5461, lng: -113.4938 },
      'default': { lat: 52.0000, lng: -114.0000 }
    },
    'Quebec': {
      'Montreal': { lat: 45.5017, lng: -73.5673 },
      'default': { lat: 46.0000, lng: -72.0000 }
    }
  };

  const prov = province || 'Ontario';
  const cityKey = city || 'default';
  
  if (staticCoords[prov] && staticCoords[prov][cityKey]) {
    const coord = staticCoords[prov][cityKey];
    return { latitude: coord.lat, longitude: coord.lng };
  } else if (staticCoords[prov] && staticCoords[prov]['default']) {
    const coord = staticCoords[prov]['default'];
    return { latitude: coord.lat, longitude: coord.lng };
  } else {
    return { latitude: 56.1304, longitude: -106.3468 }; // Geographic center of Canada
  }
}

// Parse CSV data for 2015-2018
function parseCSVData(data: any[], _year: string, _quarter: string): BaseRow[] {
  const rows: BaseRow[] = [];
  
  data.forEach((row: any) => {
    const baseRow: Partial<BaseRow> = {};
    
    // Map CSV columns to BaseRow interface
    baseRow['Province/Territory'] = row['Province/Territory'];
    baseRow['Employer'] = row['Employer'];
    baseRow['Address'] = row['Address'];
    baseRow['Occupation'] = row['Occupation'];
    baseRow['Incorporate Status'] = row['Incorporate Status'];
    baseRow['Approved LMIAs'] = row['Approved LMIAs'];
    baseRow['Approved Positions'] = row['Approved Positions'];
    
    rows.push(baseRow as BaseRow);
  });
  
  return rows;
}

// Parse Excel data for 2019+
function parseExcelData(data: any[], _year: string, _quarter: string): BaseRow[] {
  const rows: BaseRow[] = [];
  
  data.forEach((rowData: any) => {
    const baseRow: Partial<BaseRow> = {};
    
    // Map Excel columns to BaseRow interface
    baseRow['Province/Territory'] = rowData['Province/Territory'];
    baseRow['Employer'] = rowData['Employer'];
    baseRow['Address'] = rowData['Address'];
    baseRow['Occupation'] = rowData['Occupation'];
    baseRow['Incorporate Status'] = rowData['Incorporate Status'];
    baseRow['Approved LMIAs'] = rowData['Approved LMIAs'];
    baseRow['Approved Positions'] = rowData['Approved Positions'];
    
    rows.push(baseRow as BaseRow);
  });
  
  return rows;
}

// Year-specific data configurations
const yearData: { [key: string]: YearData } = {
  '2015': { quarters: ['Q1', 'Q2', 'Q3', 'Q4'], parseFunction: parseCSVData },
  '2016': { quarters: ['Q1', 'Q2', 'Q3', 'Q4'], parseFunction: parseCSVData },
  '2017': { quarters: ['Q1Q2', 'Q3', 'Q4'], parseFunction: parseCSVData },
  '2018': { quarters: ['Q1', 'Q2', 'Q3', 'Q4'], parseFunction: parseCSVData },
  '2019': { quarters: ['Q1', 'Q2', 'Q3', 'Q4'], parseFunction: parseExcelData },
  '2020': { quarters: ['Q3', 'Q4'], parseFunction: parseExcelData },
  '2021': { quarters: ['Q1', 'Q2', 'Q3', 'Q4'], parseFunction: parseExcelData },
  '2022': { quarters: ['Q1', 'Q2', 'Q3', 'Q4'], parseFunction: parseExcelData },
  '2023': { quarters: ['Q1', 'Q2', 'Q3', 'Q4'], parseFunction: parseExcelData },
  '2024': { quarters: ['Q1', 'Q2', 'Q3', 'Q4'], parseFunction: parseExcelData },
  '2025': { quarters: ['Q1', 'Q2', 'Q3', 'Q4'], parseFunction: parseExcelData }
};

// Main function to load comprehensive LMIA data
export async function loadComprehensiveLMIAData(): Promise<EmployerWithApprovals[]> {
  const allEmployers: EmployerWithApprovals[] = [];
  
  // For now, only load 2025 Q1 data to avoid performance issues
  const year = '2025';
  const quarter = 'Q1';
  const yearInfo = yearData[year];
  
  if (yearInfo) {
    console.log(`Processing year ${year}...`);
    try {
      const filePath = `/data/LMIA-DATA/${year}/`;
      let fileName = '';
      
      // Determine filename based on year and quarter
      if (year >= '2021') {
        fileName = `tfwp_${year}${quarter.toLowerCase()}_pos_en.xlsx`;
      }
      
      if (!fileName) {
        console.warn(`No filename found for ${year} ${quarter}`);
        return allEmployers;
      }
      
      const fullPath = filePath + fileName;
      console.log(`Loading LMIA data from: ${fullPath}`);
      
      // Load and parse the file
      const response = await fetch(fullPath);
      if (!response.ok) {
        console.warn(`Failed to load ${fullPath}: ${response.statusText}`);
        return allEmployers;
      }
      
      let data: any[] = [];
      
      if (fileName.endsWith('.csv')) {
        const csvText = await response.text();
        const workbook = XLSX.read(csvText, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else if (fileName.endsWith('.xlsx')) {
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      }
      
      console.log(`Parsed ${data.length} rows from ${fileName}`);
      
      // Parse the data using the appropriate function
      const rows = yearInfo.parseFunction(data, year, quarter);
      
      // Process each row and create employer records
      const approvals: LMIAApproval[] = [];
      
      rows.forEach((row) => {
        const employerName = row['Employer'] || '';
        const occupation = row['Occupation'] || '';
        const nocCode = extractNOCCode(occupation);
        const approvedLMIAs = parseInt(row['Approved LMIAs'] || '0');
        const approvedPositions = parseInt(row['Approved Positions'] || '0');
        
        if (employerName && approvedPositions > 0) {
          approvals.push({
            id: `${year}-${quarter}-${employerName}-${nocCode}`,
            employer_id: `${year}-${quarter}-${employerName}`,
            year: parseInt(year),
            quarter: quarter,
            program_stream: 'Unknown', // Default value since not in CSV
            occupation: occupation,
            noc_code: nocCode,
            approved_lmias: approvedLMIAs,
            approved_positions: approvedPositions
          });
        }
      });
      
      // Group approvals by employer
      const employerGroups = new Map<string, LMIAApproval[]>();
      
      approvals.forEach(approval => {
        const key = `${approval.year}-${approval.quarter}-${approval.employer_id}`;
        if (!employerGroups.has(key)) {
          employerGroups.set(key, []);
        }
        employerGroups.get(key)!.push(approval);
      });
      
      // Create employer records with coordinates
      const employerPromises = Array.from(employerGroups.entries()).map(async ([key, employerApprovals]) => {
        const totalPositions = employerApprovals.reduce((sum, a) => sum + a.approved_positions, 0);
        const totalLMIAs = employerApprovals.reduce((sum, a) => sum + a.approved_lmias, 0);
        
        // Find the corresponding row for employer details
        const sampleRow = rows.find(row => 
          row['Employer'] && 
          parseInt(row['Approved Positions'] || '0') > 0
        );
        
        if (sampleRow) {
          const province = sampleRow['Province/Territory'] || '';
          const address = sampleRow['Address'] || '';
          
          // Extract city from address (simple parsing)
          const cityMatch = address.match(/([^,]+),\s*([A-Z]{2})\s+[A-Z]\d[A-Z]\s+\d[A-Z]\d/);
          const city = cityMatch ? cityMatch[1].trim() : '';
          
          // Get coordinates
          const coords = await getCityCoordinates(province, city);
          
          const employer: EmployerWithApprovals = {
            id: `${key}-${Date.now()}`,
            employer_name: sampleRow['Employer'] || '',
            address: address,
            province_territory: province,
            incorporate_status: sampleRow['Incorporate Status'] || 'Unknown',
            latitude: coords.latitude,
            longitude: coords.longitude,
            city: city,
            postal_code: extractPostalCode(address),
            total_positions: totalPositions,
            total_lmias: totalLMIAs,
            primary_program: 'Unknown',
            primary_occupation: employerApprovals[0]?.occupation || '',
            approvals: employerApprovals
          };
          
          return employer;
        }
        return null;
      });
      
      // Wait for all employer records to be created
      const employers = await Promise.all(employerPromises);
      const validEmployers = employers.filter(emp => emp !== null) as EmployerWithApprovals[];
      
      // Add all employers to the main array
      allEmployers.push(...validEmployers);
      
    } catch (error) {
      console.error(`Error processing ${year} ${quarter}:`, error);
    }
  }
  
  console.log(`Loaded ${allEmployers.length} employers with comprehensive data`);
  return allEmployers;
}
