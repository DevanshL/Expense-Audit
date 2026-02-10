// AI Model Manager - Dynamic Model Selection and Configuration
// Supports latest AI models: GPT-4o, Claude 4, Gemini 2.5 Pro, Azure OpenAI

import type { BenfordResult, ProcessedDataset } from '../types';

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'azure';
  version: string;
  maxTokens: number;
  costPer1kTokens: number;
  capabilities: string[];
  isLatest: boolean;
}

export interface AIConfig {
  selectedModel: string;
  apiKeys: {
    openai?: string;
    anthropic?: string;
    gemini?: string;
    azure?: {
      apiKey: string;
      endpoint: string;
      deploymentName: string;
    };
  };
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface AIAnalysisRequest {
  result: BenfordResult;
  dataset: ProcessedDataset;
  config: AIConfig;
  analysisType: 'summary' | 'detailed' | 'executive' | 'technical';
}

export interface AIAnalysisResponse {
  content: string;
  model: string;
  tokensUsed: number;
  cost: number;
  confidence: number;
  generatedAt: Date;
}

// Latest AI Models Configuration
export const AI_MODELS: AIModel[] = [
  // OpenAI Models - Corrected Latest Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    version: '2024-11-20',
    maxTokens: 128000,
    costPer1kTokens: 0.0025,
    capabilities: ['reasoning', 'analysis', 'code', 'multimodal'],
    isLatest: true
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    version: '2024-07-18',
    maxTokens: 128000,
    costPer1kTokens: 0.00015,
    capabilities: ['reasoning', 'analysis', 'fast'],
    isLatest: true
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    version: '2024-04-09',
    maxTokens: 128000,
    costPer1kTokens: 0.01,
    capabilities: ['reasoning', 'analysis', 'code'],
    isLatest: false
  },
  
  // Anthropic Claude Models - Latest Updates
  {
    id: 'claude-4-opus',
    name: 'Claude 4 Opus',
    provider: 'anthropic',
    version: '2025-01-01',
    maxTokens: 200000,
    costPer1kTokens: 0.015,
    capabilities: ['reasoning', 'analysis', 'code', 'creative', 'complex'],
    isLatest: true
  },
  {
    id: 'claude-4-sonnet',
    name: 'Claude 4 Sonnet',
    provider: 'anthropic',
    version: '2025-01-01',
    maxTokens: 200000,
    costPer1kTokens: 0.005,
    capabilities: ['reasoning', 'analysis', 'code', 'balanced'],
    isLatest: true
  },
  {
    id: 'claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    version: '2024-12-01',
    maxTokens: 200000,
    costPer1kTokens: 0.005,
    capabilities: ['reasoning', 'analysis', 'code', 'enhanced'],
    isLatest: true
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    version: '2024-10-22',
    maxTokens: 200000,
    costPer1kTokens: 0.003,
    capabilities: ['reasoning', 'analysis', 'code', 'creative'],
    isLatest: false
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    version: '2024-10-22',
    maxTokens: 200000,
    costPer1kTokens: 0.00025,
    capabilities: ['reasoning', 'fast', 'efficient'],
    isLatest: false
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    version: '2024-02-29',
    maxTokens: 200000,
    costPer1kTokens: 0.015,
    capabilities: ['reasoning', 'analysis', 'creative', 'complex'],
    isLatest: false
  },

  // Google Gemini Models - Exact API Names
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    version: '2024-12-11',
    maxTokens: 2000000,
    costPer1kTokens: 0.00125,
    capabilities: ['reasoning', 'analysis', 'multimodal', 'long-context'],
    isLatest: true
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    version: '2024-12-11',
    maxTokens: 1000000,
    costPer1kTokens: 0.00075,
    capabilities: ['reasoning', 'multimodal', 'fast'],
    isLatest: true
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    version: '2024-12-11',
    maxTokens: 1000000,
    costPer1kTokens: 0.00075,
    capabilities: ['reasoning', 'multimodal', 'fast', 'experimental'],
    isLatest: true
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    version: '2024-04-09',
    maxTokens: 2000000,
    costPer1kTokens: 0.00125,
    capabilities: ['reasoning', 'analysis', 'multimodal', 'long-context'],
    isLatest: false
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    version: '2024-05-14',
    maxTokens: 1000000,
    costPer1kTokens: 0.000075,
    capabilities: ['reasoning', 'fast', 'efficient'],
    isLatest: false
  }
];

