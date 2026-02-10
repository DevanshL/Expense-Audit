const fetch = require('node-fetch');

/**
 * Generate AI summary using Google Gemini API
 * @param {Object} result - Benford analysis result
 * @param {Object} dataset - Dataset information
 * @param {Object} config - Gemini configuration
 */
async function generateGeminiSummary(result, dataset, config) {
  const { apiKey, model = 'gemini-2.5-pro', temperature = 0.3, maxTokens = 2048 } = config;

  // Validate inputs
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  if (!result || !result.digitFrequencies) {
    throw new Error('Invalid analysis result data');
  }

  console.log('Starting Gemini API call with config:', {
    model,
    temperature,
    maxTokens,
    hasApiKey: !!apiKey,
    resultKeys: Object.keys(result),
    digitFrequenciesLength: result.digitFrequencies?.length
  });

  // Prepare the analysis data for the AI
  const analysisData = {
    totalTransactions: result.totalAnalyzed,
    mad: result.mad,
    chiSquare: result.chiSquare,
    riskLevel: result.riskLevel,
    digitFrequencies: result.digitFrequencies,
    flaggedTransactions: result.flaggedTransactions?.length || 0,
    suspiciousVendors: result.suspiciousVendors?.length || 0,
    totalVendors: dataset.preview?.totalRows || 0
  };

  // Create the prompt for AI analysis
  const prompt = `You are a Senior Financial Analyst and Certified Fraud Examiner (CFE) with over 15 years of experience in forensic accounting, fraud detection, and financial risk assessment.

You have been tasked with analyzing financial transaction data using Benford's Law to detect potential fraud or irregularities.

## ANALYSIS DATA:
**Dataset Information:**
- Total transactions analyzed: ${analysisData.totalTransactions.toLocaleString()}
- Mean Absolute Deviation (MAD): ${analysisData.mad.toFixed(4)}
- Chi-Square statistic: ${analysisData.chiSquare.toFixed(2)}
- Risk level: ${analysisData.riskLevel}
- Flagged transactions: ${analysisData.flaggedTransactions}
- Suspicious vendors: ${analysisData.suspiciousVendors}

**Digit Distribution Analysis:**
${result.digitFrequencies.map(freq => 
  `Digit ${freq.digit}: Observed ${freq.observed.toFixed(1)}% vs Expected ${freq.expected.toFixed(1)}% (deviation: ${freq.deviation.toFixed(1)}%)`
).join('\n')}

## ANALYSIS REQUIREMENTS:

Provide a comprehensive analysis in EXACTLY this format, with NO other formatting or structure:

EXECUTIVE SUMMARY:
[Write 2-3 sentences summarizing the overall fraud risk findings and their business impact]

KEY FINDINGS:
[List 3-5 specific discoveries about the data patterns, focusing on actual statistical deviations and vendor behaviors observed]

RISK ASSESSMENT:
[Explain the MAD score of ${analysisData.mad.toFixed(4)} and Chi-Square of ${analysisData.chiSquare.toFixed(2)} in business terms, and what the ${analysisData.riskLevel} risk level means for the organization]

VENDOR ANALYSIS:
${analysisData.suspiciousVendors > 0 ? 
  `[Analyze the ${analysisData.suspiciousVendors} flagged vendors and their risk patterns]` :
  '[Note that no vendors met the threshold for suspicious activity flagging]'
}

TRANSACTION PATTERNS:
[Analyze the digit distribution showing which digits deviate most from Benford's Law expectations and what this indicates about potential data manipulation]

RECOMMENDATIONS:
[Provide 4-6 specific, actionable recommendations based on the actual findings, including immediate actions, investigation priorities, and process improvements]

Be specific to this actual analysis data. Do NOT use generic fraud detection advice. Reference the actual MAD score, specific statistical findings, and actual digit deviations observed in this dataset.`;

  try {
    console.log('Making Gemini API request to:', `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`);
    
    // Make API call to Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens,
          candidateCount: 1
        }
      })
    });

    console.log('Gemini API response status:', response.status);
    console.log('Gemini API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini API response structure:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length,
      hasContent: !!data.candidates?.[0]?.content,
      hasParts: !!data.candidates?.[0]?.content?.parts
    });
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('No content generated by Gemini API, full response:', data);
      throw new Error('No content generated by Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Generated text length:', generatedText?.length);
    console.log('Generated text preview:', generatedText?.substring(0, 200));
    
    // Parse the structured response
    try {
      const summary = parseStructuredResponse(generatedText);
      
      return {
        ...summary,
        model: model,
        generatedAt: new Date().toISOString(),
        provider: 'gemini'
      };
    } catch (parseError) {
      console.warn('Response parsing failed, creating fallback summary:', parseError.message);
      // If parsing fails, create a fallback structured response
      return createFallbackSummary(generatedText, model);
    }

  } catch (error) {
    console.error('Gemini API call failed:', error.message);
    
    if (error.message.includes('quota') || error.message.includes('limit')) {
      throw new Error('API quota exceeded. Please check your Gemini API usage limits.');
    } else if (error.message.includes('unauthorized') || error.message.includes('403')) {
      throw new Error('Invalid API key. Please check your Gemini API key configuration.');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      throw new Error(`AI summary generation failed: ${error.message}`);
    }
  }
}

/**
 * Parse structured response from Gemini
 */
function parseStructuredResponse(response) {
  const sections = {
    executiveSummary: '',
    keyFindings: [],
    riskAssessment: '',
    recommendedActions: [],
    furtherInvestigation: []
  };

  const lines = response.split('\n');
  let currentSection = '';
  let currentContent = [];

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
        const vendorContent = currentContent.join(' ').trim();
        if (vendorContent.length > 0) {
          sections.keyFindings.push(vendorContent);
        }
      }
      currentSection = 'transactionPatterns';
      currentContent = [];
    } else if (trimmedLine.toUpperCase().includes('RECOMMENDATIONS:')) {
      if (currentSection === 'transactionPatterns' && currentContent.length > 0) {
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
    const sentences = response.split('.').filter(s => s.trim().length > 10);
    sections.executiveSummary = sentences.slice(0, 3).join('.') + '.';
    sections.keyFindings = ['AI analysis completed with custom insights'];
    sections.recommendedActions = ['Review the complete analysis for detailed recommendations'];
  }

  return sections;
}

/**
 * Create a fallback summary when parsing fails
 */
function createFallbackSummary(text, model) {
  return {
    executiveSummary: text.substring(0, 300) + (text.length > 300 ? '...' : ''),
    keyFindings: [
      'AI analysis generated comprehensive insights',
      'Statistical patterns identified in transaction data',
      'Professional review of complete response recommended'
    ],
    riskAssessment: 'AI has provided detailed analysis. Full response review needed for complete insights.',
    recommendedActions: [
      'Conduct detailed review of analysis findings',
      'Investigate specific transactions flagged by the system',
      'Review vendor payment patterns and approval processes',
      'Implement enhanced monitoring for identified risk areas',
      'Document findings and establish ongoing controls'
    ],
    furtherInvestigation: [
      'Complete AI response analysis',
      'Enhanced transaction pattern review'
    ],
    model: model,
    generatedAt: new Date().toISOString(),
    provider: 'gemini',
    fullResponse: text,
    parseError: true
  };
}

module.exports = {
  generateGeminiSummary,
  createFallbackSummary
};
