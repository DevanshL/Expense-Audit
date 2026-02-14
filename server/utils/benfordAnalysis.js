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

module.exports = {
  BENFORDS_EXPECTED,
  extractFirstDigit,
  calculateDigitFrequencies,
  calculateMAD,
  assessCompliance
};
