export type RiskLevel = 'Safe' | 'Suspicious' | 'High Risk' | 'Blocked';

export type NavigationTab =
  | 'dashboard'
  | 'invoices'
  | 'vendors'
  | 'payments'
  | 'expenses'
  | 'fraud-centre'
  | 'investigations'
  | 'reports'
  | 'audit-logs'
  | 'settings';

export type FraudType =
  | 'DUPLICATE_INVOICE'
  | 'FAKE_OR_UNREGISTERED_VENDOR'
  | 'INFLATED_INVOICE_AMOUNT'
  | 'EMPLOYEE_EXPENSE_FRAUD'
  | 'UNAUTHORIZED_PAYMENT'
  | 'SUSPICIOUS_BANK_CHANGE'
  | 'SPLIT_PAYMENT_AVOID_APPROVAL'
  | 'REPEATED_INVOICE_SUBMISSION'
  | 'UNUSUAL_PAYMENT_PATTERN';

export type InvestigationStatus =
  | 'Under Investigation'
  | 'Confirmed Fraud'
  | 'False Positive'
  | 'Resolved';

export interface BankAccountHistory {
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  changedAt: string;
  changedBy: string;
  reason?: string;
}

export interface Vendor {
  id: string;
  vendorCode: string;
  name: string;
  gstin: string;
  category: string;
  email: string;
  phone: string;
  address: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  status: 'Active' | 'Under Review' | 'Blacklisted' | 'Suspicious';
  riskScore: number;
  riskLevel: RiskLevel;
  registeredAt: string;
  lastBankChangeDate?: string;
  bankHistory: BankAccountHistory[];
  totalInvoiced: number;
  totalPaid: number;
  averageInvoiceAmount: number;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  vendorGstin?: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  description: string;
  department: string;
  lineItems: InvoiceLineItem[];
  status: 'Pending Approval' | 'Approved' | 'Flagged' | 'Paid' | 'Cancelled';
  riskScore: number;
  riskLevel: RiskLevel;
  fraudReasons: string[];
  isDuplicate: boolean;
  duplicateOfInvoiceId?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentReference: string;
  idempotencyKey: string;
  invoiceId: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  currency: string;
  paymentMethod: 'NEFT' | 'RTGS' | 'IMPS' | 'ACH' | 'Corporate Wire';
  beneficiaryAccount: string;
  beneficiaryIfsc: string;
  paymentDate: string;
  status: 'Completed' | 'Processing' | 'Held' | 'Blocked' | 'Failed';
  riskScore: number;
  riskLevel: RiskLevel;
  fraudReasons: string[];
  isSplitPayment: boolean;
  approvalLimitThreshold: number;
  createdAt: string;
}

export interface EmployeeExpense {
  id: string;
  claimReference: string;
  employeeId: string;
  employeeName: string;
  department: string;
  receiptNumber: string;
  merchantName: string;
  expenseCategory: 'Travel' | 'Meals & Entertainment' | 'Lodging' | 'Software & Subscriptions' | 'Office Supplies';
  amount: number;
  currency: string;
  expenseDate: string;
  submissionDate: string;
  status: 'Submitted' | 'Approved' | 'Flagged Duplicate' | 'Rejected' | 'Reimbursed';
  riskScore: number;
  riskLevel: RiskLevel;
  fraudReasons: string[];
  isDuplicateReceipt: boolean;
  duplicateOfClaimId?: string;
  notes?: string;
  createdAt: string;
}

export interface ReviewerComment {
  id: string;
  author: string;
  role: string;
  comment: string;
  timestamp: string;
}

export interface EvidenceItem {
  label: string;
  detail: string;
  severity: 'Info' | 'Warning' | 'Critical';
}

export interface InvestigationCase {
  id: string;
  caseId: string;
  entityType: 'INVOICE' | 'VENDOR' | 'PAYMENT' | 'EXPENSE';
  entityId: string;
  entityReference: string;
  fraudType: FraudType;
  involvedParty: string;
  amountInvolved: number;
  riskScore: number;
  riskLevel: RiskLevel;
  detectionDate: string;
  status: InvestigationStatus;
  evidence: EvidenceItem[];
  reviewerComments: ReviewerComment[];
  assignedTo?: string;
  preventedAmount: number;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
}

export interface DashboardStats {
  totalInvoicesCount: number;
  totalInvoicesValue: number;
  totalVendorsCount: number;
  totalPaymentsCount: number;
  totalPaymentsValue: number;
  totalExpensesCount: number;
  totalExpensesValue: number;
  fraudCasesDetected: number;
  pendingInvestigations: number;
  confirmedFraudCases: number;
  estimatedFinancialExposure: number;
  amountPreventedDuplicatePayments: number;
}

export interface FraudRuleResult {
  ruleId: string;
  ruleName: string;
  score: number;
  triggered: boolean;
  reason: string;
  recommendedAction: string;
  evidence: EvidenceItem[];
}

export interface FraudAssessmentResult {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  triggeredRules: FraudRuleResult[];
  recommendedAction: string;
  evidence: EvidenceItem[];
}

export interface SettingsConfig {
  approvalLimitThreshold: number; // default Rs 50,000
  splitPaymentWindowHours: number; // default 48h
  invoiceInflationMultiplier: number; // default 3.0 (300%)
  vendorBankLookbackDays: number; // default 7 days
  duplicateLookbackDays: number; // default 90 days
}
