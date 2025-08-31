import { Employer, LMIAApproval } from '../types/lmia';

// Interface for raw Excel data
interface ExcelRow {
  'Province/Territory': string;
  'Program Stream': string;
  'Employer': string;
  'Address': string;
  'Occupation': string;
  'Incorporate Status': string;
  'Approved LMIAs': number;
  'Approved Positions': number;
}

// Helper function to generate unique IDs
let employerIdCounter = 1;
let approvalIdCounter = 1;

function generateEmployerId(): string {
  return `emp-${String(employerIdCounter++).padStart(3, '0')}`;
}

function generateApprovalId(): string {
  return `app-${String(approvalIdCounter++).padStart(3, '0')}`;
}

// Helper function to extract coordinates from address (simplified)
function getCoordinatesFromAddress(address: string, province: string): { latitude: number; longitude: number; city: string } {
  // This is a simplified approach - in a real application, you'd use a geocoding service
  const cityMap: Record<string, { lat: number; lng: number; city: string }> = {
    'Newfoundland and Labrador': { lat: 53.1355, lng: -57.6604, city: 'St. John\'s' },
    'Prince Edward Island': { lat: 46.2382, lng: -63.1311, city: 'Charlottetown' },
    'Nova Scotia': { lat: 44.6488, lng: -63.5752, city: 'Halifax' },
    'New Brunswick': { lat: 45.9636, lng: -66.6431, city: 'Fredericton' },
    'Quebec': { lat: 46.8139, lng: -71.2080, city: 'Quebec City' },
    'Ontario': { lat: 43.6532, lng: -79.3832, city: 'Toronto' },
    'Manitoba': { lat: 49.8951, lng: -97.1384, city: 'Winnipeg' },
    'Saskatchewan': { lat: 50.4452, lng: -104.6189, city: 'Regina' },
    'Alberta': { lat: 51.0447, lng: -114.0719, city: 'Calgary' },
    'British Columbia': { lat: 49.2827, lng: -123.1207, city: 'Vancouver' },
    'Northwest Territories': { lat: 62.4540, lng: -114.3718, city: 'Yellowknife' },
    'Nunavut': { lat: 63.7467, lng: -68.5170, city: 'Iqaluit' },
    'Yukon': { lat: 60.7212, lng: -135.0568, city: 'Whitehorse' }
  };

  const coords = cityMap[province] || { lat: 56.1304, lng: -106.3468, city: 'Unknown' };
  
  // Try to extract city from address
  const addressParts = address.split(',');
  const city = addressParts.length > 1 ? addressParts[0].trim() : coords.city;
  
  return {
    latitude: coords.lat,
    longitude: coords.lng,
    city
  };
}

// Helper function to extract postal code from address
function extractPostalCode(address: string): string {
  const postalCodeMatch = address.match(/[A-Z]\d[A-Z]\s?\d[A-Z]\d/);
  return postalCodeMatch ? postalCodeMatch[0] : '';
}

// Helper function to extract NOC code from occupation
function extractNOCCode(occupation: string): string {
  const nocMatch = occupation.match(/(\d{5})/);
  return nocMatch ? nocMatch[1] : '';
}

// Load and parse Excel data from File object (browser environment)
export function loadExcelDataFromFile(file: File): Promise<{ employers: Employer[]; approvals: LMIAApproval[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('No data read from file'));
          return;
        }

        // Import XLSX dynamically to avoid bundling issues
        import('xlsx').then((XLSX) => {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Convert to our ExcelRow format
          const excelRows: ExcelRow[] = [];
          for (let i = 2; i < jsonData.length; i++) { // Skip header rows
            const row = jsonData[i] as (string | number)[];
            if (row && row.length >= 8 && row[2]) { // Check if row has required data
              excelRows.push({
                'Province/Territory': row[0] || '',
                'Program Stream': row[1] || '',
                'Employer': row[2] || '',
                'Address': row[3] || '',
                'Occupation': row[4] || '',
                'Incorporate Status': row[5] || '',
                'Approved LMIAs': Number(row[6]) || 0,
                'Approved Positions': Number(row[7]) || 0
              });
            }
          }
          
          const result = convertExcelDataToStructured(excelRows);
          resolve(result);
        }).catch(reject);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

// Convert Excel data to our data structures
export function convertExcelDataToStructured(excelRows: ExcelRow[]): { employers: Employer[]; approvals: LMIAApproval[] } {
  const employerMap = new Map<string, Employer>();
  const approvals: LMIAApproval[] = [];

  excelRows.forEach((row, index) => {
    // Skip header rows and empty rows
    if (index < 2 || !row['Employer'] || !row['Province/Territory']) {
      return;
    }

    const employerName = row['Employer'].trim();
    const province = row['Province/Territory'].trim();
    const address = row['Address'].trim();
    
    // Create or get existing employer
    let employer = employerMap.get(employerName);
    if (!employer) {
      const coords = getCoordinatesFromAddress(address, province);
      const postalCode = extractPostalCode(address);
      
      employer = {
        id: generateEmployerId(),
        employer_name: employerName,
        address: address,
        province_territory: province,
        incorporate_status: row['Incorporate Status'].trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        city: coords.city,
        postal_code: postalCode
      };
      employerMap.set(employerName, employer);
    }

    // Create approval record
    const approval: LMIAApproval = {
      id: generateApprovalId(),
      employer_id: employer.id,
      year: 2025, // From filename: tfwp_2025q1_pos_en.xlsx
      quarter: 'Q1', // From filename
      program_stream: row['Program Stream'].trim(),
      noc_code: extractNOCCode(row['Occupation']),
      occupation: row['Occupation'].trim(),
      approved_lmias: row['Approved LMIAs'],
      approved_positions: row['Approved Positions']
    };

    approvals.push(approval);
  });

  return {
    employers: Array.from(employerMap.values()),
    approvals
  };
}

// Function to load data from Excel file automatically with pagination
export async function loadDataFromExcel(limit: number = 1000): Promise<{ employers: Employer[]; approvals: LMIAApproval[] }> {
  try {
    // Fetch the Excel file from the public directory
    const response = await fetch('/data/tfwp_2025q1_pos_en.xlsx');
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Import XLSX dynamically
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Convert to our ExcelRow format with limit
    const excelRows: ExcelRow[] = [];
    const maxRows = Math.min(2 + limit, jsonData.length); // Start from row 2, limit total rows
    
    for (let i = 2; i < maxRows; i++) { // Skip header rows
      const row = jsonData[i] as (string | number)[];
      if (row && row.length >= 8 && row[2]) { // Check if row has required data
        excelRows.push({
          'Province/Territory': String(row[0] || ''),
          'Program Stream': String(row[1] || ''),
          'Employer': String(row[2] || ''),
          'Address': String(row[3] || ''),
          'Occupation': String(row[4] || ''),
          'Incorporate Status': String(row[5] || ''),
          'Approved LMIAs': Number(row[6]) || 0,
          'Approved Positions': Number(row[7]) || 0
        });
      }
    }
    
    console.log(`Loaded ${excelRows.length} records from Excel file (limited to ${limit})`);
    return convertExcelDataToStructured(excelRows);
  } catch (error) {
    console.error('Error loading Excel data:', error);
    return { employers: [], approvals: [] };
  }
}
