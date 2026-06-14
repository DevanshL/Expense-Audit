// AI-Powered Natural Language Summary Engine
// Generates human-readable insights from Benford's Law analysis

import type { BenfordResult, ProcessedDataset, CleanedDataRow } from '../types';

export interface AnalysisSummary {
  // Executive summary
  executiveSummary: string;
  
  // Detailed insights
  overallFindings: string[];
  vendorInsights: string[];
  transactionInsights: string[];
  timeBasedInsights: string[];
  
  // Recommendations
  recommendations: string[];
  
  // Risk assessment
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    confidence: number; // 0-100%
  };
  
  // Key metrics in plain language
  keyMetrics: {
    totalTransactions: string;
    complianceScore: string;
    flaggedVendors: string;
    suspiciousTransactions: string;
  };
}

/**
 * Analyze temporal patterns in the data
 */
function analyzeTemporalPatterns(data: CleanedDataRow[]): string[] {
  const insights: string[] = [];
  
  // Group by month if date information is available
  const monthlyData = new Map<string, CleanedDataRow[]>();
  const hasDateData = data.some(row => row.date);
  
  if (hasDateData) {
    data.forEach(row => {
      if (row.date) {
        const dateObj = row.date instanceof Date ? row.date : new Date(row.date);
        if (!isNaN(dateObj.getTime())) {
          const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, []);
          }
          monthlyData.get(monthKey)!.push(row);
        }
      }
    });

    // Find months with unusual patterns
    if (monthlyData.size > 1) {
      const monthlyAverages = Array.from(monthlyData.entries()).map(([month, transactions]) => ({
        month,
        avgAmount: transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length,
        count: transactions.length
      }));

      const overallAvg = monthlyAverages.reduce((sum, m) => sum + m.avgAmount, 0) / monthlyAverages.length;
      
      monthlyAverages.forEach(({ month, avgAmount, count }) => {
        if (avgAmount > overallAvg * 1.5) {
          insights.push(`**${month}** shows unusually high average transaction amounts (${(avgAmount / overallAvg * 100 - 100).toFixed(0)}% above normal).`);
        }
        if (count < 5) {
          insights.push(`**${month}** has very few transactions (${count}), which may indicate incomplete data.`);
        }
      });
    }
  } else {
    insights.push('No date information available for temporal analysis.');
  }
  
  return insights;
}

/**
 * Generate vendor-specific insights
 */
function generateVendorInsights(result: BenfordResult): string[] {
  const insights: string[] = [];
  const vendors = result.suspiciousVendors;
  
  if (vendors.length === 0) {
    insights.push('No vendors show significant deviations from expected patterns.');
    return insights;
  }

  // Top risk vendors
  const criticalVendors = vendors.filter(v => v.riskLevel === 'critical');
  const highRiskVendors = vendors.filter(v => v.riskLevel === 'high');
  
  if (criticalVendors.length > 0) {
    const topCritical = criticalVendors[0];
    insights.push(`**${topCritical.vendor}** shows critical risk patterns with ${topCritical.transactionCount} transactions and MAD score of ${topCritical.mad.toFixed(3)}.`);
    
    if (topCritical.suspiciousPatterns.length > 0) {
      insights.push(`Key concerns: ${topCritical.suspiciousPatterns.join(', ').toLowerCase()}.`);
    }
  }
  
  if (highRiskVendors.length > 0) {
    insights.push(`${highRiskVendors.length} vendor${highRiskVendors.length > 1 ? 's show' : ' shows'} high-risk patterns requiring investigation.`);
  }

  // Most frequent suspicious patterns across vendors
  const allPatterns = vendors.flatMap(v => v.suspiciousPatterns);
  const patternCounts = new Map<string, number>();
  
  allPatterns.forEach(pattern => {
    const normalizedPattern = pattern.toLowerCase();
    if (normalizedPattern.includes('round number')) {
      patternCounts.set('round_numbers', (patternCounts.get('round_numbers') || 0) + 1);
    } else if (normalizedPattern.includes('high digits')) {
      patternCounts.set('high_digits', (patternCounts.get('high_digits') || 0) + 1);
    } else if (normalizedPattern.includes('dominates')) {
      patternCounts.set('digit_dominance', (patternCounts.get('digit_dominance') || 0) + 1);
    }
  });

  if (patternCounts.get('round_numbers') && patternCounts.get('round_numbers')! > 1) {
    insights.push(`Multiple vendors show excessive round number patterns, suggesting possible expense manipulation.`);
  }
  
  if (patternCounts.get('high_digits') && patternCounts.get('high_digits')! > 1) {
    insights.push(`Several vendors have unusual concentration of amounts starting with digits 7-9, which may indicate fabricated expenses.`);
  }

  return insights;
}

