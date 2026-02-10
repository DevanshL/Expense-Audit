# ExpenseAudit AI

A sophisticated financial data analysis tool that uses **Benford's Law** to detect potential fraud or irregularities in expense data. Built with React, TypeScript, and modern web technologies.

# 📈 ExpenseAudit AI – Financial Anomaly Detection Platform

**An AI-powered platform for financial anomaly detection using Benford’s Law, intelligent dashboards, and GPT-generated summaries. Designed for auditors, analysts, and fintech teams to spot fraud fast and explain it even faster.**

---

## 📌 Overview

ExpenseAudit AI is a powerful audit toolkit that automates the process of detecting unusual financial patterns using **Benford's Law**, advanced analytics, and **LLM-generated** executive summaries. Upload your data → get visual anomaly detection + risk-rated reports → download insights in seconds.

---

## ⚙️ Tech Stack

- **Frontend:** React.js, Tailwind CSS  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB  
- **AI Layer:** Gemini / GPT APIs  
- **Visualization:** Chart.js, PDFKit  
- **Authentication:** JWT, Google OAuth  
- **Deployment:** Render, Vercel

---

## 🧠 How It Works

1. Upload transaction datasets (.csv, .xlsx, .json)  
2. System cleans and preprocesses the data  
3. Benford's Law applied to analyze digit distributions  
4. Statistical outliers are flagged with scores  
5. LLM generates summary reports with context  
6. Full PDF audit reports available for export  

---

## 🚀 Features

### ✅ Smart Data Upload & Preprocessing
- 🧩 **Multi-format Support:** CSV, Excel, JSON accepted  
- 🔍 **Auto Column Detection:** Detects Amount, Vendor, Date fields  
- 🧼 **Cleaning Engine:** Normalizes formats & removes invalid entries  
- ⚠️ **Validation System:** Real-time user feedback  
- 👁️‍🗨️ **Preview Table:** View raw and cleaned data side-by-side

---

### 📊 Benford's Law Analysis Engine
- 🔢 **First Digit Extraction:** Analyzes leading digits  
- 📈 **Chi-Square / MAD Stats:** Scores every vendor  
- 🚨 **Suspicious Pattern Detection:** Identifies abnormal vendors  
- 🧾 **Risk Ratings:** Compliant → Suspicious spectrum  
- 📋 **Insightful Reports:** Vendor-level results breakdown

---

### 📉 Interactive Fraud Dashboard
- 🧠 **Risk Cards:** At-a-glance risk scoring  
- 📊 **Digit Distribution Chart:** Interactive graphs with hover stats  
- 🏷️ **Anomaly Table:** Track vendor anomalies  
- 🔎 **Flagged Transactions:** Exportable logs  
- 🌡️ **Heatmaps:** Deviation visuals by digit & vendor

---

### 🤖 AI-Powered Natural Language Summary
- 🗂️ **Rule-based + LLM Analysis:** Clear explanations  
- 🔗 **Gemini/GPT API Integration:** Human-like summaries  
- 🧾 **Executive Summary:** Actionable plain-English output  
- 📡 **Pattern Recognition:** AI surfaces hidden risks  
- 🧠 **Smart Export:** Summaries embedded into reports

---

### 📤 Audit-Grade PDF Reporting
- 📝 **Multi-page PDF Export:** Elegant layout with graphs  
- 🧷 **Custom Branding:** Add logos, firm names  
- 🔁 **Multi-format Export:** CSV, PDF, JSON  
- 📑 **Metadata:** Timestamps and report traceability  
- 🎨 **Rich Layout:** Visual + textual insights combined


## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS for modern, responsive UI
- **Data Processing**: PapaParse (CSV) + SheetJS (Excel)
- **Charts & Visualization**: Recharts for interactive data visualization
- **PDF Generation**: jsPDF + jsPDF-AutoTable + html2canvas for professional reports
- **AI Integration**: Google Gemini API for advanced natural language summaries
- **UI Components**: Lucide React icons + Custom components
- **File Upload**: React Dropzone

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## 🏃‍♂️ Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

3. **Open your browser**: Navigate to `http://localhost:5173`

## 📁 Project Structure

