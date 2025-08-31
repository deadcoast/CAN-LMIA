import * as XLSX from 'xlsx';
import { Employer, LMIAApproval, EmployerWithApprovals } from '../types/lmia';

// Data structure interfaces for different years
interface BaseRow {
  'Province/Territory'?: string;
  'Employer': string;
  'Address': string;
  'Positions Approved'?: number;
  'Positions approved'?: number;
  'Positions Approved'?: number;
  'Stream'?: string;
  'Occupations under NOC 2011'?: string;
  'Occupation'?: string;
  'Program Stream'?: string;
  'Incorporate Status'?: string;
  'Approved LMIAs'?: number;
  'Approved Positions'?: number;
}

// Available data files by year and quarter
export const AVAILABLE_DATA = {
  2015: {
    quarters: ['Q1-Q4'],
    files: ['2015_positive_employers_en.csv']
  },
  2016: {
    quarters: ['Q1-Q4'],
    files: ['2016_positive_employer_en.csv']
  },
  2017: {
    quarters: ['Q1-Q2', 'Q3', 'Q4'],
    files: ['2017q1q2_positive_en.csv', '2017q3_positive_employer_stream_en.csv', '2017q4_positive_employer_en.csv']
  },
  2018: {
    quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
    files: ['2018q1_positive_employer_en.csv', '2018q2_positive_employer_en.csv', '2018q3_positive_en.csv', '2018q4_positive_en.csv']
  },
  2019: {
    quarters: [],
    files: []
  },
  2020: {
    quarters: ['Q3', 'Q4'],
    files: ['tfwp_2020q3_positive_en.csv', 'useb-dgcetfw-tetdip-piddiviaionline-publicationemployer-list2020-employer-list2020q4tfwp_2020q4.xlsx']
  },
  2021: {
    quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
    files: ['useb-dgcetfw-tetdip-piddiviaionline-publicationemployer-list2021-employer-listq1-2021tfwp_2021q.xlsx', 'TFWP_2021Q2_Positive_EN.xlsx', 'TFWP_2021Q3_Positive_EN.xlsx', 'useb-dgcetfw-tetdip-piddiviaionline-publicationemployer-list2021-employer-list2021q4finaltfwp_2.xlsx']
  },
  2022: {
    quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
    files: ['tfwp_2022q1_positive_en.xlsx', 'tfwp_2022q2_positive_en.xlsx', 'tfwp_2022q3_positive_en.xlsx', 'tfwp_2022q4_pos_en.xlsx']
  },
  2023: {
    quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
    files: ['tfwp_2023q1_pos_en.xlsx', 'tfwp_2023q2_pos_en.xlsx', 'tfwp_2023q3_pos_en.xlsx', 'tfwp_2023q4_pos_en.xlsx']
  },
  2024: {
    quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
    files: ['tfwp_2024q1_pos_en.xlsx', 'tfwp_2024q2_pos_en.xlsx', 'tfwp_2024q3_pos_en.xlsx', 'tfwp_2024q4_pos_en.xlsx']
  },
  2025: {
    quarters: ['Q1'],
    files: ['tfwp_2025q1_pos_en.xlsx']
  }
};

// Helper function to extract city and postal code from address
function extractCityAndPostalCode(address: string): { city: string; postal_code: string } {
  const parts = address.split(',').map(part => part.trim());
  const lastPart = parts[parts.length - 1];
  
  // Extract postal code (Canadian format: A1A 1A1)
  const postalMatch = lastPart.match(/([A-Z]\d[A-Z]\s?\d[A-Z]\d)/);
  const postal_code = postalMatch ? postalMatch[1].replace(/\s/g, '') : '';
  
  // Extract city (usually second to last part)
  const city = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  
  return { city, postal_code };
}

// Helper function to extract NOC code from occupation
function extractNOCCode(occupation: string): string {
  if (!occupation) return '';
  const nocMatch = occupation.match(/(\d{4,5})/);
  return nocMatch ? nocMatch[1] : '';
}

