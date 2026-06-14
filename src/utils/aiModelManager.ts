// AI Model Manager - Dynamic Model Selection and Configuration
// Supports AI models: Gemini, Ollama

import type { BenfordResult, ProcessedDataset } from '../types';

export interface AIModel {
  id: string;
  name: string;
  provider: 'gemini' | 'ollama';
  version: string;
  maxTokens: number;
  costPer1kTokens: number;
  capabilities: string[];
  isLatest: boolean;
}

export interface AIConfig {
  selectedModel: string;
  apiKeys: {
    gemini?: string;
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

// AI Models Configuration
export const AI_MODELS: AIModel[] = [
  // Google Gemini Models - Exact API Names
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    version: '2024-12-11',
    maxTokens: 1000000,
    costPer1kTokens: 0.00075,
    capabilities: ['reasoning', 'multimodal', 'fast'],
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
  },

  // Ollama local models
  {
    id: 'llama3',
    name: 'Llama 3',
    provider: 'ollama',
    version: 'latest',
    maxTokens: 8192,
    costPer1kTokens: 0,
    capabilities: ['reasoning', 'analysis', 'local'],
    isLatest: true
  },
  {
    id: 'mistral',
    name: 'Mistral',
    provider: 'ollama',
    version: 'latest',
    maxTokens: 8192,
    costPer1kTokens: 0,
    capabilities: ['reasoning', 'analysis', 'local'],
    isLatest: true
  },
  {
    id: 'gemma',
    name: 'Gemma',
    provider: 'ollama',
    version: 'latest',
    maxTokens: 8192,
    costPer1kTokens: 0,
    capabilities: ['reasoning', 'local'],
    isLatest: true
  },
  {
    id: 'phi3',
    name: 'Phi 3',
    provider: 'ollama',
    version: 'latest',
    maxTokens: 4096,
    costPer1kTokens: 0,
    capabilities: ['reasoning', 'local', 'lightweight'],
    isLatest: true
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
    case 'technical':
    case 'detailed':
    case 'summary':
    default:
      return getModelById('gemini-2.0-flash') || AI_MODELS[0];
  }
}

/**
 * Get default AI configuration
 */
export function getDefaultAIConfig(): AIConfig {
  return {
    selectedModel: 'gemini-2.0-flash',
    apiKeys: {},
    temperature: 0.3,
    maxTokens: 2048,
    systemPrompt: 'You are a professional financial analyst and certified fraud examiner specializing in statistical analysis and fraud detection using Benford\'s Law.'
  };
}

/**
 * Test API key for a specific provider
 */
export async function testAPIKey(provider: AIModel['provider'], apiKey: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
  const startTime = Date.now();
  
  try {
    switch (provider) {
      case 'gemini':
        return await testGeminiKey(apiKey);
      case 'ollama':
        return { success: true, message: 'Ollama is a local provider, no API key required.' };
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
    case 'gemini':
      if (!config.apiKeys.gemini) errors.push('Gemini API key required');
      break;
    case 'ollama':
      // Local - no key required
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
