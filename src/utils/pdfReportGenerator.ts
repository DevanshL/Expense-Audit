// Professional PDF Report Generator — Fintech & Premium Consulting Style
// ExpenseAudit AI — Benford's Law Forensic Report

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BenfordResult, ProcessedDataset } from '../types';
import type { AnalysisSummary } from './aiSummary';
import type { GeminiSummary } from './geminiIntegration';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

export interface ReportConfig {
  includeCharts: boolean;
  includeRawData: boolean;
  includeAISummary: boolean;
  includeMetadata: boolean;
  reportTitle?: string;
  organizationName?: string;
  auditorName?: string;
}

export interface ReportMetadata {
  reportId: string;
  generatedAt: Date;
  version: string;
  datasetHash: string;
  analysisEngine: string;
}

// ── Modern Brand Colors (Tailwind Slate & Indigo inspired) ────────────────────
const BRAND = {
  navy:    [15,  23,  42]  as [number, number, number], // Slate 900 (Deep, elegant navy)
  accent:  [79,  70,  229] as [number, number, number], // Indigo 600 (Vibrant accent)
  gray:    [100, 116, 139] as [number, number, number], // Slate 500 (Text gray)
  light:   [248, 250, 252] as [number, number, number], // Slate 50 (Sleek container background)
  white:   [255, 255, 255] as [number, number, number],
  border:  [226, 232, 240] as [number, number, number], // Slate 200 (Clean divider lines)
};

const RISK_COLORS: Record<string, { bg: [number,number,number]; text: [number,number,number]; border: [number,number,number] }> = {
  low:      { bg: [240, 253, 244], text: [21,  128, 61 ], border: [187, 247, 208] }, // Emerald 50 / 700 / 200
  medium:   { bg: [255, 251, 235], text: [180, 83,  9  ], border: [254, 243, 199] }, // Amber 50 / 700 / 200
  high:     { bg: [255, 247, 237], text: [194, 65,  12 ], border: [255, 237, 213] }, // Orange 50 / 700 / 200
  critical: { bg: [254, 242, 242], text: [185, 28,  28 ], border: [254, 226, 226] }, // Red 50 / 700 / 200
};

// ── Layout Helpers ───────────────────────────────────────────────────────────

function setColor(pdf: jsPDF, color: [number,number,number], type: 'fill' | 'draw' | 'text') {
  if (type === 'fill') pdf.setFillColor(color[0], color[1], color[2]);
  else if (type === 'draw') pdf.setDrawColor(color[0], color[1], color[2]);
  else pdf.setTextColor(color[0], color[1], color[2]);
}

function sectionHeader(pdf: jsPDF, title: string, y: number): number {
  y = checkPageBreak(pdf, y, 22);
  
  // Indigo left vertical accent bar
  setColor(pdf, BRAND.accent, 'fill');
  pdf.rect(20, y, 3, 7, 'F');
  
  // Section Title
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  setColor(pdf, BRAND.navy, 'text');
  pdf.text(title.toUpperCase(), 26, y + 5.5);
  
  // Underline
  setColor(pdf, BRAND.border, 'draw');
  pdf.setLineWidth(0.4);
  pdf.line(20, y + 9, pdf.internal.pageSize.width - 20, y + 9);
  
  return y + 16;
}

function divider(pdf: jsPDF, y: number): number {
  setColor(pdf, BRAND.border, 'draw');
  pdf.setLineWidth(0.3);
  pdf.line(20, y, pdf.internal.pageSize.width - 20, y);
  return y + 6;
}

export function labelValue(pdf: jsPDF, label: string, value: string, x: number, y: number, valueX: number): number {
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'bold');
  setColor(pdf, BRAND.gray, 'text');
  pdf.text(label, x, y);
  pdf.setFont('helvetica', 'normal');
  setColor(pdf, [51,65,85], 'text');
  pdf.text(value, valueX, y);
  return y + 6.5;
}

export function riskBadge(pdf: jsPDF, level: string, x: number, y: number, w = 32, h = 8) {
  const c = RISK_COLORS[level] || RISK_COLORS.medium;
  setColor(pdf, c.bg, 'fill');
  setColor(pdf, c.border, 'draw');
  pdf.setLineWidth(0.5);
  pdf.roundedRect(x, y - h + 2, w, h, 1.5, 1.5, 'FD');
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'bold');
  setColor(pdf, c.text, 'text');
  pdf.text(level.toUpperCase(), x + w / 2, y - 0.5, { align: 'center' });
  setColor(pdf, [0,0,0], 'text');
}

