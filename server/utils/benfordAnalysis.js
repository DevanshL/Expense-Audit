const BENFORDS_EXPECTED = {
  1: 30.1,
  2: 17.6,
  3: 12.5,
  4: 9.7,
  5: 7.9,
  6: 6.7,
  7: 5.8,
  8: 5.1,
  9: 4.6,
};

/**
 * Extract the first non-zero digit from a number
 */
function extractFirstDigit(amount) {
  const absAmount = Math.abs(amount);
  
  if (absAmount === 0 || !isFinite(absAmount)) {
    return null;
  }
  
  const exponent = Math.floor(Math.log10(absAmount));
  const firstDigit = Math.floor(absAmount / Math.pow(10, exponent));
  
  if (firstDigit < 1) return 1;
  if (firstDigit > 9) return 9;
  
  return firstDigit;
}

/**
 * Calculate digit frequency distribution
 */
function calculateDigitFrequencies(amounts) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  let totalValid = 0;
  
  for (const amount of amounts) {
    const firstDigit = extractFirstDigit(amount);
    if (firstDigit && firstDigit >= 1 && firstDigit <= 9) {
      counts[firstDigit]++;
      totalValid++;
    }
  }
  
  return Object.entries(counts).map(([digit, count]) => {
    const digitNum = parseInt(digit, 10);
    const observed = totalValid > 0 ? (count / totalValid) * 100 : 0;
    const expected = BENFORDS_EXPECTED[digitNum];
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
 * Calculate Mean Absolute Deviation (MAD)
 */
function calculateMAD(frequencies) {
  const totalDeviation = frequencies.reduce((sum, freq) => sum + freq.deviation, 0);
  return totalDeviation / frequencies.length;
}

/**
 * Assess overall compliance with Benford's Law
 */
function assessCompliance(mad) {
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
 * Perform full Benford's Law analysis on a dataset
 * @param {Object} dataset - Object with a `data` array of transaction rows
 */
function performBenfordAnalysis(dataset) {
  const rows = dataset?.data || dataset || [];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Dataset must contain a non-empty data array');
  }

  // Extract numeric amounts
  const amounts = rows
    .map(row => {
      const val = row.amount ?? row.Amount ?? row.value ?? row.Value;
      return parseFloat(val);
    })
    .filter(n => !isNaN(n) && isFinite(n) && n > 0);

  if (amounts.length === 0) {
    throw new Error('No valid numeric amounts found in dataset');
  }

  const digitFrequencies = calculateDigitFrequencies(amounts);
  const mad = calculateMAD(digitFrequencies);
  const { assessment: overallAssessment, riskLevel } = assessCompliance(mad);

  // Chi-square statistic
  const chiSquare = digitFrequencies.reduce((sum, freq) => {
    if (freq.expected === 0) return sum;
    const expectedCount = (freq.expected / 100) * amounts.length;
    return sum + Math.pow(freq.count - expectedCount, 2) / expectedCount;
  }, 0);

  return {
    totalAnalyzed: amounts.length,
    digitFrequencies,
    mad,
    chiSquare,
    overallAssessment,
    riskLevel,
    suspiciousVendors: [],
    flaggedTransactions: [],
    warnings: amounts.length < 30
      ? ['Sample size is small (< 30 transactions). Results may not be statistically reliable.']
      : [],
  };
}

module.exports = {
  BENFORDS_EXPECTED,
  extractFirstDigit,
  calculateDigitFrequencies,
  calculateMAD,
  assessCompliance,
  performBenfordAnalysis,
};
