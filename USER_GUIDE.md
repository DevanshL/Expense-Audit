# ExpenseAudit AI - User Guide

## 🚀 Quick Start Guide

### Getting Started
1. **Start the application**: Open http://localhost:5173 in your web browser
2. **Choose your data**: Either upload your own financial data or generate sample data for testing
3. **Follow the workflow**: The application guides you through 5 simple steps

## 📊 Step-by-Step Workflow

### Step 1: Data Upload & Preprocessing
**Upload Your Financial Data**

#### Option A: Use Your Own Data
- **Supported formats**: CSV, Excel (.xlsx, .xls), JSON
- **Required column**: Amount (transaction values)
- **Optional columns**: Vendor, Date, Category (for enhanced analysis)
- **Drag & drop** your file or click to browse

#### Option B: Generate Sample Data
- **Quick testing**: Choose from 4 preset configurations
- **Small dataset**: 100 transactions (quick testing)
- **Medium dataset**: 500 transactions (balanced analysis)
- **Large dataset**: 1,000 transactions (comprehensive testing)
- **Fraudulent dataset**: 300 transactions with high violation patterns

#### Data Requirements
- **Amount column**: Must contain numeric values (currency symbols will be cleaned automatically)
- **File size**: Up to 10MB recommended for optimal performance
- **Data quality**: Invalid/missing amounts will be filtered out automatically

### Step 2: Benford's Law Analysis
**Automatic Statistical Analysis**

The application automatically:
- **Extracts first digits** from all transaction amounts
- **Calculates frequency distributions** for digits 1-9
- **Compares against expected** Benford's Law distribution
- **Calculates deviation scores** (Chi-square, MAD)
- **Assigns risk levels** to transactions and vendors

**Risk Levels Explained:**
- 🟢 **Compliant**: Follows expected patterns closely
- 🟡 **Acceptable**: Minor deviations within normal range
- 🟠 **Suspicious**: Notable deviations requiring attention
- 🔴 **Highly Suspicious**: Significant violations, investigation recommended

### Step 3: Interactive Dashboard
**Explore Your Results**

#### Risk Summary Cards
- **Overall compliance** status at a glance
- **Total flagged transactions** count and percentage
- **Suspicious vendors** identification
- **Key statistics** (MAD score, Chi-square value)

#### Interactive Charts
- **Bar chart**: Expected vs Actual digit distribution
- **Hover for details**: See exact percentages and counts
- **Visual deviations**: Quickly spot problem areas

#### Vendor Analysis Table
- **Sortable columns**: Click headers to sort by risk, transactions, etc.
- **Search functionality**: Find specific vendors quickly
- **Risk indicators**: Color-coded compliance levels
- **Drill-down capability**: Click vendors for detailed analysis

#### Flagged Transactions Table
- **Suspicious transactions**: Automatically identified problematic entries
- **Searchable data**: Find transactions by amount, vendor, date
- **Pagination**: Navigate large datasets efficiently
- **Export options**: Download filtered results

### Step 4: AI-Powered Summary
**Get Natural Language Insights**

#### Rule-Based AI Analysis (Always Available)
- **Automatic interpretation** of statistical results
- **Plain English explanations** of fraud detection findings
- **Risk assessment** with specific recommendations
- **Pattern identification** in suspicious behaviors

#### Google Gemini Integration (Optional)
- **Advanced AI analysis** with your API key
- **Sophisticated insights** and context-aware explanations
- **Executive-level summaries** for stakeholders
- **Customizable AI parameters** (temperature, token limits)

**How to Use Gemini:**
1. Obtain a Google Gemini API key from Google AI Studio
2. Click "Enable Gemini Analysis" in Step 4
3. Enter your API key securely
4. Generate advanced AI-powered insights

### Step 5: Professional Export & Reporting
**Create Audit-Ready Reports**

#### PDF Report Generation
- **Professional formatting** with cover pages and sections
- **Customizable content**: Choose what to include
- **Organization branding**: Add company name and auditor info
- **Comprehensive analysis**: All statistics, charts, and findings
- **Audit trail**: Unique report IDs for compliance

#### CSV Exports
- **Flagged transactions**: Detailed suspicious transaction data
- **Vendor analysis**: Risk assessment for all vendors  
- **Cleaned dataset**: Processed data for external analysis
- **Full analysis**: Complete results in structured format

#### Report Configuration
- **Content selection**: Include/exclude charts, AI summary, raw data
- **Branding options**: Organization name, auditor information
- **Custom titles**: Personalize report names and descriptions

## 🔧 Tips & Best Practices

### Data Preparation
- **Clean your data** before upload (remove headers, formatting)
- **Ensure amount column** contains only numeric values
- **Include vendor information** for enhanced fraud detection
- **Use consistent date formats** if including dates

### Analysis Interpretation
- **MAD scores** below 0.006 are typically compliant
- **Chi-square values** above 15.5 suggest significant deviations
- **Focus on vendors** with multiple flagged transactions
- **Investigate patterns** in specific amount ranges

### Report Generation
- **Include executive summary** for stakeholder presentations
- **Add organization branding** for professional appearance
- **Export raw data** for further analysis in specialized tools
- **Keep audit trails** for compliance documentation

## ⌨️ Keyboard Shortcuts

- **?**: Show help information
- **Ctrl + E**: Export current data/report
- **Ctrl + Shift + R**: Reset application
- **Alt + ←**: Go to previous step
- **Alt + →**: Go to next step
- **Esc**: Close modals and dialogs

## 🔍 Troubleshooting

### Common Issues

#### File Upload Problems
- **Check file format**: Only CSV, Excel, JSON supported
- **Verify file size**: Large files (>10MB) may be slow
- **Amount column**: Must be mappable to numeric data

#### Analysis Errors
- **Insufficient data**: Need at least 50 transactions for reliable analysis
- **All same amounts**: Dataset with identical values won't produce meaningful results
- **No valid amounts**: Ensure amount column contains numeric data

#### Export Issues
- **PDF generation**: Ensure modern browser with JavaScript enabled
- **Large datasets**: PDF generation may take time for 1000+ transactions
- **Download blocked**: Check browser popup/download settings

### Getting Help
- **Sample data**: Use built-in generator to test application features
- **Documentation**: Refer to technical documentation files
- **Error messages**: Read detailed error descriptions in the interface

## 📈 Understanding Benford's Law

### What is Benford's Law?
Benford's Law predicts that in many naturally occurring datasets, the first digit 1 appears about 30.1% of the time, 2 appears 17.6% of the time, and so on, with 9 appearing only 4.6% of the time.

### Why It Detects Fraud
- **Natural patterns**: Legitimate financial data typically follows this distribution
- **Artificial manipulation**: Fraudulent data often violates these patterns
- **Round number bias**: Fraudsters tend to use round numbers (starting with 5, 6, 7)
- **Pattern recognition**: Statistical deviations indicate potential manipulation

### Limitations
- **Small datasets**: Need sufficient data points for reliable analysis
- **Specific domains**: Some data types naturally violate Benford's Law
- **Detection tool**: Not definitive proof of fraud, requires investigation
- **Context matters**: Consider business context in interpretation

## 📞 Support

For technical issues or questions about fraud detection methodology, refer to:
- **Documentation files** in the project directory
- **Source code comments** for technical implementation details
- **Academic papers** on Benford's Law application in fraud detection

---

**ExpenseAudit AI** - Making financial fraud detection accessible, accurate, and actionable.
