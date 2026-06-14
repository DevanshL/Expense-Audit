import { useState } from 'react';
import { Download, TestTube, Shuffle, ShieldCheck, Zap, Database, AlertOctagon } from 'lucide-react';
import { cn } from '../utils/cn';
import { downloadSampleData, SAMPLE_CONFIGS } from '../utils/sampleDataGenerator';
import { useToast } from '../hooks/useToast';
import { Interactive3DTiltCard } from './ui/Interactive3DTiltCard';

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

  const configMeta = {
    small: {
      tag: 'Quick Scan',
      desc: '100 transactions - perfect for a rapid test run of the audit models.',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/30',
      icon: ShieldCheck
    },
    medium: {
      tag: 'Balanced Check',
      desc: '500 transactions - a comprehensive baseline audit dataset.',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-800/30',
      icon: Zap
    },
    large: {
      tag: 'Deep Audit',
      desc: '1,000 transactions - large financial record to stress test dashboards.',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/30',
      icon: Database
    },
    fraudulent: {
      tag: 'Anomalous (Violations)',
      desc: '300 transactions - intentionally seeded anomalies violating Benford\'s Law.',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/30',
      icon: AlertOctagon
    }
  };

  return (
    <div className={cn(
      'glass-panel border border-slate-200/60 dark:border-slate-800/50 rounded-2xl p-6 shadow-md relative overflow-hidden',
      className
    )}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none z-0" />

      <div className="flex items-center gap-3.5 mb-6 relative z-10">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md shadow-indigo-500/10">
          <TestTube className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Generate Sample Data
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
            Download high-fidelity test datasets to explore the dashboard capabilities.
          </p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Dataset Configurations
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(configMeta).map(([key, meta]) => {
              const isSelected = selectedConfig === key;
              const config = SAMPLE_CONFIGS[key as keyof typeof SAMPLE_CONFIGS];
              const MetaIcon = meta.icon;

              return (
                <Interactive3DTiltCard
                  key={key}
                  maxTilt={4}
                  scale={1.01}
                  glareOpacity={0.15}
                  onClick={() => setSelectedConfig(key as keyof typeof SAMPLE_CONFIGS)}
                  className={cn(
                    'cursor-pointer border rounded-2xl transition-all duration-300 ease-out select-none flex flex-col',
                    isSelected
                      ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/5 shadow-[0_4px_25px_rgba(99,102,241,0.12)]'
                      : 'border-slate-200/60 dark:border-slate-800/60 glass-panel hover:border-slate-350 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 shadow-sm'
                  )}
                >
                  <div className="p-4 flex flex-col h-full justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'p-1.5 rounded-lg border',
                            isSelected 
                              ? 'bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/20' 
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-750'
                          )}>
                            <MetaIcon className={cn(
                              'w-4 h-4',
                              isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                            )} />
                          </div>
                          <span className="font-extrabold text-sm text-slate-850 dark:text-slate-150 capitalize tracking-tight">
                            {key} Size
                          </span>
                        </div>
                        <span className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                          meta.badgeColor
                        )}>
                          {meta.tag}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                        {meta.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Volume Indicators
                      </div>
                      <div className={cn(
                        'text-xs font-bold tracking-tight',
                        key === 'fraudulent' ? 'text-rose-600 dark:text-rose-455' : 'text-indigo-600 dark:text-indigo-400'
                      )}>
                        {config.totalTransactions.toLocaleString()} TXs • {config.suspiciousVendorPercentage}% Anomaly
                      </div>
                    </div>
                  </div>
                </Interactive3DTiltCard>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleGenerateSample}
            disabled={isGenerating}
            className={cn(
              'flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex-1 relative overflow-hidden group shadow-md',
              'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 active:scale-[0.98]'
            )}
          >
            {!isGenerating && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-[shine_1.8s_ease-in-out_infinite]" />
            )}
            {isGenerating ? (
              <>
                <Shuffle className="w-4 h-4 animate-spin text-white" />
                <span>Generating Test Asset...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white group-hover:-translate-y-0.5 group-hover:translate-y-0.2 transition-transform" />
                <span>Download Selected CSV Dataset</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/40 rounded-xl text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed">
          <p className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
            Each test dataset generates clean financial records modeled with realistic names, vendor indices, and transaction amounts.
          </p>
          <p className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
            Once downloaded, drag-and-drop or select the CSV file in the uploader component above.
          </p>
          <p className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
            The <span className="font-extrabold text-rose-500">Fraudulent</span> option triggers high deviation metrics in Step 3 visual dashboards.
          </p>
        </div>
      </div>
    </div>
  );
}
