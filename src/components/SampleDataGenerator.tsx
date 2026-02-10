import { useState } from 'react';
import { Download, TestTube, Shuffle } from 'lucide-react';
import { cn } from '../utils/cn';
import { downloadSampleData, SAMPLE_CONFIGS } from '../utils/sampleDataGenerator';
import { useToast } from '../hooks/useToast';

interface SampleDataGeneratorProps {
  className?: string;
}

export function SampleDataGenerator({ className }: SampleDataGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<keyof typeof SAMPLE_CONFIGS>('medium');
  const { success, error } = useToast();

  const handleGenerateSample = async () => {
    setIsGenerating(true);
    
    try {
      const config = SAMPLE_CONFIGS[selectedConfig];
      const filename = `sample_${selectedConfig}_${new Date().toISOString().split('T')[0]}.csv`;
      downloadSampleData(config, filename);
      success('Sample data generated!', `Downloaded ${config.totalTransactions} transactions as ${filename}`);
    } catch (err) {
      console.error('Error generating sample data:', err);
      error('Generation failed', 'Unable to generate sample data. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const configDescriptions = {
    small: 'Small dataset (100 transactions) - Quick testing',
    medium: 'Medium dataset (500 transactions) - Balanced analysis',
    large: 'Large dataset (1,000 transactions) - Comprehensive testing',
    fraudulent: 'Fraudulent dataset (300 transactions) - High violation patterns'
  };

  return (
    <div className={cn(
      'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
      'border border-blue-200 dark:border-blue-800 rounded-xl p-6',
      className
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <TestTube className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Generate Sample Data
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Download test data to explore ExpenseAudit AI features
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dataset Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(configDescriptions).map(([key, description]) => (
              <label
                key={key}
                className={cn(
                  'flex items-start p-3 border rounded-lg cursor-pointer transition-colors',
                  selectedConfig === key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                )}
              >
                <input
                  type="radio"
                  name="sampleConfig"
                  value={key}
                  checked={selectedConfig === key}
                  onChange={(e) => setSelectedConfig(e.target.value as keyof typeof SAMPLE_CONFIGS)}
                  className="mt-0.5 mr-3"
                />
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 capitalize">
                    {key}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {description}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {SAMPLE_CONFIGS[key as keyof typeof SAMPLE_CONFIGS].totalTransactions} transactions, 
                    {' '}{SAMPLE_CONFIGS[key as keyof typeof SAMPLE_CONFIGS].suspiciousVendorPercentage}% suspicious
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGenerateSample}
            disabled={isGenerating}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors flex-1',
              'bg-blue-600 hover:bg-blue-700 text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isGenerating ? (
              <>
                <Shuffle className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Sample Data
              </>
            )}
          </button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• Sample data includes realistic transaction patterns and intentionally suspicious entries</p>
          <p>• Use the generated CSV file with the upload feature above</p>
          <p>• Fraudulent dataset demonstrates clear Benford's Law violations for testing</p>
        </div>
      </div>
    </div>
  );
}
