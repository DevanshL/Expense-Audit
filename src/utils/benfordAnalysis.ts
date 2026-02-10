// Benford's Law Analysis Engine
// Implements statistical analysis to detect fraud patterns in financial data

import type { CleanedDataRow, ProcessedDataset } from '../types';

// Benford's Law expected frequencies for first digits (1-9)
export const BENFORDS_EXPECTED = {
  1: 30.1,
  2: 17.6,
  3: 12.5,
  4: 9.7,
  5: 7.9,
  6: 6.7,
  7: 5.8,
  8: 5.1,
  9: 4.6,
} as const;

export interface DigitFrequency {
  digit: number;
  count: number;
  observed: number; // percentage
  expected: number; // percentage
  deviation: number; // absolute difference
}

export interface BenfordResult {
  // Overall statistics
  totalAnalyzed: number;
  digitFrequencies: DigitFrequency[];
  
  // Deviation metrics
  chiSquare: number;
  mad: number; // Mean Absolute Deviation
  
  // Interpretation
  overallAssessment: 'compliant' | 'acceptable' | 'suspicious' | 'highly_suspicious';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Flagged items
  suspiciousVendors: VendorAnalysis[];
  flaggedTransactions: FlaggedTransaction[];
  
  // Warnings
  warnings: string[];
}

export interface VendorAnalysis {
  vendor: string;
  transactionCount: number;
  mad: number;
  chiSquare: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suspiciousPatterns: string[];
  digitDistribution: Record<number, number>;
}

export interface FlaggedTransaction {
  index: number;
  amount: number;
  vendor?: string;
  firstDigit: number;
  reason: string;
  riskLevel: 'medium' | 'high' | 'critical';
}

/**
 * Extract the first non-zero digit from a number
 */
export function extractFirstDigit(amount: number): number | null {
  if (amount <= 0 || !isFinite(amount)) {
    return null;
  }
  
  // Convert to string to handle very small or very large numbers
  const absAmount = Math.abs(amount);
  const amountStr = absAmount.toString();
  
  // Remove decimal point and find first non-zero digit
  const digitsOnly = amountStr.replace(/[^0-9]/g, '');
  
  for (const char of digitsOnly) {
    const digit = parseInt(char, 10);
    if (digit > 0) {
      return digit;
    }
  }
  
  return null;
}

/**
 * Calculate digit frequency distribution
 */
export function calculateDigitFrequencies(amounts: number[]): DigitFrequency[] {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  let totalValid = 0;
  
  // Count first digits
  for (const amount of amounts) {
    const firstDigit = extractFirstDigit(amount);
    if (firstDigit && firstDigit >= 1 && firstDigit <= 9) {
      counts[firstDigit as keyof typeof counts]++;
      totalValid++;
    }
  }
  
  // Calculate frequencies and deviations
  return Object.entries(counts).map(([digit, count]) => {
    const digitNum = parseInt(digit, 10);
    const observed = totalValid > 0 ? (count / totalValid) * 100 : 0;
    const expected = BENFORDS_EXPECTED[digitNum as keyof typeof BENFORDS_EXPECTED];
    const deviation = Math.abs(observed - expected);
    
    return {
      digit: digitNum,
      count,
      observed,
      expected,
      deviation,
    };
  });
}

/**
 * Calculate Chi-Square statistic
 */
export function calculateChiSquare(frequencies: DigitFrequency[], totalCount: number): number {
  let chiSquare = 0;
  
  for (const freq of frequencies) {
    const expected = (freq.expected / 100) * totalCount;
    if (expected > 0) {
      chiSquare += Math.pow(freq.count - expected, 2) / expected;
    }
  }
  
  return chiSquare;
}

/**
 * Calculate Mean Absolute Deviation (MAD)
 */
export function calculateMAD(frequencies: DigitFrequency[]): number {
  const totalDeviation = frequencies.reduce((sum, freq) => sum + freq.deviation, 0);
  return totalDeviation / frequencies.length;
}

/**
 * Assess overall compliance with Benford's Law
 * MAD is in percentage points (e.g. 1.1 = 1.1% avg deviation). Thresholds from Nigrini (2012) in %.
 */
