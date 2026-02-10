import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Copy, Download, Sparkles, AlertCircle, CheckCircle, Clock, Zap, FileText, Table, BarChart, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';
import { generateAISummary } from '../../utils/aiSummary';
import { createFallbackSummary, type GeminiSummary } from '../../utils/geminiIntegration';
import { useUsageTracking } from '../../hooks/useUsageTracking';
import { GeminiAPITest } from './GeminiAPITest';
import { useAuth } from '../../hooks/useAuth';
import { 
  generateExecutiveReport, 
  exportFlaggedTransactionsCSV, 
  exportSuspiciousVendorsCSV, 
  generateJSONExport,
  downloadFile,
  generateFilename 
} from '../../utils/reportExporter';
import type { BenfordResult, ProcessedDataset } from '../../types';

interface AISummaryPanelProps {
  result: BenfordResult;
  dataset: ProcessedDataset;
  className?: string;
}

export function AISummaryPanel({ result, dataset, className }: AISummaryPanelProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { incrementUsage } = useUsageTracking();
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isGeneratingGemini, setIsGeneratingGemini] = useState(false);
  const [geminiSummary, setGeminiSummary] = useState<GeminiSummary | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{ success: boolean; message: string; model?: string } | null>(null);

  // Check if user has AI configuration and API keys
  const preferredProvider = user?.aiConfig?.preferredProvider;
  const currentProviderHasKey = preferredProvider && user?.aiConfig?.models?.[preferredProvider]?.hasApiKey;
  const currentModel = preferredProvider ? user?.aiConfig?.models?.[preferredProvider]?.model : undefined;

  // Generate rule-based summary
  const aiSummary = generateAISummary(result, dataset);

  const handleGenerateGeminiSummary = async () => {
    // Check if user has configured AI settings and API key
    if (!currentProviderHasKey) {
      console.warn('No API key configured for provider:', preferredProvider);
      // Navigate to settings if no API key configured
      navigate('/settings?tab=ai-config');
      return;
    }

    // Validate inputs before making API call
    if (!result || !dataset) {
      setGeminiError('Missing analysis data. Please ensure you have completed the Benford analysis first.');
      return;
    }

    if (!result.digitFrequencies || result.digitFrequencies.length === 0) {
      setGeminiError('No digit frequency data available. Please run the analysis again.');
      return;
    }

    // Check authentication token
    const token = localStorage.getItem('expense-audit-token');
    if (!token) {
      setGeminiError('Authentication required. Please log in again.');
      return;
    }

    setIsGeneratingGemini(true);
    setGeminiError(null);

    try {
      console.log('Generating AI summary with configured model:', {
        provider: preferredProvider,
        model: currentModel,
        hasApiKey: currentProviderHasKey,
        totalAnalyzed: result.totalAnalyzed,
        mad: result.mad,
        chiSquare: result.chiSquare,
        digitFrequenciesCount: result.digitFrequencies.length,
        datasetRows: dataset.preview.totalRows
      });

      // Use the backend AI configuration API to generate summary
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          result,
          dataset: {
            preview: dataset.preview
          }
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Read the response body only once as text, then parse as needed
      const responseText = await response.text();
      console.log('Raw response text (first 500 chars):', responseText.substring(0, 500));

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
          console.error('Parsed error response:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
          throw new Error(`Server error (${response.status}): ${responseText || 'Unable to parse response'}`);
        }
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      let summaryData;
      try {
        summaryData = JSON.parse(responseText);
        console.log('Parsed success response:', { 
          success: summaryData.success, 
          hasData: !!summaryData.data,
          hasSummary: !!summaryData.data?.summary 
        });
      } catch (parseError) {
        console.error('Failed to parse success response as JSON:', parseError);
        throw new Error('Failed to parse server response. The server may have returned invalid data.');
      }

      if (!summaryData.success || !summaryData.data || !summaryData.data.summary) {
        console.error('Invalid response format:', summaryData);
        throw new Error('Invalid response format from server');
      }

      setGeminiSummary(summaryData.data.summary);
      console.log('AI summary generated successfully with model:', currentModel);
      
      // Track AI summary generation
      incrementUsage('aiSummariesGenerated');
    } catch (error) {
      let errorMessage = 'Failed to generate AI summary';
      
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes('quota') || message.includes('limit')) {
          errorMessage = 'API quota exceeded. Please check your Gemini API usage limits and try again later.';
        } else if (message.includes('Invalid content structure')) {
          errorMessage = 'API response format error. This may be due to content filtering or model availability issues.';
        } else if (message.includes('No candidates')) {
          errorMessage = 'No response generated. This may be due to content filtering or API limitations.';
        } else if (message.includes('blocked') || message.includes('safety')) {
          errorMessage = 'Content was blocked by safety filters. Please try rephrasing your request.';
        } else {
          errorMessage = `AI analysis failed: ${message}`;
        }
      }
      
      console.error('Gemini API Error:', error);
      setGeminiError(errorMessage);
      
      // Fallback to rule-based summary
      console.log('Using fallback summary');
      const fallback = createFallbackSummary(aiSummary);
      setGeminiSummary(fallback);
    } finally {
      setIsGeneratingGemini(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard');
    });
  };

  const handleExportSummary = () => {
    const exportData = {
      type: 'AI_Analysis_Summary',
      generatedAt: new Date().toISOString(),
      dataset: {
        totalTransactions: result.totalAnalyzed,
        analysisDate: new Date().toISOString()
      },
      ruleBasedSummary: aiSummary,
      aiSummary: geminiSummary,
      rawAnalysis: {
        mad: result.mad,
        chiSquare: result.chiSquare,
        riskLevel: result.riskLevel,
        overallAssessment: result.overallAssessment
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_fraud_analysis_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    incrementUsage('reportsGenerated');
  };

  const handleExportExecutiveReport = () => {
    const report = generateExecutiveReport(result, dataset, aiSummary, geminiSummary);
    downloadFile(report, generateFilename('executive_report', 'md'), 'text/markdown');
    incrementUsage('reportsGenerated');
  };

  const handleExportFlaggedTransactions = () => {
    const csv = exportFlaggedTransactionsCSV(result, dataset);
    downloadFile(csv, generateFilename('flagged_transactions', 'csv'), 'text/csv');
    incrementUsage('reportsGenerated');
  };

  const handleExportSuspiciousVendors = () => {
    const csv = exportSuspiciousVendorsCSV(result);
    downloadFile(csv, generateFilename('suspicious_vendors', 'csv'), 'text/csv');
    incrementUsage('reportsGenerated');
  };

  const handleExportFullAnalysis = () => {
    const jsonData = generateJSONExport(result, dataset, aiSummary, geminiSummary);
    downloadFile(JSON.stringify(jsonData, null, 2), generateFilename('full_analysis', 'json'), 'application/json');
    incrementUsage('reportsGenerated');
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">AI-Powered Analysis Summary</h2>
              <p className="text-blue-100">
                Natural language insights from your fraud detection analysis
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportSummary}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Summary</span>
            </button>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(aiSummary.keyMetrics).map(([key, value]) => (
          <div key={key} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
            <div className="text-lg font-semibold text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      {/* Rule-based AI Summary */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Intelligent Analysis Summary</h3>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{aiSummary.riskAssessment.confidence}% confidence</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Executive Summary */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Executive Summary</span>
            </h4>
            <p className="text-gray-700 leading-relaxed">{aiSummary.executiveSummary}</p>
            <button
              onClick={() => handleCopyToClipboard(aiSummary.executiveSummary)}
              className="mt-2 inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>

          {/* Key Findings */}
          {aiSummary.overallFindings.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Key Findings</span>
              </h4>
              <ul className="space-y-2">
                {aiSummary.overallFindings.map((finding, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vendor Insights */}
          {aiSummary.vendorInsights.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Vendor Analysis</span>
              </h4>
              <ul className="space-y-2">
                {aiSummary.vendorInsights.map((insight, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Transaction Insights */}
          {aiSummary.transactionInsights.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Transaction Patterns</span>
              </h4>
              <ul className="space-y-2">
                {aiSummary.transactionInsights.map((insight, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {aiSummary.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Recommendations</span>
              </h4>
              <ol className="space-y-2">
                {aiSummary.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: recommendation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced AI Analysis Section - Redesigned */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <div className="flex items-center space-x-4">
                <span className="text-lg font-semibold text-gray-900">Model:</span>
                <div className="flex flex-col">
                  <div className="text-lg font-semibold text-gray-900">
                    {preferredProvider ? preferredProvider.charAt(0).toUpperCase() + preferredProvider.slice(1) : 'No Provider'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentModel || 'No Model Selected'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/settings?tab=ai-config')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                title="AI Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Configuration Status */}
          {!currentProviderHasKey ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis Ready</h4>
              <p className="text-gray-600 mb-4">
                Configure your API keys to start advanced AI analysis with the latest models
              </p>
              <button
                onClick={() => navigate('/settings?tab=ai-config')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure AI Settings
              </button>
            </div>
          ) : !currentModel ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Model Not Configured</h4>
              <p className="text-gray-600 mb-4">
                Please configure your AI model in settings to start analysis
              </p>
              <button
                onClick={() => navigate('/settings?tab=ai-config')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure AI Settings
              </button>
            </div>
          ) : !geminiSummary && !geminiError ? (
            <div className="text-center py-8">
              <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready for Analysis</h4>
              <div className="text-sm text-gray-600 mb-6 space-y-1">
                <p>Provider: <span className="font-medium text-gray-900">{preferredProvider?.charAt(0).toUpperCase() + preferredProvider?.slice(1)}</span></p>
                <p>Model: <span className="font-medium text-gray-900">{currentModel}</span></p>
              </div>
              {currentProviderHasKey && currentModel && (
                <button
                  onClick={handleGenerateGeminiSummary}
                  disabled={isGeneratingGemini}
                  className="inline-flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {isGeneratingGemini ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      <span>Generate Analysis</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : null}

          {showApiKeyInput && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => {
                    setGeminiApiKey(e.target.value);
                    setApiTestResult(null); // Clear test result when key changes
                  }}
                  placeholder="Enter your Gemini API key..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Get your free API key at <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">Google AI Studio</a>
                </p>
              </div>
              
              {/* API Test Results */}
              {apiTestResult && (
                <div className={cn(
                  "p-3 rounded-md border",
                  apiTestResult.success 
                    ? "bg-green-50 border-green-200 text-green-800" 
                    : "bg-red-50 border-red-200 text-red-800"
                )}>
                  <div className="flex items-center space-x-2">
                    {apiTestResult.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{apiTestResult.message}</span>
                  </div>
                  {apiTestResult.model && (
                    <p className="text-xs mt-1">Using model: {apiTestResult.model}</p>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <GeminiAPITest 
                  apiKey={geminiApiKey} 
                  onResult={setApiTestResult}
                />
                <button
                  onClick={handleGenerateGeminiSummary}
                  disabled={!geminiApiKey.trim() || isGeneratingGemini || (apiTestResult ? !apiTestResult.success : false)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Generate Analysis
                </button>
                <button
                  onClick={() => setShowApiKeyInput(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {geminiError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <h4 className="font-medium text-red-900">API Error</h4>
                  <p className="text-red-700 text-sm mt-1">{geminiError}</p>
                  <p className="text-red-600 text-xs mt-2">Using fallback analysis instead.</p>
                </div>
              </div>
            </div>
          )}

          {geminiSummary && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Generated {new Date(geminiSummary.generatedAt).toLocaleString()}</span>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span>AI Analysis Complete</span>
                </div>
                <button
                  onClick={() => handleCopyToClipboard(geminiSummary.executiveSummary)}
                  className="inline-flex items-center space-x-1 text-sm text-amber-600 hover:text-amber-800"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy All</span>
                </button>
              </div>

              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {geminiSummary.executiveSummary}
                </div>
              </div>

              {geminiSummary.keyFindings && geminiSummary.keyFindings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">AI Key Findings</h4>
                  <ul className="space-y-2">
                    {geminiSummary.keyFindings.map((finding, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {geminiSummary.recommendedActions && geminiSummary.recommendedActions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Professional Recommendations</h4>
                  <ol className="space-y-2">
                    {geminiSummary.recommendedActions.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Export Menu */}
      {showExportMenu && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span>Professional Reports & Exports</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleExportExecutiveReport}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-8 h-8 text-blue-600 mb-2" />
              <span className="font-medium text-gray-900">Executive Report</span>
              <span className="text-sm text-gray-600 text-center">Comprehensive markdown report for stakeholders</span>
            </button>
            
            <button
              onClick={handleExportFlaggedTransactions}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Table className="w-8 h-8 text-red-600 mb-2" />
              <span className="font-medium text-gray-900">Flagged Transactions</span>
              <span className="text-sm text-gray-600 text-center">CSV export of suspicious transactions</span>
            </button>
            
            <button
              onClick={handleExportSuspiciousVendors}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BarChart className="w-8 h-8 text-orange-600 mb-2" />
              <span className="font-medium text-gray-900">Vendor Analysis</span>
              <span className="text-sm text-gray-600 text-center">CSV export of vendor risk analysis</span>
            </button>
            
            <button
              onClick={handleExportFullAnalysis}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-8 h-8 text-purple-600 mb-2" />
              <span className="font-medium text-gray-900">Full Analysis</span>
              <span className="text-sm text-gray-600 text-center">Complete JSON export with all data</span>
            </button>
          </div>
        </div>
      )}

      {/* Smart Summary Intelligence Panel */}
      {(aiSummary && geminiSummary) && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Brain className="w-5 h-5 text-green-600" />
            <span>Summary Intelligence Comparison</span>
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confidence Comparison */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-gray-900 mb-3">Analysis Confidence</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Rule-based Analysis</span>
                    <span className="font-medium">{aiSummary.riskAssessment.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={cn(
                        "bg-blue-600 h-2 rounded-full transition-all duration-500",
                        aiSummary.riskAssessment.confidence >= 80 ? "w-4/5" :
                        aiSummary.riskAssessment.confidence >= 60 ? "w-3/5" :
                        aiSummary.riskAssessment.confidence >= 40 ? "w-2/5" : "w-1/5"
                      )}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">AI-Enhanced Analysis</span>
                    <span className="font-medium">Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500 w-full"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Level Comparison */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-gray-900 mb-3">Risk Assessment Consensus</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rule-based:</span>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    aiSummary.riskAssessment.level === 'low' && 'bg-green-100 text-green-800',
                    aiSummary.riskAssessment.level === 'medium' && 'bg-yellow-100 text-yellow-800',
                    aiSummary.riskAssessment.level === 'high' && 'bg-orange-100 text-orange-800',
                    aiSummary.riskAssessment.level === 'critical' && 'bg-red-100 text-red-800'
                  )}>
                    {aiSummary.riskAssessment.level.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">AI-Enhanced:</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    AI ASSESSMENT
                  </span>
                </div>
                {aiSummary.riskAssessment.level === result.riskLevel && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                    ✓ Both analyses agree on risk level
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Key Insights Extraction */}
          <div className="mt-6 bg-white rounded-lg p-4 border">
            <h4 className="font-medium text-gray-900 mb-3">Extracted Key Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-600">Total Analyzed:</span>
                <p className="text-gray-700">{result.totalAnalyzed.toLocaleString()} transactions</p>
              </div>
              <div>
                <span className="font-medium text-orange-600">Flagged Items:</span>
                <p className="text-gray-700">{result.flaggedTransactions.length} transactions, {result.suspiciousVendors.length} vendors</p>
              </div>
              <div>
                <span className="font-medium text-purple-600">Deviation Score:</span>
                <p className="text-gray-700">MAD: {result.mad.toFixed(2)}% ({result.mad > 2.2 ? 'High' : result.mad > 1.5 ? 'Medium' : 'Low'} deviation)</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