/**
 * Generate transaction-specific insights
 */
function generateTransactionInsights(result: BenfordResult): string[] {
  const insights: string[] = [];
  const transactions = result.flaggedTransactions;
  
  if (transactions.length === 0) {
    insights.push('No individual transactions flagged as suspicious.');
    return insights;
  }

  const criticalTxns = transactions.filter(t => t.riskLevel === 'critical');
  const highRiskTxns = transactions.filter(t => t.riskLevel === 'high');
  
  // Overall flagged percentage
  const flaggedPercentage = (transactions.length / result.totalAnalyzed) * 100;
  insights.push(`${flaggedPercentage.toFixed(1)}% of transactions (${transactions.length} out of ${result.totalAnalyzed.toLocaleString()}) have been flagged for review.`);
  
  if (criticalTxns.length > 0) {
    const largestAmount = Math.max(...criticalTxns.map(t => t.amount));
    insights.push(`**${criticalTxns.length} critical transactions** require immediate attention, including one for $${largestAmount.toLocaleString()}.`);
  }
  
  if (highRiskTxns.length > 0) {
    insights.push(`${highRiskTxns.length} high-risk transactions show patterns consistent with expense manipulation.`);
  }

  // Analyze common flagging reasons
  const reasons = new Map<string, number>();
  transactions.forEach(t => {
    if (t.reason.includes('round number')) {
      reasons.set('round_numbers', (reasons.get('round_numbers') || 0) + 1);
    }
    if (t.reason.includes('high amount')) {
      reasons.set('outliers', (reasons.get('outliers') || 0) + 1);
    }
    if (t.reason.includes('identical amounts')) {
      reasons.set('duplicates', (reasons.get('duplicates') || 0) + 1);
    }
  });

  if (reasons.get('round_numbers') && reasons.get('round_numbers')! > transactions.length * 0.3) {
    insights.push(`Many flagged transactions involve suspiciously round amounts, which is uncommon in natural expense data.`);
  }
  
  if (reasons.get('duplicates')) {
    insights.push(`${reasons.get('duplicates')} transactions involve identical amounts from the same vendor, suggesting possible duplicate billing or fabrication.`);
  }

  return insights;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(result: BenfordResult): string[] {
  const recommendations: string[] = [];
  
  // Based on overall risk level
  switch (result.riskLevel) {
    case 'critical':
      recommendations.push('**Immediate audit recommended** - Multiple red flags detected requiring urgent investigation.');
      recommendations.push('Review all transactions from flagged vendors immediately.');
      recommendations.push('Consider freezing payments to high-risk vendors pending investigation.');
      break;
      
    case 'high':
      recommendations.push('**Detailed review required** - Significant deviations detected.');
      recommendations.push('Focus investigation on vendors with MAD scores above 0.020.');
      recommendations.push('Implement additional approval controls for flagged transaction types.');
      break;
      
    case 'medium':
      recommendations.push('**Targeted review suggested** - Some patterns warrant closer examination.');
      recommendations.push('Monitor flagged vendors for future submissions.');
      break;
      
    case 'low':
      recommendations.push('**Routine monitoring sufficient** - Data appears largely compliant.');
      break;
  }

  // Specific recommendations based on findings
  if (result.suspiciousVendors.length > 0) {
    recommendations.push(`Request detailed receipts and documentation from the ${result.suspiciousVendors.length} flagged vendor${result.suspiciousVendors.length > 1 ? 's' : ''}.`);
  }

  if (result.flaggedTransactions.some(t => t.reason.includes('round number'))) {
    recommendations.push('Implement policies requiring detailed receipts for all round-number amounts above $100.');
  }

  if (result.flaggedTransactions.some(t => t.reason.includes('identical amounts'))) {
    recommendations.push('Review duplicate expense policies and enhance approval workflows.');
  }

  // Sample size recommendations
  if (result.totalAnalyzed < 100) {
    recommendations.push('Collect more transaction data (target: 100+ transactions) for more reliable statistical analysis.');
  }

  recommendations.push('Schedule follow-up analysis in 30-60 days to track improvement trends.');
  recommendations.push('Consider implementing automated Benford\'s Law monitoring for ongoing fraud detection.');

  return recommendations;
}

/**
 * Generate executive summary
 */
function generateExecutiveSummary(result: BenfordResult): string {
  const riskDescriptions = {
    critical: 'significant compliance issues requiring immediate attention',
    high: 'notable deviations suggesting possible irregularities',
    medium: 'moderate deviations that warrant monitoring',
    low: 'good compliance with expected patterns'
  };

  const flaggedVendorCount = result.suspiciousVendors.length;
  const flaggedTransactionCount = result.flaggedTransactions.length;
  const compliancePercentage = ((result.totalAnalyzed - flaggedTransactionCount) / result.totalAnalyzed * 100);

  return `Analysis of ${result.totalAnalyzed.toLocaleString()} transactions reveals ${riskDescriptions[result.riskLevel]} (MAD: ${result.mad.toFixed(3)}). ` +
    `${compliancePercentage.toFixed(1)}% of transactions follow expected patterns, while ` +
    `${flaggedVendorCount} vendor${flaggedVendorCount !== 1 ? 's' : ''} and ${flaggedTransactionCount} transaction${flaggedTransactionCount !== 1 ? 's' : ''} require review. ` +
    `${result.riskLevel === 'critical' || result.riskLevel === 'high' ? 'Immediate investigation recommended.' : 'Continued monitoring advised.'}`;
}

/**
 * Main function to generate comprehensive AI summary
 */
export function generateAISummary(result: BenfordResult, dataset: ProcessedDataset): AnalysisSummary {
  // Generate executive summary
  const executiveSummary = generateExecutiveSummary(result);
  
  // Overall findings based on statistical measures
  const overallFindings: string[] = [];
  
  // MAD Score interpretation
  if (result.mad < 0.6) {
    overallFindings.push(`Excellent compliance: MAD score of ${result.mad.toFixed(2)}% indicates data closely follows Benford's Law.`);
  } else if (result.mad < 1.2) {
    overallFindings.push(`Good compliance: MAD score of ${result.mad.toFixed(2)}% shows acceptable deviation from expected patterns.`);
  } else if (result.mad < 2.2) {
    overallFindings.push(`Concerning patterns: MAD score of ${result.mad.toFixed(2)}% suggests potential data manipulation.`);
  } else {
    overallFindings.push(`Significant deviations: MAD score of ${result.mad.toFixed(2)}% strongly indicates irregular patterns requiring investigation.`);
  }

  // Chi-square interpretation
  if (result.chiSquare > 15.51) {
    overallFindings.push(`Chi-square statistic of ${result.chiSquare.toFixed(2)} exceeds critical threshold, confirming significant deviation from natural patterns.`);
  } else {
    overallFindings.push(`Chi-square statistic of ${result.chiSquare.toFixed(2)} within acceptable range for natural data variation.`);
  }

  // Digit distribution insights
  const mostDeviantDigit = result.digitFrequencies.reduce((max, freq) => 
    freq.deviation > max.deviation ? freq : max
  );
  
  if (mostDeviantDigit.deviation > 5) {
    overallFindings.push(`Digit ${mostDeviantDigit.digit} shows the largest deviation (${mostDeviantDigit.deviation.toFixed(1)}% vs expected ${mostDeviantDigit.expected}%), appearing in ${mostDeviantDigit.observed.toFixed(1)}% of transactions.`);
  }

  // Generate specific insights
  const vendorInsights = generateVendorInsights(result);
  const transactionInsights = generateTransactionInsights(result);
  const timeBasedInsights = analyzeTemporalPatterns(dataset.data);
  const recommendations = generateRecommendations(result);

  // Calculate confidence score
  let confidence = 85; // Base confidence
  if (result.totalAnalyzed < 50) confidence -= 20;
  else if (result.totalAnalyzed < 100) confidence -= 10;
  
  if (result.warnings.length > 2) confidence -= 15;
  if (result.mad > 2.2) confidence += 10; // High confidence in flagging serious issues
  
  confidence = Math.max(60, Math.min(95, confidence)); // Clamp between 60-95%

  // Format key metrics
  const keyMetrics = {
    totalTransactions: `${result.totalAnalyzed.toLocaleString()} transactions analyzed`,
    complianceScore: `${Math.max(0, 100 - result.mad).toFixed(0)}% compliance score`,
    flaggedVendors: `${result.suspiciousVendors.length} vendor${result.suspiciousVendors.length !== 1 ? 's' : ''} flagged`,
    suspiciousTransactions: `${result.flaggedTransactions.length} transaction${result.flaggedTransactions.length !== 1 ? 's' : ''} flagged`
  };

  return {
    executiveSummary,
    overallFindings,
    vendorInsights,
    transactionInsights,
    timeBasedInsights,
    recommendations,
    riskAssessment: {
      level: result.riskLevel,
      description: `${result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1)} risk level based on statistical analysis`,
      confidence
    },
    keyMetrics
  };
}
