import { useState, useCallback } from 'react';
import { performBenfordAnalysis } from '../utils/benfordAnalysis';
import { performAuditApi } from '../utils/apiService';
import type { ProcessedDataset, BenfordResult } from '../types';

interface UseBenfordAnalysisReturn {
  // Analysis state
  benfordResult: BenfordResult | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  analysisSource: 'backend' | 'local' | null;

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
  const [analysisSource, setAnalysisSource] = useState<'backend' | 'local' | null>(null);

  const runAnalysis = useCallback(async (dataset: ProcessedDataset) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setBenfordResult(null);
    setAnalysisSource(null);

    try {
      // --- Try backend first (supports Redis caching) ---
      try {
        const response = await performAuditApi(dataset);
        if (response.success && response.data) {
          setBenfordResult(response.data as BenfordResult);
          setAnalysisSource('backend');
          return;
        }
      } catch (backendError) {
        // Backend unavailable — fall through to local analysis
        console.warn('Backend audit unavailable, running locally:', backendError);
      }

      // --- Local fallback ---
      await new Promise(resolve => setTimeout(resolve, 800));
      const result = performBenfordAnalysis(dataset);
      setBenfordResult(result);
      setAnalysisSource('local');
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
    setAnalysisSource(null);
  }, []);

  // Computed state
  const hasResult = benfordResult !== null;
  const isCompliant =
    benfordResult?.overallAssessment === 'compliant' ||
    benfordResult?.overallAssessment === 'acceptable';
  const needsInvestigation =
    benfordResult?.riskLevel === 'high' || benfordResult?.riskLevel === 'critical';

  return {
    benfordResult,
    isAnalyzing,
    analysisError,
    analysisSource,
    runAnalysis,
    resetAnalysis,
    hasResult,
    isCompliant,
    needsInvestigation,
  };
}