// Helper function to get coordinates (simplified - in real app you'd use geocoding)
function getCoordinates(province: string, city: string): { latitude: number; longitude: number } {
  // Simplified coordinate mapping - in production you'd use a proper geocoding service
  const coordinates: { [key: string]: { [key: string]: { lat: number; lng: number } } } = {
    'Ontario': {
      'Toronto': { lat: 43.6532, lng: -79.3832 },
      'Ottawa': { lat: 45.4215, lng: -75.6972 },
      'Hamilton': { lat: 43.2557, lng: -79.8711 },
      'London': { lat: 42.9849, lng: -81.2453 },
      'default': { lat: 44.0000, lng: -79.0000 }
    },
    'British Columbia': {
      'Vancouver': { lat: 49.2827, lng: -123.1207 },
      'Victoria': { lat: 48.4284, lng: -123.3656 },
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
      'Quebec City': { lat: 46.8139, lng: -71.2080 },
      'default': { lat: 46.0000, lng: -72.0000 }
    },
    'Manitoba': {
      'Winnipeg': { lat: 49.8951, lng: -97.1384 },
      'default': { lat: 50.0000, lng: -97.0000 }
    },
    'Saskatchewan': {
      'Saskatoon': { lat: 52.1579, lng: -106.6702 },
      'Regina': { lat: 50.4452, lng: -104.6189 },
      'default': { lat: 51.0000, lng: -106.0000 }
    },
    'Nova Scotia': {
      'Halifax': { lat: 44.6488, lng: -63.5752 },
      'default': { lat: 45.0000, lng: -63.0000 }
    },
    'New Brunswick': {
      'Saint John': { lat: 45.2733, lng: -66.0633 },
      'Moncton': { lat: 46.0878, lng: -64.7782 },
      'default': { lat: 46.0000, lng: -66.0000 }
    },
    'Newfoundland and Labrador': {
      'St. John\'s': { lat: 47.5615, lng: -52.7126 },
      'default': { lat: 48.0000, lng: -53.0000 }
    },
    'Prince Edward Island': {
      'Charlottetown': { lat: 46.2382, lng: -63.1311 },
      'default': { lat: 46.0000, lng: -63.0000 }
    },
    'Northwest Territories': {
      'Yellowknife': { lat: 62.4540, lng: -114.3718 },
      'default': { lat: 62.0000, lng: -114.0000 }
    },
    'Nunavut': {
      'Iqaluit': { lat: 63.7467, lng: -68.5170 },
      'default': { lat: 64.0000, lng: -68.0000 }
    },
    'Yukon': {
      'Whitehorse': { lat: 60.7212, lng: -135.0568 },
      'default': { lat: 61.0000, lng: -135.0000 }
    }
  };

  const prov = province || 'Ontario';
  const cityKey = city || 'default';
  
  if (coordinates[prov] && coordinates[prov][cityKey]) {
    return coordinates[prov][cityKey];
  } else if (coordinates[prov] && coordinates[prov]['default']) {
    return coordinates[prov]['default'];
  } else {
    return { lat: 56.1304, lng: -106.3468 }; // Geographic center of Canada
  }
}

// Parse CSV data
function parseCSVData(csvContent: string, year: number, quarter: string): BaseRow[] {
  const lines = csvContent.split('\n');
  const rows: BaseRow[] = [];
  
  // Find the header row (usually contains column names)
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('employer') && (line.includes('address') || line.includes('province'))) {
      headerIndex = i;
      break;
    }
  }
  
  if (headerIndex === -1) return rows;
  
  const headers = lines[headerIndex].split(',').map(h => h.replace(/"/g, '').trim());
  
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('"') && line.endsWith('"') && line.includes('issued a positive')) continue;
    
    const values = line.split(',').map(v => v.replace(/"/g, '').trim());
    if (values.length < 3) continue;
    
    const row: BaseRow = {};
    headers.forEach((header, index) => {
      if (values[index]) {
        row[header as keyof BaseRow] = values[index];
      }
    });
    
    if (row['Employer'] && row['Address']) {
      rows.push(row);
    }
  }
  
  return rows;
}

// Parse Excel data
function parseExcelData(arrayBuffer: ArrayBuffer, year: number, quarter: string): BaseRow[] {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  const rows: BaseRow[] = [];
  
  // Find header row
  let headerIndex = -1;
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i] as (string | number)[];
    if (row && row.length > 0) {
      const firstCell = String(row[0]).toLowerCase();
      if (firstCell.includes('province') || firstCell.includes('employer')) {
        headerIndex = i;
        break;
      }
    }
  }
  
  if (headerIndex === -1) return rows;
  
  const headers = (jsonData[headerIndex] as (string | number)[]).map(h => String(h).trim());
  
  for (let i = headerIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i] as (string | number)[];
    if (!row || row.length < 3) continue;
    
    const rowData: BaseRow = {};
    headers.forEach((header, index) => {
      if (row[index] !== undefined && row[index] !== '') {
        rowData[header as keyof BaseRow] = String(row[index]);
      }
    });
    
    if (rowData['Employer'] && rowData['Address']) {
      rows.push(rowData);
    }
  }
  
  return rows;
}