```text
src/
├── components/              # React components
│   ├── ai/                  # AI summary components
│   ├── charts/              # Chart visualization components
│   ├── dashboard/           # Dashboard components
│   ├── tables/              # Data table components
│   ├── FileUpload.tsx       # Drag-and-drop file upload
│   ├── ColumnMapping.tsx    # Interactive column mapping
│   ├── DataPreview.tsx      # Data table with pagination
│   ├── Step1DataUpload.tsx  # Data upload workflow
│   ├── Step2BenfordAnalysis.tsx  # Analysis interface
│   ├── Step3VisualizationDashboard.tsx  # Dashboard
│   ├── Step4AISummary.tsx   # AI summary interface
│   └── Step5ExportReporting.tsx  # Export & reporting
├── hooks/                   # Custom React hooks
│   ├── useDataUpload.ts     # Data upload workflow
│   └── useBenfordAnalysis.ts # Analysis workflow
├── types/                   # TypeScript type definitions
│   └── index.ts
├── utils/                   # Utility functions
│   ├── dataProcessing.ts    # File parsing & data cleaning
│   ├── benfordAnalysis.ts   # Benford's Law calculations
│   ├── aiSummary.ts         # AI summary generation
│   ├── geminiIntegration.ts # Google Gemini API integration
│   ├── pdfReportGenerator.ts # PDF report generation
│   ├── reportExporter.ts    # Export utilities
│   └── cn.ts               # CSS class utilities
└── App.tsx                 # Main application
```

## 🎯 Complete Workflow

### Step 1: Upload Your Data

1. **Prepare your data**: Ensure your file contains financial data with amount values
2. **Upload**: Drag and drop or click to browse for CSV, Excel, or JSON files
3. **Review**: Check the automatic column detection

### Step 2: Map Columns

1. **Required**: Map the "Amount" column (required for analysis)
2. **Optional**: Map Vendor, Date, and Category columns for enhanced insights
3. **Validate**: Review the mapping and proceed

### Step 3: Preview & Validate

1. **Raw Data**: Review your original data
2. **Cleaned Data**: See the processed, cleaned dataset
3. **Statistics**: Check validation results and data quality metrics

### Step 4: Benford's Law Analysis

1. **Statistical Analysis**: Automatic calculation of digit frequencies and deviations
2. **Risk Assessment**: Identification of suspicious vendors and transactions
3. **Results Review**: Detailed analysis with compliance ratings

### Step 5: Interactive Dashboard

1. **Visual Analysis**: Interactive charts showing expected vs actual digit distributions
2. **Vendor Investigation**: Sortable tables with suspicious vendor patterns
3. **Transaction Drilling**: Detailed flagged transaction exploration
4. **Heatmap Analysis**: Visual representation of vendor-digit deviations

### Step 6: AI-Powered Summary

1. **Automated Analysis**: Rule-based AI interpretation of results
2. **Natural Language Summary**: Plain-English explanations of findings
3. **Optional Gemini Integration**: Advanced AI analysis with API key
4. **Risk Assessment**: Automated risk level determination

### Step 7: Professional Reporting

1. **PDF Report Generation**: Comprehensive, audit-ready reports
2. **Custom Configuration**: Choose report content and branding
3. **Multiple Export Formats**: CSV exports for detailed investigation
4. **Compliance Ready**: Audit trails and metadata for regulatory requirements

## 📊 Supported Data Formats

### CSV Example

```csv
Amount,Vendor,Date,Category
1234.56,ABC Corp,2024-01-15,Office Supplies
987.65,XYZ Ltd,2024-01-16,Travel
```

### Excel/JSON

Similar structure with columns for Amount (required), Vendor, Date, and Category.

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Quality

This project follows strict TypeScript and ESLint configurations:

- No `any` types (use `unknown` instead)
- Proper accessibility attributes
- Consistent code formatting
- Type-safe props and state management

## 🤝 Contributing

The application provides a full fraud detection pipeline from data upload to professional reporting.

## 📄 License

MIT License - see LICENSE file for details

## 🎉 Acknowledgments

- Built with modern React patterns and TypeScript
- Uses industry-standard libraries for data processing and PDF generation
- Designed for real-world financial audit and compliance needs
- Implements Benford's Law for statistical fraud detection


# ExpenseAudit-AI
AI-powered platform for financial anomaly detection using Benford’s Law, AI Analysis, and secure role-based controls.
