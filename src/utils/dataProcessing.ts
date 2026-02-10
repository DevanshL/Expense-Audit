import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { RawDataRow, CleanedDataRow, ColumnMapping, ProcessedDataset, FileType } from '../types';

/**
 * Parse different file formats into raw data
 */
export async function parseFile(file: File): Promise<{ data: RawDataRow[]; columns: string[] }> {
  const fileType = getFileType(file.name);
  
  switch (fileType) {
    case 'csv':
      return parseCsvFile(file);
    case 'xlsx':
      return parseExcelFile(file);
    case 'json':
      return parseJsonFile(file);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Get file type from filename
 */
export function getFileType(filename: string): FileType {
  const extension = filename.toLowerCase().split('.').pop();
  switch (extension) {
    case 'csv':
      return 'csv';
    case 'xlsx':
    case 'xls':
      return 'xlsx';
    case 'json':
      return 'json';
    default:
      throw new Error(`Unsupported file extension: ${extension}`);
  }
}

/**
 * Parse CSV file using PapaParse
 */
async function parseCsvFile(file: File): Promise<{ data: RawDataRow[]; columns: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
          return;
        }
        
        const data = results.data as RawDataRow[];
        const columns = results.meta.fields || [];
        resolve({ data, columns });
      },
      error: (error) => reject(new Error(`CSV parsing failed: ${error.message}`))
    });
  });
}

/**
 * Parse Excel file using SheetJS
 */
async function parseExcelFile(file: File): Promise<{ data: RawDataRow[]; columns: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Use the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }
        
        // First row as headers
        const columns = (jsonData[0] as string[]).map(col => String(col));
        
        // Convert remaining rows to objects
        const processedData: RawDataRow[] = jsonData.slice(1).map((row: unknown[]) => {
          const rowObj: RawDataRow = {};
          columns.forEach((col, index) => {
            const value = row[index];
            // Type guard to ensure we only assign valid types
            if (typeof value === 'string' || typeof value === 'number' || value instanceof Date || value === null || value === undefined) {
              rowObj[col] = value;
            } else {
              rowObj[col] = String(value);
            }
          });
          return rowObj;
        });
        
        resolve({ data: processedData, columns });
      } catch (error) {
        reject(new Error(`Excel parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read Excel file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse JSON file
 */
async function parseJsonFile(file: File): Promise<{ data: RawDataRow[]; columns: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        if (!Array.isArray(jsonData)) {
          reject(new Error('JSON file must contain an array of objects'));
          return;
        }
        
        if (jsonData.length === 0) {
          reject(new Error('JSON file is empty'));
          return;
        }
        
        // Extract all unique column names
        const columnSet = new Set<string>();
        jsonData.forEach(row => {
          if (typeof row === 'object' && row !== null) {
            Object.keys(row).forEach(key => columnSet.add(key));
          }
        });
        
        const columns = Array.from(columnSet);
        const data = jsonData as RawDataRow[];
        
        resolve({ data, columns });
      } catch (error) {
        reject(new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Invalid JSON format'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read JSON file'));
    reader.readAsText(file);
  });
}

/**
 * Auto-detect likely column mappings
 */
export function autoDetectColumns(columns: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};
  
  // Common patterns for amount columns
  const amountPatterns = ['amount', 'price', 'cost', 'value', 'total', 'sum', 'expense'];
  const vendorPatterns = ['vendor', 'supplier', 'company', 'merchant', 'payee', 'from'];
  const datePatterns = ['date', 'time', 'created', 'transaction', 'when'];
  const categoryPatterns = ['category', 'type', 'class', 'department', 'tag'];
  
  columns.forEach(col => {
    const colLower = col.toLowerCase();
    
    // Check for amount column
    if (!mapping.amount && amountPatterns.some(pattern => colLower.includes(pattern))) {
      mapping.amount = col;
    }
    
    // Check for vendor column
    if (!mapping.vendor && vendorPatterns.some(pattern => colLower.includes(pattern))) {
      mapping.vendor = col;
    }
    
    // Check for date column
    if (!mapping.date && datePatterns.some(pattern => colLower.includes(pattern))) {
      mapping.date = col;
    }
    
    // Check for category column
    if (!mapping.category && categoryPatterns.some(pattern => colLower.includes(pattern))) {
      mapping.category = col;
    }
  });
  
  return mapping;
}

/**
 * Clean and validate amount values
 */
export function cleanAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Convert to string for processing
  let cleanValue = String(value);
  
  // Remove currency symbols and common formatting
  cleanValue = cleanValue
    .replace(/[₹$€£¥,\s]/g, '') // Remove currency symbols and commas
    .replace(/[()]/g, '') // Remove parentheses
    .trim();
  
  // Handle negative values in parentheses format
  if (String(value).includes('(') && String(value).includes(')')) {
    cleanValue = '-' + cleanValue;
  }
  
  // Try to parse as number
  const parsed = parseFloat(cleanValue);
  
  if (isNaN(parsed)) {
    return null;
  }
  
  return parsed;
}

/**
 * Clean and validate date values
 */
export function cleanDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // If it's already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  
  // Try to parse various date formats
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  // For other types, try converting to string first
  try {
    const parsed = new Date(String(value));
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Process raw data with column mapping
 */
export function processData(
  rawData: RawDataRow[],
  columnMapping: ColumnMapping
): ProcessedDataset {
  const cleanedData: CleanedDataRow[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let removedRows = 0;
  
  // Validate column mapping
  if (!columnMapping.amount) {
    errors.push('Amount column is required but not mapped');
    return {
      data: [],
      validation: {
        isValid: false,
        totalRows: rawData.length,
        validRows: 0,
        removedRows: rawData.length,
        errors,
        warnings
      },
      columnMapping,
      preview: {
        columns: [],
        sampleRows: [],
        totalRows: 0
      }
    };
  }
  
  // Process each row
  rawData.forEach((row, index) => {
    try {
      // Clean amount (required)
      const amount = cleanAmount(row[columnMapping.amount]);
      
      if (amount === null || amount <= 0) {
        removedRows++;
        return; // Skip this row
      }
      
      // Clean optional fields
      const vendor = columnMapping.vendor ? String(row[columnMapping.vendor] || '').trim() || undefined : undefined;
      const date = columnMapping.date ? cleanDate(row[columnMapping.date]) || undefined : undefined;
      const category = columnMapping.category ? String(row[columnMapping.category] || '').trim() || undefined : undefined;
      
      cleanedData.push({
        amount,
        vendor,
        date,
        category,
        originalRow: row
      });
      
    } catch (error) {
      removedRows++;
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Processing error'}`);
    }
  });
  
  // Validation checks
  const validRows = cleanedData.length;
  const totalRows = rawData.length;
  
  if (validRows < 10) {
    warnings.push('Dataset has fewer than 10 valid entries. Analysis may not be reliable.');
  }
  
  if (validRows < 100) {
    warnings.push('Dataset has fewer than 100 entries. Benford\'s Law analysis works better with larger datasets.');
  }
  
  if (removedRows > totalRows * 0.5) {
    warnings.push(`More than 50% of rows were removed during cleaning (${removedRows}/${totalRows})`);
  }
  
  const isValid = validRows >= 10 && errors.length === 0;
  
  // Create preview
  const columns = Object.keys(rawData[0] || {});
  const sampleRows = rawData.slice(0, 20);
  
  return {
    data: cleanedData,
    validation: {
      isValid,
      totalRows,
      validRows,
      removedRows,
      errors,
      warnings
    },
    columnMapping,
    preview: {
      columns,
      sampleRows,
      totalRows
    }
  };
}