/**
 * Get available models by provider
 */
export function getModelsByProvider(provider: AIModel['provider']): AIModel[] {
  return AI_MODELS.filter(model => model.provider === provider);
}

/**
 * Get latest models only
 */
export function getLatestModels(): AIModel[] {
  return AI_MODELS.filter(model => model.isLatest);
}

/**
 * Get model by ID
 */
export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find(model => model.id === id);
}

/**
 * Get recommended model for analysis type
 */
export function getRecommendedModel(analysisType: AIAnalysisRequest['analysisType']): AIModel {
  switch (analysisType) {
    case 'executive':
      return getModelById('claude-4-opus') || getModelById('claude-3.7-sonnet') || AI_MODELS[0];
    case 'technical':
      return getModelById('gpt-4o') || AI_MODELS[0];
    case 'detailed':
      return getModelById('gemini-2.5-pro') || AI_MODELS[0];
    case 'summary':
    default:
      return getModelById('gpt-4o-mini') || AI_MODELS[0];
  }
}

/**
 * Create analysis prompt based on model and type
 */
export function createPrompt(request: AIAnalysisRequest): string {
  const { result, analysisType } = request;
  
  const baseContext = `You are a Senior Financial Analyst and Certified Fraud Examiner analyzing transaction data using Benford's Law.

Dataset Summary:
- Total transactions: ${result.totalAnalyzed.toLocaleString()}
- Mean Absolute Deviation (MAD): ${result.mad.toFixed(4)}
- Chi-Square: ${result.chiSquare.toFixed(2)}
- Risk Level: ${result.riskLevel}
- Overall Assessment: ${result.overallAssessment}

Frequency Distribution:
${result.digitFrequencies.map(f => 
  `Digit ${f.digit}: Expected ${f.expected.toFixed(1)}%, Observed ${f.observed.toFixed(1)}% (${f.count} transactions)`
).join('\n')}

Top Risk Vendors:
${result.suspiciousVendors.slice(0, 5).map(v => 
  `${v.vendor}: ${v.transactionCount} transactions, MAD ${v.mad.toFixed(4)}, Risk: ${v.riskLevel}`
).join('\n')}`;

  switch (analysisType) {
    case 'executive':
      return `${baseContext}

Provide an executive summary for C-level stakeholders focusing on:
1. Key business risks and impact
2. Actionable recommendations
3. Resource requirements
4. Timeline for remediation
Keep technical details minimal and focus on business implications.`;

    case 'technical':
      return `${baseContext}

Provide a detailed technical analysis for the audit team including:
1. Statistical interpretation of deviations
2. Specific transaction patterns requiring investigation
3. Methodology recommendations for deeper analysis
4. False positive considerations
Include technical reasoning and statistical significance.`;

    case 'detailed':
      return `${baseContext}

Provide a comprehensive analysis covering:
1. Executive summary
2. Technical findings
3. Risk assessment with evidence
4. Detailed recommendations
5. Implementation roadmap
Balance technical accuracy with business context.`;

    case 'summary':
    default:
      return `${baseContext}

Provide a concise summary highlighting:
1. Key findings (2-3 main points)
2. Risk level assessment
3. Primary recommendations
4. Next steps
Keep response focused and actionable.`;
  }
}

/**
 * Analyze data using selected AI model
 */