function pageHeader(pdf: jsPDF, reportId: string) {
  const W = pdf.internal.pageSize.width;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  setColor(pdf, BRAND.gray, 'text');
  pdf.text('EXPENSEAUDIT AI  |  FORENSIC REPORT', 20, 15);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Report ID: ${reportId}`, W - 20, 15, { align: 'right' });
  
  // Thin header rule
  setColor(pdf, BRAND.border, 'draw');
  pdf.setLineWidth(0.3);
  pdf.line(20, 18, W - 20, 18);
}

function pageFooter(pdf: jsPDF, pageNum: number, total: number) {
  const W = pdf.internal.pageSize.width;
  const H = pdf.internal.pageSize.height;
  setColor(pdf, BRAND.border, 'draw');
  pdf.setLineWidth(0.3);
  pdf.line(20, H - 15, W - 20, H - 15);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  setColor(pdf, BRAND.gray, 'text');
  pdf.text('CONFIDENTIAL  —  EXPENSEAUDIT FORENSIC ANALYSIS', 20, H - 10);
  pdf.text(`Page ${pageNum} of ${total}`, W - 20, H - 10, { align: 'right' });
}

function checkPageBreak(pdf: jsPDF, y: number, needed = 20): number {
  if (y + needed > pdf.internal.pageSize.height - 20) {
    pdf.addPage();
    return 20;
  }
  return y;
}

// ── Benford's Law Bar Chart (Modern Vector Design) ───────────────────────────

function drawBenfordChart(pdf: jsPDF, result: BenfordResult, x: number, y: number, w: number, h: number): number {
  const digits = result.digitFrequencies;
  const maxVal = 35;
  const barW = (w - 25) / 9;
  const chartH = h - 28;
  const chartY = y + 10;
  const chartX = x + 15;

  // Background panel with soft rounded border
  setColor(pdf, BRAND.light, 'fill');
  setColor(pdf, BRAND.border, 'draw');
  pdf.setLineWidth(0.4);
  pdf.roundedRect(x, y, w, h, 3, 3, 'FD');

  // Y-axis grid lines
  pdf.setLineWidth(0.2);
  [0, 10, 20, 30].forEach(val => {
    const lineY = chartY + chartH - (val / maxVal) * chartH;
    setColor(pdf, BRAND.border, 'draw');
    pdf.line(chartX, lineY, chartX + barW * 9, lineY);
    pdf.setFontSize(6.5);
    setColor(pdf, BRAND.gray, 'text');
    pdf.text(`${val}%`, chartX - 8, lineY + 1, { align: 'right' });
  });

  // Bars
  digits.forEach((freq, i) => {
    const bx = chartX + i * barW + barW * 0.12;
    const bw = barW * 0.35;

    // Expected bar (Navy)
    const expH = (freq.expected / maxVal) * chartH;
    setColor(pdf, BRAND.navy, 'fill');
    pdf.rect(bx, chartY + chartH - expH, bw, expH, 'F');

    // Observed bar (Indigo or Coral if deviant)
    const obsH = (freq.observed / maxVal) * chartH;
    const isDeviant = freq.deviation > 5;
    setColor(pdf, isDeviant ? [239, 68, 68] : BRAND.accent, 'fill');
    pdf.rect(bx + bw + 1.2, chartY + chartH - obsH, bw, obsH, 'F');

    // Digit label
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    setColor(pdf, BRAND.navy, 'text');
    pdf.text(freq.digit.toString(), bx + bw, chartY + chartH + 5, { align: 'center' });
  });

  // Legend panel
  const legendY = y + h - 8;
  pdf.setFont('helvetica', 'normal');
  
  setColor(pdf, BRAND.navy, 'fill');
  pdf.rect(x + 15, legendY, 5, 3.5, 'F');
  pdf.setFontSize(7);
  setColor(pdf, BRAND.gray, 'text');
  pdf.text('Expected (Benford)', x + 23, legendY + 2.8);

  setColor(pdf, BRAND.accent, 'fill');
  pdf.rect(x + 70, legendY, 5, 3.5, 'F');
  pdf.text('Observed', x + 78, legendY + 2.8);

  setColor(pdf, [239, 68, 68], 'fill');
  pdf.rect(x + 115, legendY, 5, 3.5, 'F');
  pdf.text('Significant Deviation (>5%)', x + 123, legendY + 2.8);

  return y + h + 8;
}

// ── Risk Gauge Segments ──────────────────────────────────────────────────────

function drawRiskGauge(pdf: jsPDF, level: string, x: number, y: number): void {
  const segments = [
    { color: [34, 197, 94]  as [number,number,number], label: 'Low' },
    { color: [251, 191, 36] as [number,number,number], label: 'Medium' },
    { color: [249, 115, 22] as [number,number,number], label: 'High' },
    { color: [239, 68,  68] as [number,number,number], label: 'Critical' },
  ];
  const levels = ['low', 'medium', 'high', 'critical'];
  const idx = levels.indexOf(level);
  const segW = 39;
  const segH = 9;

  segments.forEach((seg, i) => {
    const rx = x + i * (segW + 4);
    setColor(pdf, i === idx ? seg.color : [241, 245, 249] as [number,number,number], 'fill');
    setColor(pdf, i === idx ? seg.color : [226, 232, 240] as [number,number,number], 'draw');
    pdf.setLineWidth(0.5);
    pdf.roundedRect(rx, y, segW, segH, 1.5, 1.5, 'FD');
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    setColor(pdf, i === idx ? [255,255,255] as [number,number,number] : [148, 163, 184] as [number,number,number], 'text');
    pdf.text(seg.label.toUpperCase(), rx + segW / 2, y + 6.3, { align: 'center' });
  });
}

// ── Main PDF Generation ──────────────────────────────────────────────────────

export async function generatePDFReport(
  result: BenfordResult,
  dataset: ProcessedDataset,
  aiSummary: AnalysisSummary,
  geminiSummary?: GeminiSummary | null,
  config: ReportConfig = {
    includeCharts: true,
    includeRawData: false,
    includeAISummary: true,
    includeMetadata: true,
  }
): Promise<void> {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = pdf.internal.pageSize.width;
  const H = pdf.internal.pageSize.height;

  const metadata: ReportMetadata = {
    reportId: generateReportId(),
    generatedAt: new Date(),
    version: '2.0',
    datasetHash: generateDatasetHash(dataset),
    analysisEngine: "ExpenseAudit AI Benford's Law Forensic Engine"
  };

  // ── Page 1: Cover Page ──────────────────────────────────────────────────────
  // Left vertical navy bar (Stripe / McKinsey consulting style)
  setColor(pdf, BRAND.navy, 'fill');
  pdf.rect(0, 0, 10, H, 'F');

  // Top right light geometric corner accent
  setColor(pdf, BRAND.light, 'fill');
  pdf.triangle(W - 60, 0, W, 0, W, 60, 'F');

  // Platform Name
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  setColor(pdf, BRAND.accent, 'text');
  pdf.text('EXPENSEAUDIT AI', 25, 25);

  // Accent divider line
  setColor(pdf, BRAND.border, 'draw');
  pdf.setLineWidth(0.5);
  pdf.line(25, 28, 65, 28);

  // Document Title
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  setColor(pdf, BRAND.navy, 'text');
  const title = config.reportTitle || 'Forensic Audit Report';
  pdf.text(title, 25, 45);

  // Subtitle
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  setColor(pdf, BRAND.gray, 'text');
  pdf.text("Benford's Law Financial Risk Assessment", 25, 53);

  // Risk Rating Container Banner
  const rc = RISK_COLORS[result.riskLevel] || RISK_COLORS.medium;
  setColor(pdf, rc.bg, 'fill');
  setColor(pdf, rc.border, 'draw');
  pdf.setLineWidth(0.8);
  pdf.roundedRect(25, 68, W - 45, 22, 3, 3, 'FD');

  // Left solid colored risk indicator block
  setColor(pdf, rc.text, 'fill');
  pdf.rect(25, 68, 4, 22, 'F');

  // Risk Title
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'bold');
  setColor(pdf, rc.text, 'text');
  pdf.text('OVERALL AUDIT RISK EXPOSURE', 34, 76);

  // Risk Status
  pdf.setFontSize(13);
  pdf.text(`${result.riskLevel.toUpperCase()} LEVEL  —  ${result.overallAssessment.replace(/_/g, ' ').toUpperCase()}`, 34, 84);

  // Horizontal Risk Segment Gauge
  drawRiskGauge(pdf, result.riskLevel, 25, 98);

  // Premium Key Statistics Grid Container
  const statsY = 118;
  setColor(pdf, BRAND.light, 'fill');
  setColor(pdf, BRAND.border, 'draw');
  pdf.setLineWidth(0.3);
  pdf.roundedRect(25, statsY, W - 45, 52, 3, 3, 'FD');

  const stats = [
    ['Transactions Analyzed', result.totalAnalyzed.toLocaleString()],
    ['MAD Score', result.mad.toFixed(4)],
    ['Chi-Square', result.chiSquare.toFixed(2)],
    ['Suspicious Vendors', result.suspiciousVendors.length.toString()],
    ['Flagged Transactions', result.flaggedTransactions.length.toString()],
    ['Confidence Level', `${aiSummary.riskAssessment.confidence}%`],
  ];

  stats.forEach(([label, value], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const sx = 33 + col * 55;
    const sy = statsY + 12 + row * 23;

    // Label
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    setColor(pdf, BRAND.gray, 'text');
    pdf.text(label.toUpperCase(), sx, sy);

    // Value
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    setColor(pdf, BRAND.navy, 'text');
    pdf.text(value, sx, sy + 8);
  });

  // Metadata Box
  let detailsY = 186;
  pdf.setFontSize(8);
  
  const details = [
    ['Report Identifier', metadata.reportId],
    ['Generated Timestamp', metadata.generatedAt.toLocaleString()],
    ['Analysis Engine', metadata.analysisEngine],
    ['Audit Representative', config.auditorName || 'System Generated'],
  ];

  if (config.organizationName) {
    details.unshift(['Target Organization', config.organizationName]);
  }

  details.forEach(([l, v]) => {
    pdf.setFont('helvetica', 'bold');
    setColor(pdf, BRAND.gray, 'text');
    pdf.text(l.toUpperCase() + ':', 25, detailsY);

    pdf.setFont('helvetica', 'normal');
    setColor(pdf, BRAND.navy, 'text');
    pdf.text(v, 65, detailsY);
    detailsY += 6.5;
  });

  // Footer Disclaimer
  detailsY += 2;
  pdf.setFontSize(7);
  setColor(pdf, BRAND.gray, 'text');
  const disc = "CONFIDENTIAL — This report is generated through automated forensic statistical models and Benford's Law compliance auditing. It represents high-integrity probabilistic indicators and should be evaluated in accordance with standard financial audit and compliance procedures. Not a formal declaration of fraud.";
  pdf.text(pdf.splitTextToSize(disc, W - 45), 25, detailsY);

  // ── Page 2: Executive Summary ───────────────────────────────────────────────
  pdf.addPage();
  pageHeader(pdf, metadata.reportId);
  let y = 25;
  y = sectionHeader(pdf, '1. Executive Summary', y);

  // Summary Paragraph
  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'normal');
  setColor(pdf, [51,65,85], 'text');
  const execText = pdf.splitTextToSize(aiSummary.executiveSummary, W - 40);
  pdf.text(execText, 20, y);
  y += execText.length * 5 + 8;

  y = divider(pdf, y);

  // Key Findings
  pdf.setFontSize(10.5);
  pdf.setFont('helvetica', 'bold');
  setColor(pdf, BRAND.navy, 'text');
  pdf.text('Key Observations & Findings', 20, y);
  y += 7;
  pdf.setFont('helvetica', 'normal');
  setColor(pdf, [51,65,85], 'text');
  aiSummary.overallFindings.forEach(finding => {
    y = checkPageBreak(pdf, y, 12);
    const cleaned = finding.replace(/\*\*/g, '');
    const lines = pdf.splitTextToSize(`•  ${cleaned}`, W - 40);
    pdf.setFontSize(9);
    pdf.text(lines, 20, y);
    y += lines.length * 5 + 3.5;
  });

  y = divider(pdf, y + 4);

  // Vendor Insights
  if (aiSummary.vendorInsights.length > 0) {
    pdf.setFontSize(10.5);
    pdf.setFont('helvetica', 'bold');
    setColor(pdf, BRAND.navy, 'text');
    pdf.text('Vendor Observations', 20, y);
    y += 7;
    pdf.setFont('helvetica', 'normal');
    setColor(pdf, [51,65,85], 'text');
    aiSummary.vendorInsights.slice(0, 4).forEach(insight => {
      y = checkPageBreak(pdf, y, 12);
      const cleaned = insight.replace(/\*\*/g, '');
      const lines = pdf.splitTextToSize(`•  ${cleaned}`, W - 40);
      pdf.setFontSize(9);
      pdf.text(lines, 20, y);
      y += lines.length * 5 + 3.5;
    });
  }

  // Recommendations
  y = checkPageBreak(pdf, y + 6, 32);
  y = divider(pdf, y);
  pdf.setFontSize(10.5);
  pdf.setFont('helvetica', 'bold');
  setColor(pdf, BRAND.navy, 'text');
  pdf.text('Audit Recommendations', 20, y);
  y += 7;
  pdf.setFont('helvetica', 'normal');
  setColor(pdf, [51,65,85], 'text');
  aiSummary.recommendations.forEach((rec, i) => {
    y = checkPageBreak(pdf, y, 12);
    const cleaned = rec.replace(/\*\*/g, '');
    const lines = pdf.splitTextToSize(`${i + 1}.  ${cleaned}`, W - 40);
    pdf.setFontSize(9);
    pdf.text(lines, 20, y);
    y += lines.length * 5 + 3.5;
  });

  // ── Page 3: Statistical Analysis & Chart ────────────────────────────────────
  pdf.addPage();
  pageHeader(pdf, metadata.reportId);
  y = 25;
  y = sectionHeader(pdf, '2. Statistical Analysis — First Digit Distribution', y);

  // Explanatory Introduction
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  setColor(pdf, [71, 85, 105], 'text');
  const benfordExp = "Benford's Law predicts that in naturally occurring financial transactions, the leading digit 1 appears ~30.1% of the time, decreasing logarithmically to digit 9 at ~4.6%. Significant statistical deviations from this distribution are key forensic indicators of manual transaction fabrication, systemic rounding anomalies, or data entry manipulation.";
  pdf.text(pdf.splitTextToSize(benfordExp, W - 40), 20, y);
  y += 18;

  // Interp Cards
  const madInterp = getMadInterpretation(result.mad);
  setColor(pdf, BRAND.light, 'fill');
  setColor(pdf, BRAND.border, 'draw');
  pdf.setLineWidth(0.4);
  pdf.roundedRect(20, y, W - 40, 20, 2, 2, 'FD');
  
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'bold');
  setColor(pdf, BRAND.navy, 'text');
  pdf.text(`Mean Absolute Deviation (MAD): ${result.mad.toFixed(4)}`, 26, y + 7);
  pdf.setFont('helvetica', 'normal');
  setColor(pdf, BRAND.gray, 'text');
  pdf.text(madInterp, 26, y + 14);

  pdf.setFont('helvetica', 'bold');
  setColor(pdf, BRAND.navy, 'text');
  pdf.text(`Chi-Square: ${result.chiSquare.toFixed(2)}`, 112, y + 7);
  pdf.setFont('helvetica', 'normal');
  setColor(pdf, BRAND.gray, 'text');
  pdf.text(getChiSquareInterpretation(result.chiSquare), 112, y + 14);
  y += 28;

  // Bar Chart
  if (config.includeCharts) {
    y = drawBenfordChart(pdf, result, 20, y, W - 40, 70);
  }

  // Digit table
  y = checkPageBreak(pdf, y, 60);
  const tableData = result.digitFrequencies.map(freq => {
    const dev = freq.deviation;
    return [
      freq.digit.toString(),
      `${freq.expected.toFixed(1)}%`,
      `${freq.observed.toFixed(1)}%`,
      freq.count.toLocaleString(),
      `${freq.observed > freq.expected ? '+' : '-'}${Math.abs(dev).toFixed(1)}%`,
      dev > 10 ? 'HIGH' : dev > 5 ? 'MODERATE' : 'NORMAL'
    ];
  });

  autoTable(pdf, {
    startY: y,
    head: [['Digit', 'Expected Frequency', 'Observed Frequency', 'Total Count', 'Deviation', 'Alert Status']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 3, textColor: [51,65,85] },
    headStyles: { fillColor: BRAND.navy, textColor: [255,255,255], fontStyle: 'bold', fontSize: 8.5 },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', textColor: BRAND.navy },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'center' },
      5: { halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === 'body') {
        const val = data.cell.raw as string;
        if (val === 'HIGH') {
          data.cell.styles.fillColor = RISK_COLORS.critical.bg;
          data.cell.styles.textColor = RISK_COLORS.critical.text;
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'MODERATE') {
          data.cell.styles.fillColor = RISK_COLORS.medium.bg;
          data.cell.styles.textColor = RISK_COLORS.medium.text;
          data.cell.styles.fontStyle = 'bold';
        }
      }
      if (data.column.index === 4 && data.section === 'body') {
        const val = parseFloat(data.cell.raw as string);
        if (Math.abs(val) > 10) data.cell.styles.textColor = [220, 38, 38];
        else if (Math.abs(val) > 5) data.cell.styles.textColor = [217, 119, 6];
      }
    }
  });

  y = (pdf.lastAutoTable?.finalY || y + 75) + 12;

  // ── Page 4: Vendor Risk Analysis ────────────────────────────────────────────
  pdf.addPage();
  pageHeader(pdf, metadata.reportId);
  y = 25;
  y = sectionHeader(pdf, '3. Vendor Risk Analysis', y);

  if (result.suspiciousVendors.length === 0) {
    setColor(pdf, BRAND.light, 'fill');
    setColor(pdf, BRAND.border, 'draw');
    pdf.roundedRect(20, y, W - 40, 16, 2, 2, 'FD');
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'normal');
    setColor(pdf, BRAND.gray, 'text');
    pdf.text("No suspicious vendors flagged. All analyzed vendors conform closely to expected Benford's Law distribution.", 20 + (W - 40) / 2, y + 9.5, { align: 'center' });
    y += 24;
  } else {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    setColor(pdf, [71, 85, 105], 'text');
    pdf.text(`${result.suspiciousVendors.length} vendor(s) show statistically abnormal transaction patterns. Ranked by Mean Absolute Deviation (MAD) score.`, 20, y);
    y += 9;

    const vendorData = result.suspiciousVendors.slice(0, 20).map((v, i) => [
      (i + 1).toString(),
      v.vendor.length > 32 ? v.vendor.substring(0, 30) + '…' : v.vendor,
      v.transactionCount.toLocaleString(),
      v.mad.toFixed(3),
      v.riskLevel.toUpperCase(),
      (v.suspiciousPatterns || []).slice(0, 1).join('; ') || 'Frequency Anomaly'
    ]);

    autoTable(pdf, {
      startY: y,
      head: [['#', 'Vendor Name', 'Transaction Count', 'MAD Score', 'Risk Level', 'Primary Signature Pattern']],
      body: vendorData,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 3, textColor: [51,65,85] },
      headStyles: { fillColor: [194, 65, 12], textColor: [255,255,255], fontStyle: 'bold' },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 55, fontStyle: 'bold', textColor: BRAND.navy },
        2: { halign: 'center', cellWidth: 28 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 22 },
      },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          const val = (data.cell.raw as string).toLowerCase();
          if (RISK_COLORS[val]) {
            data.cell.styles.fillColor = RISK_COLORS[val].bg;
            data.cell.styles.textColor = RISK_COLORS[val].text;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    y = (pdf.lastAutoTable?.finalY || y + 95) + 12;
  }

  // ── Page 5: Flagged Transactions ─────────────────────────────────────────────
  y = checkPageBreak(pdf, y, 40);
  if (y < 40) { pdf.addPage(); pageHeader(pdf, metadata.reportId); y = 25; }
  y = sectionHeader(pdf, '4. Flagged Individual Transactions', y);

  if (result.flaggedTransactions.length === 0) {
    setColor(pdf, BRAND.light, 'fill');
    setColor(pdf, BRAND.border, 'draw');
    pdf.roundedRect(20, y, W - 40, 16, 2, 2, 'FD');
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'normal');
    setColor(pdf, BRAND.gray, 'text');
    pdf.text('No individual transactions flagged for review in this run.', 20 + (W-40)/2, y + 9.5, { align: 'center' });
    y += 24;
  } else {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    setColor(pdf, [71, 85, 105], 'text');
    const flagPct = ((result.flaggedTransactions.length / result.totalAnalyzed) * 100).toFixed(1);
    pdf.text(`${result.flaggedTransactions.length} transactions flagged (${flagPct}% of total). Showing top 25 high-risk records.`, 20, y);
    y += 9;

    const txData = result.flaggedTransactions.slice(0, 25).map(t => [
      `$${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      t.vendor || 'Unknown Vendor',
      t.firstDigit?.toString() || '—',
      t.riskLevel.toUpperCase(),
      t.reason.length > 50 ? t.reason.substring(0, 48) + '…' : t.reason
    ]);

    autoTable(pdf, {
      startY: y,
      head: [['Transaction Amount', 'Vendor / Counterparty', 'Lead Digit', 'Risk Level', 'Auditing Reason for Flag']],
      body: txData,
      theme: 'striped',
      styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [51,65,85] },
      headStyles: { fillColor: [157, 23, 77], textColor: [255,255,255], fontStyle: 'bold' },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { halign: 'right', cellWidth: 28, fontStyle: 'bold', textColor: BRAND.navy },
        1: { cellWidth: 45 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 22 },
      },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.section === 'body') {
          const val = (data.cell.raw as string).toLowerCase();
          if (RISK_COLORS[val]) {
            data.cell.styles.fillColor = RISK_COLORS[val].bg;
            data.cell.styles.textColor = RISK_COLORS[val].text;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    y = (pdf.lastAutoTable?.finalY || y + 95) + 12;
  }

  // ── Page 6: AI Powered Insights ─────────────────────────────────────────────
  if (config.includeAISummary) {
    pdf.addPage();
    pageHeader(pdf, metadata.reportId);
    y = 25;
    y = sectionHeader(pdf, '5. AI-Powered Forensic Insights', y);

    if (geminiSummary) {
      // Platform Label Card
      setColor(pdf, BRAND.light, 'fill');
      setColor(pdf, BRAND.border, 'draw');
      pdf.setLineWidth(0.4);
      pdf.roundedRect(20, y, W - 40, 7.5, 1.5, 1.5, 'FD');
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      setColor(pdf, BRAND.accent, 'text');
      pdf.text(`AI ENGINE: ${geminiSummary.provider?.toUpperCase() || 'LOCAL AI'} (${geminiSummary.model || 'Llama 3.2'}) — FORENSIC DEEP-DIVE`, 26, y + 5);
      y += 12;

      // Executive Summary
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      setColor(pdf, [51,65,85], 'text');
      const gExec = pdf.splitTextToSize(geminiSummary.executiveSummary || '', W - 40);
      pdf.text(gExec, 20, y);
      y += gExec.length * 5 + 8;

      // Risk assessment
      if (geminiSummary.riskAssessment) {
        y = divider(pdf, y);
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'bold');
        setColor(pdf, BRAND.navy, 'text');
        pdf.text('Narrative Risk Assessment', 20, y);
        y += 6;
        pdf.setFont('helvetica', 'normal');
        setColor(pdf, [51,65,85], 'text');
        const raText = pdf.splitTextToSize(geminiSummary.riskAssessment, W - 40);
        pdf.setFontSize(9);
        pdf.text(raText, 20, y);
        y += raText.length * 4.8 + 8;
      }

      // Key findings
      if (geminiSummary.keyFindings?.length > 0) {
        y = checkPageBreak(pdf, y, 20);
        y = divider(pdf, y);
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'bold');
        setColor(pdf, BRAND.navy, 'text');
        pdf.text('AI Observations & Statistical Anomalies', 20, y);
        y += 7;
        geminiSummary.keyFindings.slice(0, 6).forEach(finding => {
          y = checkPageBreak(pdf, y, 12);
          const cleaned = finding.replace(/^\.\s*/, '').replace(/\*\*/g, '');
          const lines = pdf.splitTextToSize(`•  ${cleaned}`, W - 40);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8.5);
          setColor(pdf, [51,65,85], 'text');
          pdf.text(lines, 20, y);
          y += lines.length * 4.5 + 3;
        });
      }

      // Recommendations
      if (geminiSummary.recommendedActions?.length > 0) {
        y = checkPageBreak(pdf, y + 4, 30);
        y = divider(pdf, y);
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'bold');
        setColor(pdf, BRAND.navy, 'text');
        pdf.text('AI Prescriptive Actions & Mitigations', 20, y);
        y += 7;
        geminiSummary.recommendedActions.slice(0, 6).forEach((rec, i) => {
          y = checkPageBreak(pdf, y, 12);
          const cleaned = rec.replace(/^\.\s*/, '').replace(/\*\*/g, '');
          const lines = pdf.splitTextToSize(`${i + 1}.  ${cleaned}`, W - 40);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8.5);
          setColor(pdf, [51,65,85], 'text');
          pdf.text(lines, 20, y);
          y += lines.length * 4.5 + 3;
        });
      }
    } else {
      // Fallback AI Report style
      pdf.setFont('helvetica', 'bold');
      setColor(pdf, BRAND.navy, 'text');
      pdf.text('AI Narrative Analysis Summary', 20, y);
      y += 7;
      pdf.setFont('helvetica', 'normal');
      setColor(pdf, [51,65,85], 'text');
      const execLines = pdf.splitTextToSize(aiSummary.executiveSummary, W - 40);
      pdf.setFontSize(9);
      pdf.text(execLines, 20, y);
      y += execLines.length * 5 + 8;

      y = divider(pdf, y);

      // Key findings
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'bold');
      setColor(pdf, BRAND.navy, 'text');
      pdf.text('Identified Anomalies', 20, y);
      y += 7;
      aiSummary.overallFindings.forEach(f => {
        y = checkPageBreak(pdf, y, 12);
        const lines = pdf.splitTextToSize(`•  ${f.replace(/\*\*/g,'')}`, W - 40);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        setColor(pdf, [51,65,85], 'text');
        pdf.text(lines, 20, y);
        y += lines.length * 4.5 + 3;
      });

      y = divider(pdf, y + 4);

      // Transaction insights
      if (aiSummary.transactionInsights.length > 0) {
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'bold');
        setColor(pdf, BRAND.navy, 'text');
        pdf.text('Transaction Insights', 20, y);
        y += 7;
        aiSummary.transactionInsights.forEach(t => {
          y = checkPageBreak(pdf, y, 12);
          const lines = pdf.splitTextToSize(`•  ${t.replace(/\*\*/g,'')}`, W - 40);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8.5);
          setColor(pdf, [51,65,85], 'text');
          pdf.text(lines, 20, y);
          y += lines.length * 4.5 + 3;
        });
        y = divider(pdf, y + 4);
      }

      // Recommendations
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'bold');
      setColor(pdf, BRAND.navy, 'text');
      pdf.text('Recommended Auditing Interventions', 20, y);
      y += 7;
      aiSummary.recommendations.forEach((rec, i) => {
        y = checkPageBreak(pdf, y, 12);
        const lines = pdf.splitTextToSize(`${i+1}.  ${rec.replace(/\*\*/g,'')}`, W - 40);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        setColor(pdf, [51,65,85], 'text');
        pdf.text(lines, 20, y);
        y += lines.length * 4.5 + 3;
      });

      // Narrative Assessment
      y = checkPageBreak(pdf, y + 6, 20);
      y = divider(pdf, y);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'bold');
      setColor(pdf, BRAND.navy, 'text');
      pdf.text('Narrative Risk Assessment', 20, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      setColor(pdf, [51,65,85], 'text');
      const riskLines = pdf.splitTextToSize(
        `${aiSummary.riskAssessment.description}. The computational algorithm reports a statistical confidence profile of ${aiSummary.riskAssessment.confidence}%.`, 
        W - 40
      );
      pdf.setFontSize(8.5);
      pdf.text(riskLines, 20, y);
      y += riskLines.length * 5;
    }
  }

  // ── Page 7: Metadata & Audit Trail ──────────────────────────────────────────
  if (config.includeMetadata) {
    pdf.addPage();
    pageHeader(pdf, metadata.reportId);
    y = 25;
    y = sectionHeader(pdf, '6. Audit Trail & Verification Metadata', y);

    const metaRows = [
      ['Report Identifier', metadata.reportId],
      ['Generated At', metadata.generatedAt.toISOString()],
      ['Metadata Compliance Schema', metadata.version],
      ['Core Analysis Engine', metadata.analysisEngine],
      ['Dataset Cryptographic Hash', metadata.datasetHash],
      ['Total Records Audited', dataset.preview.totalRows.toLocaleString()],
      ['Valid Records Parsed', dataset.validation.validRows.toLocaleString()],
      ['Anomalous Records Dropped', dataset.validation.removedRows.toLocaleString()],
      ['Input Data Quality Metric', `${((dataset.validation.validRows / dataset.preview.totalRows) * 100).toFixed(1)}%`],
      ['Compliance Framework', "Benford's Law Forensic Standard"],
      ['Authorized Auditor', config.auditorName || 'System Generated'],
    ];

    autoTable(pdf, {
      startY: y,
      head: [['System Metadata Property', 'Compliance Audit Log Value']],
      body: metaRows,
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 3, textColor: [51,65,85] },
      headStyles: { fillColor: BRAND.navy, textColor: [255,255,255], fontStyle: 'bold' },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55, textColor: BRAND.navy },
        1: { font: 'courier', fontSize: 7.5 }
      }
    });

    y = (pdf.lastAutoTable?.finalY || y + 90) + 12;

    // Red Compliance Warning Disclaimer box
    setColor(pdf, [254, 242, 242], 'fill');
    setColor(pdf, [239, 68, 68], 'draw');
    pdf.setLineWidth(0.5);
    pdf.roundedRect(20, y, W - 40, 26, 2, 2, 'FD');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    setColor(pdf, [153, 27, 27], 'text');
    pdf.text('LEGAL COMPLIANCE DISCLAIMER', 25, y + 7);
    
    pdf.setFont('helvetica', 'normal');
    setColor(pdf, [127, 29, 29], 'text');
    const legalText = "This forensic report is compiled solely through mathematical and statistical anomaly modeling. These computational benchmarks serve as high-integrity risk indicators and must be evaluated by certified audit professionals. Statistical conformity deviations do not constitute definitive evidence of malicious intent or illegal transactions.";
    pdf.text(pdf.splitTextToSize(legalText, W - 50), 25, y + 13);
  }

  // ── Page numbers & footers ───────────────────────────────────────────────────
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    if (i > 1) pageFooter(pdf, i, totalPages);
  }

  // Save
  const filename = `ExpenseAudit_Report_${metadata.reportId}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}

// ── Internal Helpers ─────────────────────────────────────────────────────────

function generateReportId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return `EAI-${ts}-${rand}`.toUpperCase();
}

function generateDatasetHash(dataset: ProcessedDataset): string {
  const input = `${dataset.preview.totalRows}-${dataset.validation.validRows}-${Object.values(dataset.columnMapping).join('')}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

function getMadInterpretation(mad: number): string {
  if (mad < 0.6) return 'Close conformity — data indicates normal and natural behaviors.';
  if (mad < 1.2) return 'Acceptable conformity — standard transaction pattern observed.';
  if (mad < 1.5) return 'Marginal conformity — minor deviation, recommend observation.';
  if (mad < 2.2) return 'Nonconformity — significant deviation, formal auditing recommended.';
  return 'Critical nonconformity — immediate investigation is highly recommended.';
}

function getChiSquareInterpretation(chiSquare: number): string {
  if (chiSquare < 15.51) return 'No statistically significant deviation (p > 0.05)';
  if (chiSquare < 20.09) return 'Moderate statistical deviation detected';
  return 'Significant statistical deviation detected (p < 0.01)';
}