// Gemini 2.5 Pro API Integration for Advanced AI Summaries
// Provides natural language analysis powered by Google's Gemini AI

import type { BenfordResult, ProcessedDataset } from '../types';
import type { AnalysisSummary } from './aiSummary';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GeminiSummary {
  executiveSummary: string;
  keyFindings: string[];
  riskAssessment: string;
  recommendedActions: string[];
  furtherInvestigation: string[];
  model: string;
  generatedAt: string;
  provider: string;
}

/**
 * Create a comprehensive prompt for Gemini analysis
 */
function createAnalysisPrompt(result: BenfordResult, dataset: ProcessedDataset): string {
  const prompt = `You are a Senior Financial Analyst and Certified Fraud Examiner (CFE) with over 15 years of experience in forensic accounting, fraud detection, and financial risk assessment. Your expertise includes:

- Advanced statistical analysis and anomaly detection
- Benford's Law applications in fraud detection
- Financial audit procedures and compliance
- Risk assessment and mitigation strategies
- Executive-level reporting and communication

You have been tasked with analyzing financial transaction data using Benford's Law to detect potential fraud or irregularities. Your analysis should be thorough, professional, and actionable for both technical teams and executive stakeholders.

## ANALYSIS DATA:
**Dataset Information:**
- Total transactions analyzed: ${result.totalAnalyzed.toLocaleString()}
- Data source: ${dataset.preview.totalRows.toLocaleString()} original records
- Valid records after cleaning: ${dataset.validation.validRows.toLocaleString()}

**Statistical Measures:**
- Mean Absolute Deviation (MAD): ${result.mad.toFixed(4)}
- Chi-Square statistic: ${result.chiSquare.toFixed(2)}
- Overall assessment: ${result.overallAssessment}
- Risk level: ${result.riskLevel}

**Digit Distribution Analysis:**
${result.digitFrequencies.map(freq => 
  `Digit ${freq.digit}: Observed ${freq.observed.toFixed(1)}% vs Expected ${freq.expected.toFixed(1)}% (deviation: ${freq.deviation.toFixed(1)}%)`
).join('\n')}

**Suspicious Vendors (${result.suspiciousVendors.length} flagged):**
${result.suspiciousVendors.slice(0, 5).map(vendor => 
  `- ${vendor.vendor}: ${vendor.transactionCount} transactions, MAD ${vendor.mad.toFixed(3)}, Risk: ${vendor.riskLevel}${vendor.suspiciousPatterns.length > 0 ? ', Patterns: ' + vendor.suspiciousPatterns.join('; ') : ''}`
).join('\n')}

**Flagged Transactions (${result.flaggedTransactions.length} total):**
${result.flaggedTransactions.slice(0, 5).map(txn => 
  `- $${txn.amount.toLocaleString()} from ${txn.vendor || 'Unknown'}, Risk: ${txn.riskLevel}, Reason: ${txn.reason}`
).join('\n')}

**Analysis Warnings:**
${result.warnings.map(warning => `- ${warning}`).join('\n')}

## ANALYSIS REQUIREMENTS:

Provide a comprehensive analysis in EXACTLY this format, with NO other formatting or structure:

EXECUTIVE SUMMARY:
[Write 2-3 sentences summarizing the overall fraud risk findings and their business impact]

KEY FINDINGS:
[List 3-5 specific discoveries about the data patterns, focusing on actual statistical deviations and vendor behaviors observed]

RISK ASSESSMENT:
[Explain the MAD score of ${result.mad.toFixed(4)} and Chi-Square of ${result.chiSquare.toFixed(2)} in business terms, and what the ${result.riskLevel} risk level means for the organization]

VENDOR ANALYSIS:
${result.suspiciousVendors.length > 0 ? 
  `[Analyze the ${result.suspiciousVendors.length} flagged vendors, mentioning specific vendors by name and their risk patterns]` :
  '[Note that no vendors met the threshold for suspicious activity flagging]'
}

TRANSACTION PATTERNS:
[Analyze the digit distribution showing which digits deviate most from Benford's Law expectations and what this indicates about potential data manipulation]

RECOMMENDATIONS:
[Provide 4-6 specific, actionable recommendations based on the actual findings, including immediate actions, investigation priorities, and process improvements]

Be specific to this actual analysis data. Do NOT use generic fraud detection advice. Reference the actual MAD score, specific vendors flagged, and actual digit deviations observed in this dataset.`;

  return prompt;
}