export async function analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const model = getModelById(request.config.selectedModel);
  if (!model) {
    throw new Error(`Model ${request.config.selectedModel} not found`);
  }

  const prompt = createPrompt(request);

  try {
    let response: string;
    let tokensUsed: number;

    switch (model.provider) {
      case 'openai':
        ({ response, tokensUsed } = await callOpenAI(prompt, model, request.config));
        break;
      case 'anthropic':
        ({ response, tokensUsed } = await callClaude(prompt, model, request.config));
        break;
      case 'gemini':
        ({ response, tokensUsed } = await callGemini(prompt, model, request.config));
        break;
      case 'azure':
        ({ response, tokensUsed } = await callAzureOpenAI(prompt, model, request.config));
        break;
      default:
        throw new Error(`Provider ${model.provider} not supported`);
    }

    const cost = (tokensUsed / 1000) * model.costPer1kTokens;
    const confidence = calculateConfidence(request.result, response);

    return {
      content: response,
      model: model.id,
      tokensUsed,
      cost,
      confidence,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error(`AI Analysis failed for ${model.id}:`, error);
    throw new Error(`Failed to analyze with ${model.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string, model: AIModel, config: AIConfig): Promise<{ response: string; tokensUsed: number }> {
  if (!config.apiKeys.openai) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKeys.openai}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model.id,
      messages: [
        {
          role: 'system',
          content: config.systemPrompt || 'You are a professional financial analyst specializing in fraud detection.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.temperature,
      max_tokens: Math.min(config.maxTokens, model.maxTokens)
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    response: data.choices[0].message.content,
    tokensUsed: data.usage.total_tokens
  };
}

/**
 * Call Anthropic Claude API
 */
async function callClaude(prompt: string, model: AIModel, config: AIConfig): Promise<{ response: string; tokensUsed: number }> {
  if (!config.apiKeys.anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKeys.anthropic,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model.id,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.temperature,
      max_tokens: Math.min(config.maxTokens, model.maxTokens),
      system: config.systemPrompt || 'You are a professional financial analyst specializing in fraud detection.'
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    response: data.content[0].text,
    tokensUsed: data.usage.input_tokens + data.usage.output_tokens
  };
}

/**
 * Call Google Gemini API
 */
async function callGemini(prompt: string, model: AIModel, config: AIConfig): Promise<{ response: string; tokensUsed: number }> {
  if (!config.apiKeys.gemini) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${config.apiKeys.gemini}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: Math.min(config.maxTokens, model.maxTokens)
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    response: data.candidates[0].content.parts[0].text,
    tokensUsed: data.usageMetadata?.totalTokenCount || 0
  };
}

/**
 * Call Azure OpenAI API
 */
async function callAzureOpenAI(prompt: string, model: AIModel, config: AIConfig): Promise<{ response: string; tokensUsed: number }> {
  if (!config.apiKeys.azure?.apiKey || !config.apiKeys.azure?.endpoint) {
    throw new Error('Azure OpenAI configuration incomplete');
  }

  const { apiKey, endpoint, deploymentName } = config.apiKeys.azure;
  const response = await fetch(`${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: config.systemPrompt || 'You are a professional financial analyst specializing in fraud detection.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.temperature,
      max_tokens: Math.min(config.maxTokens, model.maxTokens)
    })
  });

  if (!response.ok) {
    throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    response: data.choices[0].message.content,
    tokensUsed: data.usage.total_tokens
  };
}

/**
 * Calculate confidence score based on analysis quality
 */
function calculateConfidence(result: BenfordResult, analysis: string): number {
  let confidence = 50; // Base confidence
  
  // Factor in statistical significance
  if (result.mad < 0.6) confidence += 20;
  else if (result.mad < 1.2) confidence += 15;
  else if (result.mad < 1.5) confidence += 10;
  
  // Factor in analysis length and detail
  if (analysis.length > 1000) confidence += 10;
  if (analysis.includes('statistical') || analysis.includes('deviation')) confidence += 5;
  if (analysis.includes('recommendation')) confidence += 5;
  
  // Factor in risk assessment match
  if (analysis.toLowerCase().includes(result.riskLevel.toLowerCase())) confidence += 10;
  
  return Math.min(confidence, 95); // Cap at 95%
}

/**
 * Get default AI configuration
 */
export function getDefaultAIConfig(): AIConfig {
  return {
    selectedModel: 'gpt-4o-mini',
    apiKeys: {},
    temperature: 0.3,
    maxTokens: 2048,
    systemPrompt: 'You are a professional financial analyst and certified fraud examiner specializing in statistical analysis and fraud detection using Benford\'s Law.'
  };
}

/**
 * Test API key for a specific provider
 */
