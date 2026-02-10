import { useState, useCallback } from 'react';
import { performBenfordAnalysis } from '../utils/benfordAnalysis';
import type { ProcessedDataset, BenfordResult } from '../types';

interface UseBenfordAnalysisReturn {
  // Analysis state
  benfordResult: BenfordResult | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  
  // Actions
  runAnalysis: (dataset: ProcessedDataset) => Promise<void>;
  resetAnalysis: () => void;
  
  // Computed state
  hasResult: boolean;
  isCompliant: boolean;
  needsInvestigation: boolean;
}

export function useBenfordAnalysis(): UseBenfordAnalysisReturn {
  const [benfordResult, setBenfordResult] = useState<BenfordResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const runAnalysis = useCallback(async (dataset: ProcessedDataset) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setBenfordResult(null);

    try {
      // Simulate some processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = performBenfordAnalysis(dataset);
      setBenfordResult(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setAnalysisError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const resetAnalysis = useCallback(() => {
    setBenfordResult(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
  }, []);

  // Computed state
  const hasResult = benfordResult !== null;
  const isCompliant = benfordResult?.overallAssessment === 'compliant' || 
                     benfordResult?.overallAssessment === 'acceptable';
  const needsInvestigation = benfordResult?.riskLevel === 'high' || 
                           benfordResult?.riskLevel === 'critical';

  return {
    benfordResult,
    isAnalyzing,
    analysisError,
    runAnalysis,
    resetAnalysis,
    hasResult,
    isCompliant,
    needsInvestigation,
  };
}
