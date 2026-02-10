<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# ExpenseAudit AI - Copilot Instructions

This is a React TypeScript application for financial data analysis using Benford's Law to detect potential fraud or irregularities in expense data.

## Project Structure

- **Step-by-step approach**: The application is built in phases, currently implementing Step 1 (Data Upload & Preprocessing)
- **Modern React patterns**: Uses hooks, TypeScript, and functional components
- **Clean architecture**: Separated concerns with components, hooks, utils, and types
- **TailwindCSS**: For modern, responsive UI styling

## Current Implementation: Steps 1, 2 & 3 Complete

### Step 1 - Data Upload & Preprocessing (Complete)
- Multi-format file upload (CSV, Excel, JSON)
- Automatic column detection and mapping
- Data cleaning and validation
- Real-time preview of raw and cleaned data
- User-friendly step-by-step workflow

### Step 2 - Benford's Law Analysis Engine (Complete)
- First digit extraction from transaction amounts
- Statistical analysis (Chi-square, MAD calculations)
- Fraud detection and risk assessment
- Vendor analysis for suspicious patterns
- Comprehensive reporting with flagged transactions

### Step 3 - Interactive Visualization Dashboard (Complete)
- Risk summary cards with at-a-glance metrics
- Interactive bar chart showing digit distribution (Expected vs Actual)
- Sortable/filterable vendors table with drill-down capabilities
- Searchable/paginated flagged transactions table with export
- Deviation heatmap showing vendor-digit patterns
- Modal dialogs for detailed vendor and transaction analysis
- Real-time filtering and search across all data views

### Key Components
- `FileUpload`: Drag-and-drop file upload with validation
- `ColumnMapping`: Interactive column mapping with auto-detection
- `DataPreview`: Paginated table view with validation summary
- `Step1DataUpload`: Main orchestrator component for data preprocessing
- `Step2BenfordAnalysis`: Benford's Law analysis interface
- `BenfordResults`: Comprehensive results display with charts and tables
- `Step3VisualizationDashboard`: Interactive dashboard with advanced visualization
- `RiskSummary`: Summary cards showing key risk metrics and statistics
- `BenfordChart`: Interactive bar chart using Recharts for digit frequency comparison
- `VendorsTable`: Sortable/filterable table for suspicious vendor analysis
- `TransactionsTable`: Paginated table for flagged transaction exploration
- `DeviationHeatmap`: Custom heatmap visualization for vendor-digit patterns

### Analysis Pipeline
1. File parsing using PapaParse (CSV) and SheetJS (Excel)
2. Auto-detection of amount, vendor, date, and category columns
3. Data cleaning (currency symbols, number formatting, validation)
4. First digit extraction and frequency analysis
5. Statistical deviation calculations (MAD, Chi-square)
6. Vendor-specific pattern analysis
7. Transaction flagging and risk assessment

## Coding Guidelines

- Use TypeScript with strict typing
- Prefer functional components with hooks
- Use proper error boundaries and loading states
- Follow accessibility best practices (ARIA labels, semantic HTML)
- Implement responsive design with TailwindCSS
- Use proper TypeScript imports (avoid `any`, prefer `unknown`)
- Handle edge cases gracefully with user-friendly error messages

## Future Steps
- Step 4: Natural Language AI Summary with advanced export features

When generating code, maintain consistency with the existing patterns and architecture. The application now has a complete fraud detection pipeline with sophisticated statistical analysis and an interactive visualization dashboard for exploring results.