/**
 * Call Gemini API for AI-powered analysis
 */
export async function generateGeminiSummary(
  result: BenfordResult, 
  dataset: ProcessedDataset, 
  config: GeminiConfig
): Promise<GeminiSummary> {
  const { apiKey, model = 'gemini-2.5-pro', temperature = 0.3, maxTokens = 2048 } = config;
  
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  // Validate input data
  if (!result || !dataset) {
    throw new Error('Missing analysis data');
  }

  if (!result.digitFrequencies || result.digitFrequencies.length === 0) {
    throw new Error('No digit frequency data available');
  }

  const prompt = createAnalysisPrompt(result, dataset);
  
  console.log('Calling Gemini API with:', {
    model,
    promptLength: prompt.length,
    maxTokens,
    temperature
  });
  
  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          {
            text: "You are a Senior Financial Analyst and Certified Fraud Examiner with expertise in forensic accounting and fraud detection. Provide professional, executive-level analysis."
          }
        ]
      },
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topK: 40,
        topP: 0.95,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };

    console.log('Sending request to Gemini API...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error response:', errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Gemini API response received:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length || 0,
      responseKeys: Object.keys(data)
    });
    
    // Enhanced error handling for Gemini API response structure
    if (!data) {
      console.error('Gemini API returned null/undefined response');
      throw new Error('Empty response from Gemini API');
    }

    if (data.error) {
      console.error('Gemini API error in response:', data.error);
      throw new Error(`Gemini API error: ${data.error.message || 'API returned error'}`);
    }
    
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error('Gemini API response structure:', JSON.stringify(data, null, 2));
      
      // Check for common API response patterns
      if (data.promptFeedback && data.promptFeedback.blockReason) {
        throw new Error(`Content was blocked: ${data.promptFeedback.blockReason}`);
      }
      
      throw new Error('No valid candidates in Gemini API response. This could be due to content filtering or quota limits.');
    }
    
    const candidate = data.candidates[0];
    console.log('Processing candidate:', {
      hasContent: !!candidate.content,
      hasParts: !!candidate.content?.parts,
      partsLength: candidate.content?.parts?.length || 0,
      finishReason: candidate.finishReason
    });

    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.warn('Candidate finished with reason:', candidate.finishReason);
      if (candidate.finishReason === 'SAFETY') {
        throw new Error('Content was blocked due to safety filters');
      }
      if (candidate.finishReason === 'MAX_TOKENS') {
        console.warn('Response was truncated due to max tokens');
      }
    }
    
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      console.error('Invalid candidate structure:', JSON.stringify(candidate, null, 2));
      throw new Error('Invalid content structure in Gemini API response - no content parts found');
    }
    
    const part = candidate.content.parts[0];
    if (!part || typeof part.text !== 'string' || !part.text.trim()) {
      console.error('Invalid part structure:', JSON.stringify(part, null, 2));
      throw new Error('No valid text content in Gemini API response');
    }

    const generatedText = part.text.trim();
    console.log('Generated text length:', generatedText.length);
    
    // Parse the structured response
    const summary = parseGeminiResponse(generatedText);
    
    return {
      ...summary,
      generatedAt: new Date().toISOString()
    };
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate Gemini summary: ${error.message}`);
    }
    throw new Error('Failed to generate Gemini summary: Unknown error');
  }
}

/**
 * Parse structured response from Gemini
 */
function parseGeminiResponse(response: string): Omit<GeminiSummary, 'generatedAt'> {
  const sections = {
    executiveSummary: '',
    keyFindings: [] as string[],
    riskAssessment: '',
    recommendedActions: [] as string[],
    furtherInvestigation: [] as string[],
    model: 'gemini-2.5-pro',
    provider: 'gemini'
  };

  // Split response into sections
  const lines = response.split('\n');
  let currentSection = 'executiveSummary';
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.toUpperCase().includes('EXECUTIVE SUMMARY:')) {
      currentSection = 'executiveSummary';
      currentContent = [];
    } else if (trimmedLine.toUpperCase().includes('KEY FINDINGS:')) {
      if (currentContent.length > 0) {
        sections.executiveSummary = currentContent.join(' ').trim();
      }
      currentSection = 'keyFindings';
      currentContent = [];
    } else if (trimmedLine.toUpperCase().includes('RISK ASSESSMENT:')) {
      if (currentSection === 'keyFindings' && currentContent.length > 0) {
        sections.keyFindings = currentContent
          .filter(line => line.trim().length > 0)
          .map(line => line.replace(/^[-•*]\s*/, '').trim())
          .filter(line => line.length > 0);
      }
      currentSection = 'riskAssessment';
      currentContent = [];
    } else if (trimmedLine.toUpperCase().includes('VENDOR ANALYSIS:')) {
      if (currentSection === 'riskAssessment' && currentContent.length > 0) {
        sections.riskAssessment = currentContent.join(' ').trim();
      }
      currentSection = 'vendorAnalysis';
      currentContent = [];
    } else if (trimmedLine.toUpperCase().includes('TRANSACTION PATTERNS:')) {
      if (currentSection === 'vendorAnalysis' && currentContent.length > 0) {
        // Add vendor analysis to key findings
        const vendorContent = currentContent.join(' ').trim();
        if (vendorContent.length > 0) {
          sections.keyFindings.push(vendorContent);
        }
      }
      currentSection = 'transactionPatterns';
      currentContent = [];
    } else if (trimmedLine.toUpperCase().includes('RECOMMENDATIONS:')) {
      if (currentSection === 'transactionPatterns' && currentContent.length > 0) {
        // Add transaction patterns to key findings
        const patternContent = currentContent.join(' ').trim();
        if (patternContent.length > 0) {
          sections.keyFindings.push(patternContent);
        }
      }
      currentSection = 'recommendations';
      currentContent = [];
    } else if (trimmedLine.length > 0 && !trimmedLine.startsWith('#')) {
      currentContent.push(trimmedLine);
    }
  }

  // Handle the last section (recommendations)
  if (currentSection === 'recommendations' && currentContent.length > 0) {
    sections.recommendedActions = currentContent
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[-•*]\s*|\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  // Ensure we have at least some content
  if (!sections.executiveSummary && !sections.keyFindings.length && !sections.recommendedActions.length) {
    // Fallback: use the first few sentences as executive summary
    const sentences = response.split('.').filter(s => s.trim().length > 10);
    sections.executiveSummary = sentences.slice(0, 3).join('.') + '.';
    sections.keyFindings = ['AI analysis completed with custom insights'];
    sections.recommendedActions = ['Review the complete analysis for detailed recommendations'];
  }

  return sections;
}

/**
 * Fallback function when Gemini API is not available
 */
export function createFallbackSummary(analysis: AnalysisSummary): GeminiSummary {
  return {
    executiveSummary: analysis.executiveSummary,
    keyFindings: analysis.overallFindings.slice(0, 5),
    riskAssessment: analysis.riskAssessment.description,
    recommendedActions: analysis.recommendations.slice(0, 7),
    furtherInvestigation: ["Further analysis recommended based on current findings", "Review additional data sources if available"],
    model: 'fallback',
    provider: 'rule-based',
    generatedAt: new Date().toISOString()
  };
}
