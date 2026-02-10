// Core data types for ExpenseAudit AI

export interface RawDataRow {
  [key: string]: string | number | Date | null | undefined;
}

export interface CleanedDataRow {
  amount: number;
  vendor?: string;
  date?: Date;
  category?: string;
  originalRow?: RawDataRow;
}

export interface ColumnMapping {
  amount: string;
  vendor?: string;
  date?: string;
  category?: string;
}

export interface ValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  removedRows: number;
  errors: string[];
  warnings: string[];
}

export interface DataPreview {
  columns: string[];
  sampleRows: RawDataRow[];
  totalRows: number;
}

export interface ProcessedDataset {
  data: CleanedDataRow[];
  validation: ValidationResult;
  columnMapping: ColumnMapping;
  preview: DataPreview;
}

export type FileType = 'csv' | 'xlsx' | 'json';

export interface FileUploadState {
  file: File | null;
  fileType: FileType | null;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

// Benford's Law Analysis Types
export interface DigitFrequency {
  digit: number;
  count: number;
  observed: number; // percentage
  expected: number; // percentage
  deviation: number; // absolute difference
}

export interface BenfordResult {
  // Overall statistics
  totalAnalyzed: number;
  digitFrequencies: DigitFrequency[];
  
  // Deviation metrics
  chiSquare: number;
  mad: number; // Mean Absolute Deviation
  
  // Interpretation
  overallAssessment: 'compliant' | 'acceptable' | 'suspicious' | 'highly_suspicious';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Flagged items
  suspiciousVendors: VendorAnalysis[];
  flaggedTransactions: FlaggedTransaction[];
  
  // Warnings
  warnings: string[];
}

export interface VendorAnalysis {
  vendor: string;
  transactionCount: number;
  mad: number;
  chiSquare: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suspiciousPatterns: string[];
  digitDistribution: Record<number, number>;
}

export interface FlaggedTransaction {
  index: number;
  amount: number;
  vendor?: string;
  firstDigit: number;
  reason: string;
  riskLevel: 'medium' | 'high' | 'critical';
}
