import * as XLSX from 'xlsx';

export interface ExcelDataRow {
  [key: string]: string | number | boolean | null;
}

export function readExcelFile(filePath: string): ExcelDataRow[] {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Get first sheet
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return data as ExcelDataRow[];
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return [];
  }
}

export function getExcelHeaders(filePath: string): string[] {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    const headers: string[] = [];
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      const cell = worksheet[cellAddress];
      headers.push(cell ? cell.v : '');
    }
    
    return headers;
  } catch (error) {
    console.error('Error reading Excel headers:', error);
    return [];
  }
}
