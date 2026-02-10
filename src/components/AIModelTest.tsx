// Test AI Model Manager Configuration
// Verify that all models are correctly configured and accessible

import { 
  AI_MODELS, 
  getModelsByProvider, 
  getLatestModels, 
  getModelById,
  getRecommendedModel,
  validateAIConfig,
  getDefaultAIConfig,
  type AIConfig 
} from '../utils/aiModelManager';

// Test configuration
const testConfig: AIConfig = {
  selectedModel: 'gpt-4o',
  apiKeys: {
    openai: 'sk-test123',
    anthropic: 'sk-ant-test123',
    gemini: 'AIza-test123',
    azure: {
      apiKey: 'azure-test123',
      endpoint: 'https://test.openai.azure.com',
      deploymentName: 'test-deployment'
    }
  },
  temperature: 0.3,
  maxTokens: 2048,
  systemPrompt: 'Test prompt'
};

console.log('=== AI Model Manager Test ===');

// Test 1: Verify all models exist
console.log('\n1. Total Models:', AI_MODELS.length);
console.log('Models by provider:');
console.log('  OpenAI:', getModelsByProvider('openai').length);
console.log('  Anthropic:', getModelsByProvider('anthropic').length);
console.log('  Gemini:', getModelsByProvider('gemini').length);
console.log('  Azure:', getModelsByProvider('azure').length);

// Test 2: Verify latest models
console.log('\n2. Latest Models:', getLatestModels().length);
getLatestModels().forEach(model => {
  console.log(`  ${model.name} (${model.provider}): ${model.id}`);
});

// Test 3: Test specific model lookups
console.log('\n3. Model Lookups:');
const testModels = ['gpt-4o', 'claude-4-opus', 'gemini-2.5-pro', 'gemini-2.0-flash'];
testModels.forEach(modelId => {
  const model = getModelById(modelId);
  console.log(`  ${modelId}: ${model ? '✓ Found' : '✗ Not Found'}`);
});

// Test 4: Test recommendations
console.log('\n4. Recommended Models:');
const analysisTypes = ['summary', 'detailed', 'executive', 'technical'] as const;
analysisTypes.forEach(type => {
  const recommended = getRecommendedModel(type);
  console.log(`  ${type}: ${recommended.name} (${recommended.id})`);
});

// Test 5: Test validation
console.log('\n5. Configuration Validation:');
const validationResult = validateAIConfig(testConfig);
console.log(`  Valid: ${validationResult.valid}`);
if (!validationResult.valid) {
  console.log('  Errors:', validationResult.errors);
}

// Test 6: Test default config
console.log('\n6. Default Configuration:');
const defaultConfig = getDefaultAIConfig();
console.log(`  Default Model: ${defaultConfig.selectedModel}`);
console.log(`  Temperature: ${defaultConfig.temperature}`);
console.log(`  Max Tokens: ${defaultConfig.maxTokens}`);

// Test 7: Verify exact model IDs for Gemini
console.log('\n7. Gemini Model ID Verification:');
const expectedGeminiModels = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'];
expectedGeminiModels.forEach(modelId => {
  const model = getModelById(modelId);
  if (model) {
    console.log(`  ✓ ${modelId}: Found, Provider: ${model.provider}`);
  } else {
    console.log(`  ✗ ${modelId}: Not Found`);
  }
});

// Test 8: Verify Claude 4 models
console.log('\n8. Claude 4 Model Verification:');
const expectedClaudeModels = ['claude-4-opus', 'claude-4-sonnet', 'claude-3.7-sonnet'];
expectedClaudeModels.forEach(modelId => {
  const model = getModelById(modelId);
  if (model) {
    console.log(`  ✓ ${modelId}: Found, Provider: ${model.provider}`);
  } else {
    console.log(`  ✗ ${modelId}: Not Found`);
  }
});

console.log('\n=== Test Complete ===');

export default function AIModelTest() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">AI Model Configuration Test</h1>
        
        <div className="grid gap-6">
          {/* Model Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Model Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{getModelsByProvider('openai').length}</div>
                <div className="text-sm text-gray-500">OpenAI Models</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{getModelsByProvider('anthropic').length}</div>
                <div className="text-sm text-gray-500">Anthropic Models</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{getModelsByProvider('gemini').length}</div>
                <div className="text-sm text-gray-500">Gemini Models</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600">{getModelsByProvider('azure').length}</div>
                <div className="text-sm text-gray-500">Azure Models</div>
              </div>
            </div>
          </div>

          {/* Latest Models */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Latest Models ({getLatestModels().length})</h2>
            <div className="grid gap-3">
              {getLatestModels().map(model => (
                <div key={model.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-gray-500">{model.id} • {model.version}</div>
                  </div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      model.provider === 'openai' ? 'bg-blue-100 text-blue-800' :
                      model.provider === 'anthropic' ? 'bg-purple-100 text-purple-800' :
                      model.provider === 'gemini' ? 'bg-green-100 text-green-800' :
                      'bg-cyan-100 text-cyan-800'
                    }`}>
                      {model.provider}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Models */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Recommended by Analysis Type</h2>
            <div className="grid gap-3">
              {(['summary', 'detailed', 'executive', 'technical'] as const).map(type => {
                const recommended = getRecommendedModel(type);
                return (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium capitalize">{type} Analysis</div>
                      <div className="text-sm text-gray-500">{recommended.name}</div>
                    </div>
                    <div className="text-sm font-mono text-gray-600">{recommended.id}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