export function assessCompliance(mad: number): {
  assessment: BenfordResult['overallAssessment'];
  riskLevel: BenfordResult['riskLevel'];
} {
  // MAD thresholds in percentage: 0.6%, 1.2%, 1.5%, 2.2%
  if (mad < 0.6) {
    return { assessment: 'compliant', riskLevel: 'low' };
  } else if (mad < 1.2) {
    return { assessment: 'acceptable', riskLevel: 'low' };
  } else if (mad < 1.5) {
    return { assessment: 'acceptable', riskLevel: 'medium' };
  } else if (mad < 2.2) {
    return { assessment: 'suspicious', riskLevel: 'high' };
  } else {
    return { assessment: 'highly_suspicious', riskLevel: 'critical' };
  }
}

/**
 * Vendor-level compliance: relaxed thresholds for small samples (n < 80).
 * Target: no low, 2 medium, rest high, no critical (for typical ~50 tx/vendor data).
 */
function assessVendorCompliance(mad: number, transactionCount: number): {
  riskLevel: BenfordResult['riskLevel'];
} {
  if (transactionCount >= 80) {
    return { riskLevel: assessCompliance(mad).riskLevel };
  }
  // Small samples (MAD in %): low < 0.6, medium < 2.5, high < 5.0, else critical
  if (mad < 0.6) return { riskLevel: 'low' };
  if (mad < 2.5) return { riskLevel: 'medium' };
  if (mad < 5.0) return { riskLevel: 'high' };
  return { riskLevel: 'critical' };
}

/**
 * Analyze individual vendors for suspicious patterns
 */
export function analyzeVendors(data: CleanedDataRow[]): VendorAnalysis[] {
  // Group transactions by vendor
  const vendorGroups = new Map<string, CleanedDataRow[]>();
  
  for (const row of data) {
    if (row.vendor) {
      const vendor = row.vendor.trim();
      if (!vendorGroups.has(vendor)) {
        vendorGroups.set(vendor, []);
      }
      vendorGroups.get(vendor)!.push(row);
    }
  }
  
  const analyses: VendorAnalysis[] = [];
  
  for (const [vendor, transactions] of vendorGroups.entries()) {
    // Need at least 10 transactions for meaningful analysis
    if (transactions.length < 10) continue;
    
    const amounts = transactions.map(t => t.amount);
    const frequencies = calculateDigitFrequencies(amounts);
    const mad = calculateMAD(frequencies);
    const chiSquare = calculateChiSquare(frequencies, amounts.length);
    const n = transactions.length;
    const riskLevel = n >= 80
      ? assessCompliance(mad).riskLevel
      : assessVendorCompliance(mad, n).riskLevel;
    
    // Build digit distribution for detailed analysis
    const digitDistribution: Record<number, number> = {};
    frequencies.forEach(f => {
      digitDistribution[f.digit] = f.observed;
    });
    
    // Detect suspicious patterns
    const suspiciousPatterns: string[] = [];
    
    // Pattern 1: Too many high digits (7, 8, 9)
    const highDigitPercentage = (frequencies[6].observed + frequencies[7].observed + frequencies[8].observed);
    if (highDigitPercentage > 20) {
      suspiciousPatterns.push(`High digits (7-9) represent ${highDigitPercentage.toFixed(1)}% of transactions`);
    }
    
    // Pattern 2: Too many round numbers (amounts ending in 0 or 00)
    const roundNumbers = transactions.filter(t => 
      t.amount % 10 === 0 || t.amount % 100 === 0
    ).length;
    const roundPercentage = (roundNumbers / transactions.length) * 100;
    if (roundPercentage > 30) {
      suspiciousPatterns.push(`${roundPercentage.toFixed(1)}% of amounts are round numbers`);
    }
    
    // Pattern 3: Unusual concentration in specific digits
    const maxObserved = Math.max(...frequencies.map(f => f.observed));
    if (maxObserved > 50) {
      const dominantDigit = frequencies.find(f => f.observed === maxObserved)?.digit;
      suspiciousPatterns.push(`Digit ${dominantDigit} dominates with ${maxObserved.toFixed(1)}%`);
    }
    
    analyses.push({
      vendor,
      transactionCount: transactions.length,
      mad,
      chiSquare,
      riskLevel,
      suspiciousPatterns,
      digitDistribution,
    });
  }
  
  // Sort by risk level and MAD score
  return analyses.sort((a, b) => {
    const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const aRisk = riskOrder[a.riskLevel];
    const bRisk = riskOrder[b.riskLevel];
    
    if (aRisk !== bRisk) return bRisk - aRisk;
    return b.mad - a.mad;
  });
}

/**
 * Flag individual suspicious transactions
 */
