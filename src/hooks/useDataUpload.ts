import { useState, useCallback } from 'react';
import { parseFile, autoDetectColumns, processData } from '../utils/dataProcessing';
import { useUsageTracking } from './useUsageTracking';
import type { 
  FileUploadState, 
  ProcessedDataset, 
  ColumnMapping, 
  RawDataRow, 
  FileType 
} from '../types';

interface UseDataUploadReturn {
  // Upload state
  uploadState: FileUploadState;
  
  // Raw data after parsing
  rawData: RawDataRow[] | null;
  availableColumns: string[];
  
  // Column mapping
  suggestedMapping: Partial<ColumnMapping>;
  currentMapping: ColumnMapping | null;
  
  // Processed data
  processedDataset: ProcessedDataset | null;
  
  // Actions
  handleFileSelect: (file: File, fileType: FileType) => Promise<void>;
  updateColumnMapping: (mapping: ColumnMapping) => void;
  resetUpload: () => void;
  
  // State flags
  isFileUploaded: boolean;
  isColumnsMapped: boolean;
  isDataProcessed: boolean;
  canProceedToAnalysis: boolean;
}

export function useDataUpload(): UseDataUploadReturn {
  const { incrementUsage } = useUsageTracking();
  
  // Upload state
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    fileType: null,
    isUploading: false,
    uploadProgress: 0,
    error: null,
  });

  // Raw data state
  const [rawData, setRawData] = useState<RawDataRow[] | null>(null);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  // Column mapping state
  const [suggestedMapping, setSuggestedMapping] = useState<Partial<ColumnMapping>>({});
  const [currentMapping, setCurrentMapping] = useState<ColumnMapping | null>(null);

  // Processed data state
  const [processedDataset, setProcessedDataset] = useState<ProcessedDataset | null>(null);

  // Handle file selection and parsing
  const handleFileSelect = useCallback(async (file: File, fileType: FileType) => {
    setUploadState({
      file,
      fileType,
      isUploading: true,
      uploadProgress: 0,
      error: null,
    });

    try {
      // Simulate upload progress
      setUploadState(prev => ({ ...prev, uploadProgress: 25 }));
      
      // Parse the file
      const { data, columns } = await parseFile(file);
      
      setUploadState(prev => ({ ...prev, uploadProgress: 75 }));
      
      // Auto-detect column mappings
      const detectedMapping = autoDetectColumns(columns);
      
      // Update state
      setRawData(data);
      setAvailableColumns(columns);
      setSuggestedMapping(detectedMapping);
      
      // Always set current mapping immediately if amount is detected
      if (detectedMapping.amount) {
        const completeMapping: ColumnMapping = {
          amount: detectedMapping.amount,
          vendor: detectedMapping.vendor,
          date: detectedMapping.date,
          category: detectedMapping.category,
        };
        setCurrentMapping(completeMapping);
        
        // Process data immediately
        try {
          const processed = processData(data, completeMapping);
          setProcessedDataset(processed);
        } catch (error) {
          console.error('Auto-processing error:', error);
        }
      }
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 100,
        error: null,
      }));

      // Track file upload completion
      incrementUsage('filesUploaded');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 0,
        error: errorMessage,
      }));
      
      // Reset data on error
      setRawData(null);
      setAvailableColumns([]);
      setSuggestedMapping({});
      setCurrentMapping(null);
      setProcessedDataset(null);
    }
  }, [incrementUsage]);

  // Update column mapping and process data
  const updateColumnMapping = useCallback((mapping: ColumnMapping) => {
    setCurrentMapping(mapping);
    
    if (rawData && rawData.length > 0) {
      try {
        const processed = processData(rawData, mapping);
        setProcessedDataset(processed);
      } catch (error) {
        console.error('Data processing error:', error);
        setProcessedDataset(null);
      }
    }
  }, [rawData]);

  // Reset all state
  const resetUpload = useCallback(() => {
    setUploadState({
      file: null,
      fileType: null,
      isUploading: false,
      uploadProgress: 0,
      error: null,
    });
    setRawData(null);
    setAvailableColumns([]);
    setSuggestedMapping({});
    setCurrentMapping(null);
    setProcessedDataset(null);
  }, []);

  // Computed state flags
  const isFileUploaded = uploadState.file !== null && rawData !== null && !uploadState.error;
  const isColumnsMapped = currentMapping !== null && currentMapping.amount !== undefined;
  const isDataProcessed = processedDataset !== null;
  const canProceedToAnalysis = isDataProcessed && 
    processedDataset?.validation.isValid === true &&
    processedDataset?.validation.validRows >= 10;

  return {
    // State
    uploadState,
    rawData,
    availableColumns,
    suggestedMapping,
    currentMapping,
    processedDataset,
    
    // Actions
    handleFileSelect,
    updateColumnMapping,
    resetUpload,
    
    // Flags
    isFileUploaded,
    isColumnsMapped,
    isDataProcessed,
    canProceedToAnalysis,
  };
}