// Convert parsed data to our data structures
function convertToStructuredData(rows: BaseRow[], year: number, quarter: string): { employers: EmployerWithApprovals[]; approvals: LMIAApproval[] } {
  const employerMap = new Map<string, EmployerWithApprovals>();
  const approvals: LMIAApproval[] = [];
  
  rows.forEach((row, index) => {
    const employerName = row['Employer'] || '';
    const address = row['Address'] || '';
    const province = row['Province/Territory'] || '';
    const positions = Number(row['Positions Approved'] || row['Positions approved'] || row['Approved Positions'] || 1);
    const stream = row['Stream'] || row['Program Stream'] || 'Unknown';
    const occupation = row['Occupations under NOC 2011'] || row['Occupation'] || '';
    const nocCode = extractNOCCode(occupation);
    const { city, postal_code } = extractCityAndPostalCode(address);
    const { latitude, longitude } = getCoordinates(province, city);
    
    // Create or update employer
    const employerId = `${employerName}-${province}-${city}`.replace(/\s+/g, '-').toLowerCase();
    
    if (!employerMap.has(employerId)) {
      employerMap.set(employerId, {
        id: employerId,
        employer_name: employerName,
        address: address,
        city: city,
        province_territory: province,
        postal_code: postal_code,
        latitude: latitude,
        longitude: longitude,
        incorporate_status: row['Incorporate Status'] || 'Unknown',
        approvals: [], // Will be populated later
        total_positions: 0, // Will be calculated
        total_lmias: 0, // Will be calculated
        primary_program: stream,
        primary_occupation: occupation
      });
    }
    
    // Create approval record
    const approvalId = `${employerId}-${year}-${quarter}-${index}`;
    approvals.push({
      id: approvalId,
      employer_id: employerId,
      year: year,
      quarter: quarter,
      program_stream: stream,
      occupation: occupation,
      noc_code: nocCode,
      positions_approved: positions,
      lmias_approved: 1
    });
  });
  
  // Calculate totals and populate approvals for each employer
  const employers = Array.from(employerMap.values()).map(employer => {
    const employerApprovals = approvals.filter(approval => approval.employer_id === employer.id);
    const totalPositions = employerApprovals.reduce((sum, approval) => sum + approval.positions_approved, 0);
    const totalLMIAs = employerApprovals.length;
    
    return {
      ...employer,
      approvals: employerApprovals,
      total_positions: totalPositions,
      total_lmias: totalLMIAs
    };
  });
  
  return {
    employers: employers,
    approvals: approvals
  };
}

// Main function to load data for a specific year and quarter
export async function loadLMIAData(year: number, quarter: string): Promise<{ employers: EmployerWithApprovals[]; approvals: LMIAApproval[] }> {
  try {
    const yearData = AVAILABLE_DATA[year as keyof typeof AVAILABLE_DATA];
    if (!yearData || !yearData.files.length) {
      console.warn(`No data available for ${year}`);
      return { employers: [] as EmployerWithApprovals[], approvals: [] };
    }
    
    // Find the appropriate file for the quarter
    let fileName = '';
    if (quarter === 'Q1-Q4' || quarter === 'Q1-Q2') {
      fileName = yearData.files[0]; // Use first file for full year or first half
    } else {
      const quarterIndex = yearData.quarters.indexOf(quarter);
      if (quarterIndex >= 0 && quarterIndex < yearData.files.length) {
        fileName = yearData.files[quarterIndex];
      } else {
        fileName = yearData.files[0]; // Fallback to first file
      }
    }
    
    const filePath = `/data/LMIA-DATA/${year}/${fileName}`;
    console.log(`Loading LMIA data from: ${filePath}`);
    
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch data file: ${response.statusText}`);
    }
    
    let rows: BaseRow[] = [];
    
    if (fileName.endsWith('.csv')) {
      const csvContent = await response.text();
      rows = parseCSVData(csvContent, year, quarter);
    } else if (fileName.endsWith('.xlsx')) {
      const arrayBuffer = await response.arrayBuffer();
      rows = parseExcelData(arrayBuffer, year, quarter);
    }
    
    console.log(`Parsed ${rows.length} rows from ${fileName}`);
    return convertToStructuredData(rows, year, quarter);
    
  } catch (error) {
    console.error(`Error loading LMIA data for ${year} ${quarter}:`, error);
    return { employers: [], approvals: [] };
  }
}

// Function to get all available years and quarters
export function getAvailableData(): { years: number[]; quarters: { [year: number]: string[] } } {
  const years = Object.keys(AVAILABLE_DATA).map(Number).sort();
  const quarters: { [year: number]: string[] } = {};
  
  years.forEach(year => {
    quarters[year] = AVAILABLE_DATA[year as keyof typeof AVAILABLE_DATA].quarters;
  });
  
  return { years, quarters };
}
