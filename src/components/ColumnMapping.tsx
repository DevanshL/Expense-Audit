import { useState } from 'react';
import { ChevronDown, Check, AlertTriangle, HelpCircle, Settings } from 'lucide-react';
import { cn } from '../utils/cn';
import type { ColumnMapping as IColumnMapping } from '../types';

interface ColumnMappingProps {
  availableColumns: string[];
  initialMapping: Partial<IColumnMapping>;
  onMappingChange: (mapping: IColumnMapping) => void;
  className?: string;
}

const REQUIRED_FIELDS = [
  { key: 'amount' as const, label: 'Amount', description: 'Numeric values representing expense amounts for Benford analysis (required)' },
] as const;

const OPTIONAL_FIELDS = [
  { key: 'vendor' as const, label: 'Vendor Name', description: 'Supplier or vendor name for anomaly tracking' },
  { key: 'date' as const, label: 'Transaction Date', description: 'Date of the expense occurrence' },
  { key: 'category' as const, label: 'Expense Category', description: 'General ledger account or department type' },
] as const;

interface DropdownProps {
  value: string | undefined;
  options: string[];
  placeholder: string;
  onChange: (value: string | undefined) => void;
}

function Dropdown({ value, options, placeholder, onChange }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleOptionSelect = (option: string | undefined, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(option);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  const handleBlur = (e: React.FocusEvent) => {
    setTimeout(() => {
      if (!e.currentTarget.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 150);
  };

  return (
    <div className="relative" onBlur={handleBlur}>
      <button
        type="button"
        onClick={handleToggle}
        onMouseDown={(e) => e.preventDefault()}
        className={cn(
          'w-full px-4 py-3 text-left rounded-xl transition-all duration-300 outline-none select-none flex items-center justify-between border relative',
          isOpen 
            ? 'border-indigo-500 bg-white/95 dark:bg-slate-900/90 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
            : 'border-slate-200 dark:border-slate-800 glass-panel hover:border-slate-350 dark:hover:border-slate-700 shadow-sm hover:scale-[1.005]'
        )}
      >
        <span className={cn(
          'text-sm font-medium tracking-tight truncate',
          value ? 'text-slate-850 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
        )}>
          {value || placeholder}
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 text-slate-400 transition-transform duration-300',
          isOpen && 'transform rotate-180 text-indigo-500'
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-2 glass-panel border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-xl max-h-60 overflow-y-auto backdrop-blur-xl animate-fadeIn">
          <div className="py-1.5 px-1.5 space-y-0.5">
            <button
              type="button"
              onClick={(e) => handleOptionSelect(undefined, e)}
              onMouseDown={(e) => e.preventDefault()}
              className="w-full px-3 py-2 text-left rounded-lg text-xs font-semibold text-slate-400 dark:text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors flex items-center"
            >
              <span>-- Deselect Column --</span>
            </button>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={(e) => handleOptionSelect(option, e)}
                onMouseDown={(e) => e.preventDefault()}
                className={cn(
                  'w-full px-3 py-2 text-left text-xs font-bold rounded-lg flex items-center justify-between transition-all duration-200',
                  value === option 
                    ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 border border-transparent'
                )}
              >
                <span>{option}</span>
                {value === option && <Check className="w-3.5 h-3.5 text-indigo-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ColumnMapping({ 
  availableColumns, 
  initialMapping, 
  onMappingChange, 
  className 
}: ColumnMappingProps) {
  const [mapping, setMapping] = useState<Partial<IColumnMapping>>(initialMapping);

  const updateMapping = (key: keyof IColumnMapping, value: string | undefined) => {
    const newMapping = { ...mapping, [key]: value };
    setMapping(newMapping);
    
    // Only call onMappingChange if we have the required amount field
    if (newMapping.amount) {
      onMappingChange(newMapping as IColumnMapping);
    }
  };

  const isValid = mapping.amount !== undefined;

  return (
    <div className={cn('glass-panel border border-slate-200/60 dark:border-slate-800/50 rounded-2xl p-6 shadow-md relative overflow-hidden', className)}>
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none z-0" />

      <div className="space-y-4 mb-6 relative z-10">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md shadow-indigo-500/10">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Column Mapping Setup
            {!isValid && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}
          </h3>
        </div>
        
        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
          Map your dataset headings to standard expense parameters. The **Amount** column must be mapped to begin calculations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6 relative z-10">
        {/* Required Fields Group */}
        <div className="space-y-4 p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/40 dark:border-slate-800/40">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Required Mapping
            </h4>
            <span className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">Essential</span>
          </div>
          
          {REQUIRED_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                {field.label} Column <span className="text-rose-500">*</span>
              </label>
               <Dropdown
                value={mapping[field.key]}
                options={availableColumns}
                placeholder={`Select Amount column`}
                onChange={(value) => updateMapping(field.key, value)}
              />
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                {field.description}
              </p>
              {field.key === 'amount' && !mapping.amount && (
                <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 animate-pulse">
                  ⚠️ An amount column is strictly required for financial auditing.
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Optional Fields Group */}
        <div className="space-y-4 p-4 rounded-xl bg-slate-150/20 dark:bg-slate-900/20 border border-slate-200/30 dark:border-slate-800/20">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/30 dark:border-slate-800/20">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Optional Context Mapping
            </h4>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/30 dark:border-slate-700/30">Optional</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {OPTIONAL_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-350">
                    {field.label}
                  </label>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1.5 leading-snug">
                    {field.description}
                  </p>
                </div>
                <Dropdown
                  value={mapping[field.key]}
                  options={availableColumns}
                  placeholder={`Select ${field.label}`}
                  onChange={(value) => updateMapping(field.key, value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Status Panel */}
      <div className={cn(
        'p-4 rounded-xl border transition-all duration-500 relative z-10',
        isValid
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-450 shadow-sm'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-450 shadow-sm animate-pulse'
      )}>
        <div className="flex items-center space-x-2.5">
          <div className={cn(
            'p-1 rounded-full border',
            isValid ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-amber-500 border-amber-500 text-white'
          )}>
            {isValid ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight">
            {isValid
              ? 'Column mapping complete! Verified for processing.'
              : 'Mapping Pending: Please choose the Amount column above.'
            }
          </span>
        </div>
      </div>
    </div>
  );
}
