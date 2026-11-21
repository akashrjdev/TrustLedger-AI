# TrustLedger AI

> **Intelligent Business Fraud Detection & Financial Integrity Platform**  
> *Enterprise corporate fraud prevention, duplicate invoice blocking, vendor bank modification surveillance, and employee expense auditing.*

---

## 🚀 Overview

**TrustLedger AI** is an enterprise-grade financial integrity platform built for CFOs, Internal Audit Directors, and Accounts Payable (AP) teams. It detects and neutralizes multi-vector business fraud across corporate disbursements, procurement cycles, and employee reimbursements.

Unlike basic payment checkers, **TrustLedger AI** continuously monitors transactional relationships, enforces database-level unique constraints, protects payment gateways with idempotency keys, and analyzes vendor behavior over configurable lookback windows.

---

## 🛡️ Types of Business Fraud Detected

1. **Duplicate Invoice Fraud**: Identifies exact invoice number collisions for the same vendor, as well as near-duplicate fuzzy amount submissions within a configurable lookback window (default 90 days).
2. **Fake & Suspicious Vendors**: Halts transactions to unregistered entities, shell corporations, or vendors flagged under compliance review / blacklists.
3. **Suspicious Vendor Bank Account Changes**: Applies a 7-day lookback rule flagging any upcoming invoices or payouts after a vendor's payout bank account or IFSC code has been altered.
4. **Split Payments to Evade Approval Limits**: Quarantines multiple disbursements initiated to the same vendor within 48 hours whose individual amounts hover just beneath single-approver thresholds (e.g., ₹48,500 and ₹49,200 when limit is ₹50,000).
5. **Inflated Invoice Amounts**: Detects abnormal billing spikes exceeding 300% of a vendor's historical average billing volume.
6. **Employee Expense Fraud (Duplicate Receipts)**: Blocks repeated tax invoice numbers, identical dates, and matching amounts claimed by employees across travel, lodging, and entertainment reports.
7. **Unauthorized & High-Velocity Disbursements**: Monitors unusual payment patterns and flags rapid payment sequences outside regular corporate clearing windows.

---

## 🔒 Critical Duplicate Prevention Architecture

TrustLedger AI implements a multi-tier duplicate prevention mechanism that does not depend solely on frontend UI checks:

- **Invoices**: Enforces unique constraints on `vendorId + invoiceNumber`. Attempted duplicate submissions are blocked at the repository/service layer, logged in security audit trails, and automatically escalated into the Investigation Queue as prevented fraud savings.
- **Vendors**: Enforces unique constraints across GSTIN, legal vendor name, and bank account numbers. Multiple vendors are prohibited from sharing identical corporate bank accounts.
- **Payments**: Uses cryptographic idempotency keys (`idempotencyKey`) and unique transaction references (`paymentReference`). Repeated clicks or simultaneous API dispatches return existing verified records without duplicate balance deduction.
- **Employee Expenses**: Enforces unique constraints on `employeeId + receiptNumber` and fuzzy validation on `employeeId + amount + date`.
- **Database Validation**: Throws structured `DuplicateEntityError` with conflicting identifiers and creates actionable evidence artifacts.

---

## 📊 Reconciled Dashboard Calculations

All statistics displayed on the TrustLedger AI dashboard are computed strictly from verified database records:

| Statistic | Calculation Source |
| :--- | :--- |
| **Total Invoices** | Count and sum of all active invoices in the repository |
| **Total Vendors** | Count of onboarded vendors in master directory |
| **Total Payments** | Count and sum of all disbursed corporate payments |
| **Employee Expenses** | Count and sum of all submitted employee expense claims |
| **Fraud Cases Detected** | Count of all flagged anomalies across all 4 entities |
| **Pending Investigations** | Count of cases with status `Under Investigation` |
| **Confirmed Fraud Cases** | Count of cases substantiated by internal audit |
| **Financial Exposure** | Exact sum of amounts involved in unresolved active cases |
| **Prevented Duplicate Loss** | Exact sum of capital saved from blocked duplicate invoices and fraudulent claims |

---

## 🧭 Navigation & Core Modules

1. **Dashboard**: High-level financial overview, Recharts volume comparison, risk profile pie charts, and priority investigation alerts.
2. **Invoice Management**: Ingest invoices with automatic line item analysis, duplicate detection, and risk scoring.
3. **Vendor Management**: Vendor directory with GSTIN validation, bank modification lookback tracking, and risk ratings.
4. **Payment Monitoring**: Disburse corporate payouts with idempotency tokens, split-payment detection, and gateway locks.
5. **Employee Expenses**: Expense claim submission with automated receipt duplication screening and policy enforcement.
6. **Fraud Detection Centre**: Interactive transaction risk scanner simulator, rules library, and explainable score breakdowns.
7. **Investigation Queue**: Case management with evidence drawers, multi-stage status workflows (`Under Investigation`, `Confirmed Fraud`, `False Positive`, `Resolved`), reviewer comments, and audit logging.
8. **Reports & Analytics**: Departmental spend reconciliation, loss prevention statistics, and exportable audit logs.
9. **Audit Logs**: Immutable log tracking every submission, duplicate rejection, and admin override with timestamps.
10. **Settings**: Configurable thresholds (approval limits, split-payment timeframes, inflation multipliers, lookback days), plus full JSON database backup export & restore.

---

## 🎨 UI/UX Readability & Design System

- **Primary Color**: TrustLedger Orange (`#F58220`) with dark navy (`#0B192C`) typography and clean white/slate surfaces (`#F8FAFC`).
- **Typography Hierarchy**:
  - Main headings: 28px (Bold 800)
  - Section headings: 20–22px (Bold 700)
  - Normal body text: 16px
  - Table text: 14px with `tabular-nums` alignment for currencies and dates
- **Risk Status Indicators**: Clear color and textual badges: `Safe` (Emerald), `Suspicious` (Amber), `High Risk` (Red), and `Blocked` (Dark Rose).

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Enterprise Orange & Slate design system)
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Testing**: Vitest + JSDOM + Testing Library

---

## 💻 Exact Commands to Start the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Test Suite
```bash
npm test
```

### 3. Build for Production
```bash
npm run build
```

### 4. Start Development Server
```bash
npm run dev
```

Open **`http://localhost:5173/`** in your browser.

---

## 🛡️ Synthetic Demo Data Notice
All corporate data, GSTINs, bank accounts, employee IDs, and vendor records within this demonstration are synthetic and simulated for compliance audit and hackathon demonstration purposes. No real banking credentials or production passwords are used or requested.