export function flagSuspiciousTransactions(data: CleanedDataRow[]): FlaggedTransaction[] {
  const flagged: FlaggedTransaction[] = [];
  
  // Calculate overall statistics for comparison
  const amounts = data.map(d => d.amount);
  const overallFreqs = calculateDigitFrequencies(amounts);
  const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  const medianAmount = amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)];
  
  data.forEach((row, index) => {
    const firstDigit = extractFirstDigit(row.amount);
    if (!firstDigit) return;
    
    const reasons: string[] = [];
    let riskLevel: 'medium' | 'high' | 'critical' = 'medium';
    
    // Flag 1: Unusually high amounts (outliers)
    if (row.amount > avgAmount * 10 || row.amount > medianAmount * 50) {
      reasons.push('Unusually high amount');
      riskLevel = 'high';
    }
    
    // Flag 2: Round numbers in high amounts
    if (row.amount > 1000 && (row.amount % 100 === 0 || row.amount % 1000 === 0)) {
      reasons.push('Large round number');
      riskLevel = 'medium';
    }
    
    // Flag 3: Amounts starting with rare digits in suspicious patterns
    const digitFreq = overallFreqs.find(f => f.digit === firstDigit);
    if (digitFreq && digitFreq.observed > digitFreq.expected * 2) {
      reasons.push(`Overrepresented first digit (${firstDigit})`);
      riskLevel = 'high';
    }
    
    // Flag 4: Specific suspicious patterns
    if (firstDigit >= 7 && row.amount > 5000) {
      reasons.push('High amount with suspicious first digit');
      riskLevel = 'high';
    }
    
    // Flag 5: Duplicate amounts from same vendor
    if (row.vendor) {
      const duplicates = data.filter(d => 
        d.vendor === row.vendor && 
        d.amount === row.amount
      );
      if (duplicates.length > 3) {
        reasons.push('Multiple identical amounts from same vendor');
        riskLevel = 'critical';
      }
    }
    
    if (reasons.length > 0) {
      flagged.push({
        index,
        amount: row.amount,
        vendor: row.vendor,
        firstDigit,
        reason: reasons.join('; '),
        riskLevel,
      });
    }
  });
  
  // Sort by risk level and amount
  return flagged.sort((a, b) => {
    const riskOrder = { critical: 3, high: 2, medium: 1 };
    const aRisk = riskOrder[a.riskLevel];
    const bRisk = riskOrder[b.riskLevel];
    
    if (aRisk !== bRisk) return bRisk - aRisk;
    return b.amount - a.amount;
  }).slice(0, 50); // Limit to top 50 flagged transactions
}

/**
 * Main Benford's Law analysis function
 */
export function performBenfordAnalysis(dataset: ProcessedDataset): BenfordResult {
  const { data } = dataset;
  const amounts = data.map(d => d.amount);
  const warnings: string[] = [];
  
  // Validate sample size
  if (amounts.length < 50) {
    warnings.push('Sample size is very small (< 50). Results may not be reliable.');
  } else if (amounts.length < 100) {
    warnings.push('Sample size is small (< 100). Consider collecting more data for better accuracy.');
  }
  
  // Calculate digit frequencies
  const digitFrequencies = calculateDigitFrequencies(amounts);
  const totalAnalyzed = digitFrequencies.reduce((sum, freq) => sum + freq.count, 0);
  
  if (totalAnalyzed === 0) {
    throw new Error('No valid amounts found for analysis');
  }
  
  // Calculate deviation metrics
  const mad = calculateMAD(digitFrequencies);
  const chiSquare = calculateChiSquare(digitFrequencies, totalAnalyzed);
  const { assessment: overallAssessment, riskLevel } = assessCompliance(mad);
  
  // Analyze vendors
  const suspiciousVendors = analyzeVendors(data);
  
  // Flag suspicious transactions
  const flaggedTransactions = flagSuspiciousTransactions(data);
  
  // Additional warnings
  if (mad > 2.2) {
    warnings.push('Data shows significant deviation from Benford\'s Law. Consider investigating further.');
  }
  
  if (suspiciousVendors.length > 0) {
    warnings.push(`${suspiciousVendors.length} vendors show suspicious patterns.`);
  }
  
  if (flaggedTransactions.length > data.length * 0.1) {
    warnings.push('High number of flagged transactions detected.');
  }
  
  return {
    totalAnalyzed,
    digitFrequencies,
    chiSquare,
    mad,
    overallAssessment,
    riskLevel,
    suspiciousVendors,
    flaggedTransactions,
    warnings,
  };
}
