import { useState } from 'react';
import { ChevronDown, Check, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import type { ColumnMapping } from '../types';

interface ColumnMappingProps {
  availableColumns: string[];
  initialMapping: Partial<ColumnMapping>;
  onMappingChange: (mapping: ColumnMapping) => void;
  className?: string;
}

const REQUIRED_FIELDS = [
  { key: 'amount', label: 'Amount *', description: 'Numeric values for analysis (required)' },
] as const;

const OPTIONAL_FIELDS = [
  { key: 'vendor', label: 'Vendor', description: 'Company or supplier name' },
  { key: 'date', label: 'Date', description: 'Transaction date' },
  { key: 'category', label: 'Category', description: 'Expense category or type' },
] as const;

interface DropdownProps {
  value: string | undefined;
  options: string[];
  placeholder: string;
  onChange: (value: string | undefined) => void;
  required?: boolean;
}

function Dropdown({ value, options, placeholder, onChange, required }: DropdownProps) {
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
    // Small delay to allow for option clicks
    setTimeout(() => {
      if (!e.currentTarget.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 100);
  };

  return (
    <div className="relative" onBlur={handleBlur}>
      <button
        type="button"
        onClick={handleToggle}
        onMouseDown={(e) => e.preventDefault()} // Prevent double-click issues
        className={cn(
          'w-full px-3 py-2 text-left bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
          value ? 'border-gray-300' : required ? 'border-red-300' : 'border-gray-300',
          'flex items-center justify-between hover:border-primary-300'
        )}
      >
        <span className={cn(
          value ? 'text-gray-900' : 'text-gray-400'
        )}>
          {value || placeholder}
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform duration-200',
          isOpen && 'transform rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="py-1">
            <button
              type="button"
              onClick={(e) => handleOptionSelect(undefined, e)}
              onMouseDown={(e) => e.preventDefault()}
              className="w-full px-3 py-2 text-left text-gray-400 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center transition-colors"
            >
              <span>No column selected</span>
            </button>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={(e) => handleOptionSelect(option, e)}
                onMouseDown={(e) => e.preventDefault()}
                className={cn(
                  'w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between transition-colors',
                  value === option && 'bg-primary-50 text-primary-700'
                )}
              >
                <span>{option}</span>
                {value === option && <Check className="w-4 h-4" />}
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
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>(initialMapping);

  const updateMapping = (key: keyof ColumnMapping, value: string | undefined) => {
    const newMapping = { ...mapping, [key]: value };
    setMapping(newMapping);
    
    // Only call onMappingChange if we have the required amount field
    if (newMapping.amount) {
      onMappingChange(newMapping as ColumnMapping);
    }
  };

  const isValid = mapping.amount !== undefined;

  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Column Mapping
          </h3>
          {!isValid && (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          )}
        </div>
        
        <p className="text-sm text-gray-600">
          Map your data columns to the expected fields. The Amount field is required for analysis.
        </p>
      </div>

      <div className="space-y-4">
        {/* Required Fields */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            Required Fields
          </h4>
          
          {REQUIRED_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
              </label>
              <Dropdown
                value={mapping[field.key]}
                options={availableColumns}
                placeholder={`Select column for ${field.label.replace(' *', '')}`}
                onChange={(value) => updateMapping(field.key, value)}
                required
              />
              <p className="text-xs text-gray-500">{field.description}</p>
              {field.key === 'amount' && !mapping.amount && (
                <p className="text-xs text-red-600">Amount column is required for analysis</p>
              )}
            </div>
          ))}
        </div>

        {/* Optional Fields */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            Optional Fields
          </h4>
          
          {OPTIONAL_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
              </label>
              <Dropdown
                value={mapping[field.key]}
                options={availableColumns}
                placeholder={`Select column for ${field.label}`}
                onChange={(value) => updateMapping(field.key, value)}
              />
              <p className="text-xs text-gray-500">{field.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Status */}
      <div className={cn(
        'p-3 rounded-md border',
        isValid
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-amber-50 border-amber-200 text-amber-800'
      )}>
        <div className="flex items-center space-x-2">
          {isValid ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isValid
              ? 'Column mapping is complete. You can proceed to data processing.'
              : 'Please select the Amount column to continue.'
            }
          </span>
        </div>
      </div>
    </div>
  );
}