export async function testAPIKey(provider: AIModel['provider'], apiKey: string, azureConfig?: { endpoint: string; deploymentName: string }): Promise<{ success: boolean; message: string; responseTime?: number }> {
  const startTime = Date.now();
  
  try {
    switch (provider) {
      case 'openai':
        return await testOpenAIKey(apiKey);
      case 'anthropic':
        return await testAnthropicKey(apiKey);
      case 'gemini':
        return await testGeminiKey(apiKey);
      case 'azure':
        if (!azureConfig?.endpoint || !azureConfig?.deploymentName) {
          return { success: false, message: 'Azure endpoint and deployment name required' };
        }
        return await testAzureKey(apiKey, azureConfig.endpoint, azureConfig.deploymentName);
      default:
        return { success: false, message: `Provider ${provider} not supported` };
    }
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Test OpenAI API key
 */
async function testOpenAIKey(apiKey: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return { 
        success: true, 
        message: 'OpenAI API key is valid and working', 
        responseTime 
      };
    } else if (response.status === 401) {
      return { 
        success: false, 
        message: 'Invalid OpenAI API key', 
        responseTime 
      };
    } else {
      return { 
        success: false, 
        message: `OpenAI API error: ${response.status} ${response.statusText}`, 
        responseTime 
      };
    }
  } catch (error) {
    console.error('Error testing OpenAI API key:', error);
    return { 
      success: false, 
      message: 'Network error testing OpenAI API key',
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Test Anthropic API key
 */
async function testAnthropicKey(apiKey: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 1
      })
    });

    const responseTime = Date.now() - startTime;

    if (response.ok || response.status === 400) { // 400 is expected for minimal test
      return { 
        success: true, 
        message: 'Anthropic API key is valid and working', 
        responseTime 
      };
    } else if (response.status === 401) {
      return { 
        success: false, 
        message: 'Invalid Anthropic API key', 
        responseTime 
      };
    } else {
      return { 
        success: false, 
        message: `Anthropic API error: ${response.status} ${response.statusText}`, 
        responseTime 
      };
    }
  } catch (error) {
    console.error('Error testing Anthropic API key:', error);
    return { 
      success: false, 
      message: 'Network error testing Anthropic API key',
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Test Gemini API key
 */
async function testGeminiKey(apiKey: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return { 
        success: true, 
        message: 'Gemini API key is valid and working', 
        responseTime 
      };
    } else if (response.status === 400 || response.status === 403) {
      return { 
        success: false, 
        message: 'Invalid Gemini API key', 
        responseTime 
      };
    } else {
      return { 
        success: false, 
        message: `Gemini API error: ${response.status} ${response.statusText}`, 
        responseTime 
      };
    }
  } catch (error) {
    console.error('Error testing Gemini API key:', error);
    return { 
      success: false, 
      message: 'Network error testing Gemini API key',
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Test Azure OpenAI API key
 */
async function testAzureKey(apiKey: string, endpoint: string, deploymentName: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 1
      })
    });

    const responseTime = Date.now() - startTime;

    if (response.ok || response.status === 400) { // 400 is expected for minimal test
      return { 
        success: true, 
        message: 'Azure OpenAI API key is valid and working', 
        responseTime 
      };
    } else if (response.status === 401) {
      return { 
        success: false, 
        message: 'Invalid Azure OpenAI API key or configuration', 
        responseTime 
      };
    } else {
      return { 
        success: false, 
        message: `Azure OpenAI API error: ${response.status} ${response.statusText}`, 
        responseTime 
      };
    }
  } catch (error) {
    console.error('Error testing Azure OpenAI API key:', error);
    return { 
      success: false, 
      message: 'Network error testing Azure OpenAI API key',
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Validate AI configuration
 */
export function validateAIConfig(config: AIConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const model = getModelById(config.selectedModel);
  
  if (!model) {
    errors.push(`Invalid model: ${config.selectedModel}`);
    return { valid: false, errors };
  }
  
  // Check API key for selected model's provider
  switch (model.provider) {
    case 'openai':
      if (!config.apiKeys.openai) errors.push('OpenAI API key required');
      break;
    case 'anthropic':
      if (!config.apiKeys.anthropic) errors.push('Anthropic API key required');
      break;
    case 'gemini':
      if (!config.apiKeys.gemini) errors.push('Gemini API key required');
      break;
    case 'azure':
      if (!config.apiKeys.azure?.apiKey) errors.push('Azure API key required');
      if (!config.apiKeys.azure?.endpoint) errors.push('Azure endpoint required');
      if (!config.apiKeys.azure?.deploymentName) errors.push('Azure deployment name required');
      break;
  }
  
  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('Temperature must be between 0 and 2');
  }
  
  if (config.maxTokens < 100 || config.maxTokens > model.maxTokens) {
    errors.push(`Max tokens must be between 100 and ${model.maxTokens}`);
  }
  
  return { valid: errors.length === 0, errors };
}
