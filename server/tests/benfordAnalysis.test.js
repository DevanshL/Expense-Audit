const { extractFirstDigit, calculateDigitFrequencies, calculateMAD, assessCompliance } = require('../utils/benfordAnalysis');

describe('Benford\'s Law Logic', () => {
  
  describe('extractFirstDigit', () => {
    test('extracts first digit from positive integers', () => {
      expect(extractFirstDigit(123)).toBe(1);
      expect(extractFirstDigit(4567)).toBe(4);
      expect(extractFirstDigit(9)).toBe(9);
    });

    test('extracts first digit from decimals', () => {
      expect(extractFirstDigit(0.123)).toBe(1);
      expect(extractFirstDigit(0.0056)).toBe(5);
    });

    test('handles negative numbers (absolute value)', () => {
      expect(extractFirstDigit(-123)).toBe(1);
      expect(extractFirstDigit(-0.045)).toBe(4);
    });

    test('handles scientific notation', () => {
      expect(extractFirstDigit(1.2e-5)).toBe(1);
      expect(extractFirstDigit(9.9e10)).toBe(9);
    });

    test('returns null for zero and invalid inputs', () => {
      expect(extractFirstDigit(0)).toBeNull();
      expect(extractFirstDigit(Infinity)).toBeNull();
      expect(extractFirstDigit(NaN)).toBeNull();
    });
  });

  describe('Fraud Detection Scenarios', () => {
    test('recognizes the "Natural Growth" (Real World) scenario', () => {
      // Data based on the user's "Real World" table
      // digit: 1(30), 2(18), 3(12), 4(10), 5(8), 6(7), 7(6), 8(5), 9(4)
      const naturalData = [
        ...Array(30).fill(100),
        ...Array(18).fill(200),
        ...Array(12).fill(300),
        ...Array(10).fill(400),
        ...Array(8).fill(500),
        ...Array(7).fill(600),
        ...Array(6).fill(700),
        ...Array(5).fill(800),
        ...Array(4).fill(900)
      ];

      const frequencies = calculateDigitFrequencies(naturalData);
      const mad = calculateMAD(frequencies);
      const { assessment, riskLevel } = assessCompliance(mad);

      // In a real-world scenario, the MAD should be very low
      expect(mad).toBeLessThan(0.6); 
      expect(assessment).toBe('compliant');
      expect(riskLevel).toBe('low');
    });

    test('detects the "Red Flag" (Tax Fraud) scenario', () => {
      // Data based on the user's "Tax Fraud" example: Digit 4 appears 50 times out of 100
      // Expected frequency for digit 4 is ~9.7%
      const fraudulentData = [
        ...Array(50).fill(480), // 50 transactions starting with 4
        ...Array(10).fill(100),
        ...Array(10).fill(200),
        ...Array(10).fill(300),
        ...Array(10).fill(500),
        ...Array(10).fill(600)
      ];

      const frequencies = calculateDigitFrequencies(fraudulentData);
      const mad = calculateMAD(frequencies);
      const { assessment, riskLevel } = assessCompliance(mad);

      // This should flag as highly suspicious/critical
      expect(mad).toBeGreaterThan(2.2);
      expect(assessment).toBe('highly_suspicious');
      expect(riskLevel).toBe('critical');
    });
  });
});
