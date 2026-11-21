import {
  Vendor,
  Invoice,
  Payment,
  EmployeeExpense,
  InvestigationCase,
  AuditLog,
  DashboardStats,
  SettingsConfig,
} from '../types';
import { DEFAULT_SETTINGS, assessInvoiceFraud, assessPaymentFraud, assessExpenseFraud } from '../engine/fraudDetectionEngine';
import { formatDate } from '../utils/formatter';

export class DuplicateEntityError extends Error {
  public field: string;
  public conflictingId?: string;
  constructor(message: string, field: string, conflictingId?: string) {
    super(message);
    this.name = 'DuplicateEntityError';
    this.field = field;
    this.conflictingId = conflictingId;
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const STORAGE_KEY = 'trustledger_ai_db_v1';

// Initial realistic enterprise seed data
const SEED_VENDORS: Vendor[] = [
  {
    id: 'v-101',
    vendorCode: 'VND-00101',
    name: 'Apex Cloud & IT Solutions Pvt Ltd',
    gstin: '29AABCA1234F1Z5',
    category: 'IT Hardware & Cloud',
    email: 'billing@apexcloud.in',
    phone: '+91 80 4123 4567',
    address: 'Indiranagar 100ft Road, Bengaluru, Karnataka 560038',
    bankAccountNumber: '918020491029',
    bankIfsc: 'HDFC0001029',
    bankName: 'HDFC Bank Ltd',
    status: 'Active',
    riskScore: 12,
    riskLevel: 'Safe',
    registeredAt: '2025-01-15T09:30:00Z',
    bankHistory: [],
    totalInvoiced: 485000,
    totalPaid: 485000,
    averageInvoiceAmount: 97000,
  },
  {
    id: 'v-102',
    vendorCode: 'VND-00102',
    name: 'Vanguard Industrial Supplies',
    gstin: '27AABCV5678G2Z1',
    category: 'MRO & Industrial Consumables',
    email: 'accounts@vanguard-ind.com',
    phone: '+91 22 2845 9901',
    address: 'MIDC Andheri East, Mumbai, Maharashtra 400093',
    bankAccountNumber: '02811040001928',
    bankIfsc: 'ICIC0000281',
    bankName: 'ICICI Bank',
    status: 'Suspicious',
    riskScore: 68,
    riskLevel: 'High Risk',
    registeredAt: '2025-03-10T11:00:00Z',
    lastBankChangeDate: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago!
    bankHistory: [
      {
        bankAccountNumber: '02811040001928',
        bankIfsc: 'ICIC0000281',
        bankName: 'ICICI Bank',
        changedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        changedBy: 'Finance Ops (Portal Self-Service)',
        reason: 'Vendor requested urgent payout routing to new operational account.',
      },
    ],
    totalInvoiced: 340000,
    totalPaid: 190000,
    averageInvoiceAmount: 85000,
  },
  {
    id: 'v-103',
    vendorCode: 'VND-00103',
    name: 'Rapid Express Logistics LLP',
    gstin: '29AABCR8901H3Z9',
    category: 'Freight & Supply Chain',
    email: 'ops@rapidexpress.in',
    phone: '+91 80 2555 8899',
    address: 'Peenya Industrial Area, Bengaluru, Karnataka 560058',
    bankAccountNumber: '50200039182910',
    bankIfsc: 'HDFC0000502',
    bankName: 'HDFC Bank Ltd',
    status: 'Active',
    riskScore: 24,
    riskLevel: 'Safe',
    registeredAt: '2025-02-01T10:00:00Z',
    bankHistory: [],
    totalInvoiced: 210000,
    totalPaid: 210000,
    averageInvoiceAmount: 35000,
  },
  {
    id: 'v-104',
    vendorCode: 'VND-00104',
    name: 'Phantom Tech Consultants (Shell Corp)',
    gstin: '07AABCP9999K1Z4',
    category: 'Marketing Consulting',
    email: 'contact@phantom-shell.xyz',
    phone: '+91 11 4100 2233',
    address: 'Barakhamba Road, Connaught Place, New Delhi 110001',
    bankAccountNumber: '99201928374619',
    bankIfsc: 'SBIN0000691',
    bankName: 'State Bank of India',
    status: 'Blacklisted',
    riskScore: 95,
    riskLevel: 'Blocked',
    registeredAt: '2025-08-14T14:20:00Z',
    bankHistory: [],
    totalInvoiced: 150000,
    totalPaid: 0,
    averageInvoiceAmount: 150000,
  },
];

const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-2001',
    invoiceNumber: 'INV-2026-089',
    vendorId: 'v-101',
    vendorName: 'Apex Cloud & IT Solutions Pvt Ltd',
    vendorGstin: '29AABCA1234F1Z5',
    amount: 98000,
    currency: 'INR',
    issueDate: '2026-11-10T00:00:00Z',
    dueDate: '2026-12-10T00:00:00Z',
    description: 'Q3 Enterprise Cloud Storage & Server Maintenance',
    department: 'Engineering',
    lineItems: [
      { id: 'li-1', description: 'Dedicated Virtual Instances (16 vCPU)', quantity: 4, unitPrice: 20000, amount: 80000 },
      { id: 'li-2', description: 'Managed Cloud Backup & Monitoring', quantity: 1, unitPrice: 18000, amount: 18000 },
    ],
    status: 'Paid',
    riskScore: 12,
    riskLevel: 'Safe',
    fraudReasons: [],
    isDuplicate: false,
    createdAt: '2026-11-10T10:15:00Z',
  },
  {
    id: 'inv-2002',
    invoiceNumber: 'INV-2026-092',
    vendorId: 'v-102',
    vendorName: 'Vanguard Industrial Supplies',
    vendorGstin: '27AABCV5678G2Z1',
    amount: 150000,
    currency: 'INR',
    issueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 29 * 86400000).toISOString(),
    description: 'Factory Automation Spares & Hydraulic Valves',
    department: 'Manufacturing',
    lineItems: [
      { id: 'li-3', description: 'Hydraulic Solenoid Valves', quantity: 10, unitPrice: 15000, amount: 150000 },
    ],
    status: 'Flagged',
    riskScore: 82,
    riskLevel: 'High Risk',
    fraudReasons: [
      'Vendor changed payout bank account 3 days prior to invoice submission.',
      'Invoice amount (₹1,50,000) is 1.8x historical average.',
    ],
    isDuplicate: false,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'inv-2003',
    invoiceNumber: 'INV-2026-089', // Attempted duplicate of inv-2001!
    vendorId: 'v-101',
    vendorName: 'Apex Cloud & IT Solutions Pvt Ltd',
    vendorGstin: '29AABCA1234F1Z5',
    amount: 98000,
    currency: 'INR',
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    description: 'Q3 Enterprise Cloud Storage & Server Maintenance (Resubmitted)',
    department: 'Engineering',
    lineItems: [
      { id: 'li-4', description: 'Dedicated Virtual Instances (16 vCPU)', quantity: 4, unitPrice: 20000, amount: 80000 },
      { id: 'li-5', description: 'Managed Cloud Backup & Monitoring', quantity: 1, unitPrice: 18000, amount: 18000 },
    ],
    status: 'Flagged',
    riskScore: 92,
    riskLevel: 'Blocked',
    fraudReasons: [
      'Exact duplicate invoice number "INV-2026-089" previously submitted on 10 Nov 2026 for ₹98,000.',
    ],
    isDuplicate: true,
    duplicateOfInvoiceId: 'inv-2001',
    createdAt: new Date().toISOString(),
  },
];

const SEED_PAYMENTS: Payment[] = [
  {
    id: 'pay-3001',
    paymentReference: 'PAY-REF-2026-1011',
    idempotencyKey: 'idemp_apex_inv2001_8910',
    invoiceId: 'inv-2001',
    invoiceNumber: 'INV-2026-089',
    vendorId: 'v-101',
    vendorName: 'Apex Cloud & IT Solutions Pvt Ltd',
    amount: 98000,
    currency: 'INR',
    paymentMethod: 'RTGS',
    beneficiaryAccount: '918020491029',
    beneficiaryIfsc: 'HDFC0001029',
    paymentDate: '2026-11-12T14:30:00Z',
    status: 'Completed',
    riskScore: 12,
    riskLevel: 'Safe',
    fraudReasons: [],
    isSplitPayment: false,
    approvalLimitThreshold: 50000,
    createdAt: '2026-11-12T14:30:00Z',
  },
  {
    id: 'pay-3002',
    paymentReference: 'PAY-REF-2026-1024',
    idempotencyKey: 'idemp_split_v103_batch1',
    invoiceId: 'inv-2001',
    invoiceNumber: 'INV-SPLIT-01',
    vendorId: 'v-103',
    vendorName: 'Rapid Express Logistics LLP',
    amount: 48500, // Structured just below 50,000!
    currency: 'INR',
    paymentMethod: 'NEFT',
    beneficiaryAccount: '50200039182910',
    beneficiaryIfsc: 'HDFC0000502',
    paymentDate: new Date(Date.now() - 4 * 3600000).toISOString(),
    status: 'Held',
    riskScore: 72,
    riskLevel: 'High Risk',
    fraudReasons: [
      'Split payment pattern: Multiple payments to Rapid Express Logistics structured just below ₹50,000 threshold within 48h.',
    ],
    isSplitPayment: true,
    approvalLimitThreshold: 50000,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'pay-3003',
    paymentReference: 'PAY-REF-2026-1025',
    idempotencyKey: 'idemp_split_v103_batch2',
    invoiceId: 'inv-2001',
    invoiceNumber: 'INV-SPLIT-02',
    vendorId: 'v-103',
    vendorName: 'Rapid Express Logistics LLP',
    amount: 49200, // Second split payment just below 50,000!
    currency: 'INR',
    paymentMethod: 'NEFT',
    beneficiaryAccount: '50200039182910',
    beneficiaryIfsc: 'HDFC0000502',
    paymentDate: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: 'Held',
    riskScore: 72,
    riskLevel: 'High Risk',
    fraudReasons: [
      'Split payment pattern: Payment of ₹49,200 immediately follows ₹48,500 to evade single transaction executive approval limit.',
    ],
    isSplitPayment: true,
    approvalLimitThreshold: 50000,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
];

const SEED_EXPENSES: EmployeeExpense[] = [
  {
    id: 'exp-4001',
    claimReference: 'EXP-CLM-2026-0045',
    employeeId: 'EMP-0881',
    employeeName: 'Rajesh Sharma',
    department: 'Sales & BD',
    receiptNumber: 'HOTEL-DEL-9841',
    merchantName: 'The Oberoi New Delhi',
    expenseCategory: 'Lodging',
    amount: 24500,
    currency: 'INR',
    expenseDate: '2026-11-04',
    submissionDate: '2026-11-06T10:00:00Z',
    status: 'Reimbursed',
    riskScore: 15,
    riskLevel: 'Safe',
    fraudReasons: [],
    isDuplicateReceipt: false,
    createdAt: '2026-11-06T10:00:00Z',
  },
  {
    id: 'exp-4002',
    claimReference: 'EXP-CLM-2026-0092',
    employeeId: 'EMP-0881',
    employeeName: 'Rajesh Sharma',
    department: 'Sales & BD',
    receiptNumber: 'HOTEL-DEL-9841', // Exact duplicate receipt claimed again!
    merchantName: 'The Oberoi New Delhi',
    expenseCategory: 'Lodging',
    amount: 24500,
    currency: 'INR',
    expenseDate: '2026-11-04',
    submissionDate: new Date().toISOString(),
    status: 'Flagged Duplicate',
    riskScore: 88,
    riskLevel: 'High Risk',
    fraudReasons: [
      'Duplicate receipt number "HOTEL-DEL-9841" was already reimbursed on claim EXP-CLM-2026-0045 for ₹24,500.',
    ],
    isDuplicateReceipt: true,
    duplicateOfClaimId: 'exp-4001',
    createdAt: new Date().toISOString(),
  },
];

const SEED_INVESTIGATIONS: InvestigationCase[] = [
  {
    id: 'case-5001',
    caseId: 'CASE-2026-001',
    entityType: 'INVOICE',
    entityId: 'inv-2003',
    entityReference: 'INV-2026-089 (Apex Cloud)',
    fraudType: 'DUPLICATE_INVOICE',
    involvedParty: 'Apex Cloud & IT Solutions Pvt Ltd',
    amountInvolved: 98000,
    riskScore: 92,
    riskLevel: 'Blocked',
    detectionDate: new Date().toISOString(),
    status: 'Under Investigation',
    evidence: [
      { label: 'Original Invoice ID', detail: 'inv-2001 (Paid 12 Nov 2026)', severity: 'Critical' },
      { label: 'Duplicate Invoice #', detail: 'INV-2026-089', severity: 'Critical' },
      { label: 'Attempted Payout', detail: '₹98,000', severity: 'Warning' },
    ],
    reviewerComments: [
      {
        id: 'c-1',
        author: 'Sunil Mehta',
        role: 'Senior Fraud Auditor',
        comment: 'Identified automated resubmission attempt. Vendor contacted; verifying if accounting sync glitch.',
        timestamp: new Date().toISOString(),
      },
    ],
    assignedTo: 'Sunil Mehta',
    preventedAmount: 98000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'case-5002',
    caseId: 'CASE-2026-002',
    entityType: 'PAYMENT',
    entityId: 'pay-3002',
    entityReference: 'PAY-REF-2026-1024 & 1025 (Rapid Express)',
    fraudType: 'SPLIT_PAYMENT_AVOID_APPROVAL',
    involvedParty: 'Rapid Express Logistics LLP',
    amountInvolved: 97700,
    riskScore: 72,
    riskLevel: 'High Risk',
    detectionDate: new Date(Date.now() - 4 * 3600000).toISOString(),
    status: 'Under Investigation',
    evidence: [
      { label: 'Payment 1', detail: '₹48,500 (4h ago)', severity: 'Warning' },
      { label: 'Payment 2', detail: '₹49,200 (2h ago)', severity: 'Warning' },
      { label: 'Approval Limit', detail: '₹50,000', severity: 'Info' },
      { label: 'Combined Volume', detail: '₹97,700', severity: 'Critical' },
    ],
    reviewerComments: [
      {
        id: 'c-2',
        author: 'Priya Nambiar',
        role: 'Internal Controls Lead',
        comment: 'Payments held. Re-consolidating into a single PO and escalating to VP Finance for dual-signature.',
        timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
    ],
    assignedTo: 'Priya Nambiar',
    preventedAmount: 97700,
    updatedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'case-5003',
    caseId: 'CASE-2026-003',
    entityType: 'EXPENSE',
    entityId: 'exp-4002',
    entityReference: 'EXP-CLM-2026-0092 (Rajesh Sharma)',
    fraudType: 'EMPLOYEE_EXPENSE_FRAUD',
    involvedParty: 'Rajesh Sharma (EMP-0881)',
    amountInvolved: 24500,
    riskScore: 88,
    riskLevel: 'High Risk',
    detectionDate: new Date().toISOString(),
    status: 'Confirmed Fraud',
    evidence: [
      { label: 'Receipt #', detail: 'HOTEL-DEL-9841', severity: 'Critical' },
      { label: 'First Reimbursed', detail: '06 Nov 2026 on EXP-CLM-2026-0045', severity: 'Critical' },
      { label: 'Duplicate Claim Date', detail: 'Today', severity: 'Warning' },
    ],
    reviewerComments: [
      {
        id: 'c-3',
        author: 'Arun Iyer',
        role: 'Compliance Officer',
        comment: 'Confirmed duplicate submission. Employee stated error; claim rejected and flagged in HR integrity records.',
        timestamp: new Date().toISOString(),
      },
    ],
    assignedTo: 'Arun Iyer',
    preventedAmount: 24500,
    updatedAt: new Date().toISOString(),
  },
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    user: 'System Sentinel',
    action: 'DUPLICATE_INVOICE_BLOCKED',
    entityType: 'INVOICE',
    entityId: 'inv-2003',
    details: 'Blocked duplicate invoice INV-2026-089 for vendor Apex Cloud (₹98,000). Prevented double payout.',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    user: 'System Sentinel',
    action: 'SPLIT_PAYMENT_QUARANTINED',
    entityType: 'PAYMENT',
    entityId: 'pay-3003',
    details: 'Quarantined payment of ₹49,200 to Rapid Express Logistics. Structured below approval limit.',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    user: 'Finance Ops',
    action: 'VENDOR_BANK_ACCOUNT_CHANGED',
    entityType: 'VENDOR',
    entityId: 'v-102',
    details: 'Vendor Vanguard Industrial Supplies bank account updated to ICICI Bank (02811040001928).',
  },
];

export class DatabaseService {
  private vendors: Vendor[] = [];
  private invoices: Invoice[] = [];
  private payments: Payment[] = [];
  private expenses: EmployeeExpense[] = [];
  private investigations: InvestigationCase[] = [];
  private auditLogs: AuditLog[] = [];
  private settings: SettingsConfig = DEFAULT_SETTINGS;
  private idempotencyCache = new Set<string>();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If clean mode was enabled or if arrays are explicitly present, honor them without forcing seed data
        const isClean = parsed.isCleanMode === true || (Array.isArray(parsed.vendors) && parsed.vendors.length === 0);
        
        if (isClean) {
          this.vendors = Array.isArray(parsed.vendors) ? parsed.vendors : [];
          this.invoices = Array.isArray(parsed.invoices) ? parsed.invoices : [];
          this.payments = Array.isArray(parsed.payments) ? parsed.payments : [];
          this.expenses = Array.isArray(parsed.expenses) ? parsed.expenses : [];
          this.investigations = Array.isArray(parsed.investigations) ? parsed.investigations : [];
          this.auditLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [];
          this.settings = parsed.settings || DEFAULT_SETTINGS;
        } else {
          this.vendors = Array.isArray(parsed.vendors) ? parsed.vendors : SEED_VENDORS;
          this.invoices = Array.isArray(parsed.invoices) ? parsed.invoices : SEED_INVOICES;
          this.payments = Array.isArray(parsed.payments) ? parsed.payments : SEED_PAYMENTS;
          this.expenses = Array.isArray(parsed.expenses) ? parsed.expenses : SEED_EXPENSES;
          this.investigations = Array.isArray(parsed.investigations) ? parsed.investigations : SEED_INVESTIGATIONS;
          this.auditLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : SEED_AUDIT_LOGS;
          this.settings = parsed.settings || DEFAULT_SETTINGS;
        }

        // Hydrate idempotency cache
        this.payments.forEach((p) => {
          if (p.idempotencyKey) this.idempotencyCache.add(p.idempotencyKey);
        });
        return;
      }
    } catch (e) {
      console.warn('Could not load from localStorage, initializing seed data', e);
    }

    // Default seed
    this.vendors = SEED_VENDORS;
    this.invoices = SEED_INVOICES;
    this.payments = SEED_PAYMENTS;
    this.expenses = SEED_EXPENSES;
    this.investigations = SEED_INVESTIGATIONS;
    this.auditLogs = SEED_AUDIT_LOGS;
    this.settings = DEFAULT_SETTINGS;
    this.payments.forEach((p) => {
      if (p.idempotencyKey) this.idempotencyCache.add(p.idempotencyKey);
    });
    this.saveState(false);
  }

  private saveState(isCleanMode?: boolean) {
    try {
      const cleanFlag = isCleanMode !== undefined 
        ? isCleanMode 
        : (this.vendors.length === 0 && this.invoices.length === 0);

      const data = {
        vendors: this.vendors,
        invoices: this.invoices,
        payments: this.payments,
        expenses: this.expenses,
        investigations: this.investigations,
        auditLogs: this.auditLogs,
        settings: this.settings,
        isCleanMode: cleanFlag,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to persist to localStorage', e);
    }
  }

  public isDefaultDataLoaded(): boolean {
    return this.vendors.some((v) => v.id === 'v-101' || v.id === 'v-102');
  }

  public clearAllData(reason = 'Default data rejected. Initialized clean empty database.') {
    this.vendors = [];
    this.invoices = [];
    this.payments = [];
    this.expenses = [];
    this.investigations = [];
    this.idempotencyCache.clear();
    this.auditLogs = [
      {
        id: `log-clean-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'User / Auditor',
        action: 'DEFAULT_DATA_REJECTED',
        entityType: 'SYSTEM',
        entityId: 'ALL',
        details: reason,
      },
    ];
    this.saveState(true);
  }

  public loadSampleData() {
    this.resetDemoData();
  }

  public getSettings(): SettingsConfig {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<SettingsConfig>): SettingsConfig {
    this.settings = { ...this.settings, ...newSettings };
    this.logAudit('ADMIN', 'UPDATE_SETTINGS', 'SYSTEM', 'CONFIG', `Updated system configuration thresholds.`);
    this.saveState();
    return this.getSettings();
  }

  public logAudit(user: string, action: string, entityType: string, entityId: string, details: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user,
      action,
      entityType,
      entityId,
      details,
    };
    this.auditLogs = [log, ...this.auditLogs];
    this.saveState();
  }

  // ==========================================
  // VENDOR REPOSITORY & DUPLICATE PREVENTION
  // ==========================================

  public getVendors(): Vendor[] {
    return [...this.vendors];
  }

  public getVendorById(id: string): Vendor | undefined {
    return this.vendors.find((v) => v.id === id);
  }

  public addVendor(vendorData: Omit<Vendor, 'id' | 'vendorCode' | 'riskScore' | 'riskLevel' | 'registeredAt' | 'bankHistory' | 'totalInvoiced' | 'totalPaid' | 'averageInvoiceAmount'>): Vendor {
    const gstinClean = vendorData.gstin.trim().toUpperCase();
    const bankClean = vendorData.bankAccountNumber.trim();
    const nameClean = vendorData.name.trim().toLowerCase();

    // Enforce Unique Constraint: GSTIN
    const dupGstin = this.vendors.find((v) => v.gstin.trim().toUpperCase() === gstinClean);
    if (dupGstin) {
      throw new DuplicateEntityError(
        `Duplicate Vendor Registration Blocked: A vendor with GSTIN "${gstinClean}" is already registered as "${dupGstin.name}" (${dupGstin.vendorCode}).`,
        'gstin',
        dupGstin.id
      );
    }

    // Enforce Unique Constraint: Bank Account Number
    const dupBank = this.vendors.find((v) => v.bankAccountNumber.trim() === bankClean);
    if (dupBank) {
      throw new DuplicateEntityError(
        `Duplicate Bank Account Blocked: Bank account "${bankClean}" is already associated with vendor "${dupBank.name}" (${dupBank.vendorCode}). Multiple vendors cannot share the same bank account.`,
        'bankAccountNumber',
        dupBank.id
      );
    }

    // Enforce Unique Constraint: Vendor Name
    const dupName = this.vendors.find((v) => v.name.trim().toLowerCase() === nameClean);
    if (dupName) {
      throw new DuplicateEntityError(
        `Duplicate Vendor Name: A vendor with name "${vendorData.name}" is already registered (${dupName.vendorCode}).`,
        'name',
        dupName.id
      );
    }

    const codeNum = this.vendors.length + 101;
    const newVendor: Vendor = {
      ...vendorData,
      id: `v-${codeNum}`,
      vendorCode: `VND-${String(codeNum).padStart(5, '0')}`,
      gstin: gstinClean,
      bankAccountNumber: bankClean,
      riskScore: 10,
      riskLevel: 'Safe',
      registeredAt: new Date().toISOString(),
      bankHistory: [],
      totalInvoiced: 0,
      totalPaid: 0,
      averageInvoiceAmount: 0,
    };

    this.vendors = [newVendor, ...this.vendors];
    this.logAudit('AP_OFFICER', 'VENDOR_REGISTERED', 'VENDOR', newVendor.id, `Registered new vendor "${newVendor.name}" (${newVendor.vendorCode}) with GSTIN ${newVendor.gstin}.`);
    this.saveState();
    return newVendor;
  }

  public updateVendorBank(vendorId: string, newAccount: string, newIfsc: string, newBankName: string, reason: string, updatedBy: string): Vendor {
    const vendorIndex = this.vendors.findIndex((v) => v.id === vendorId);
    if (vendorIndex === -1) throw new Error('Vendor not found');

    const v = this.vendors[vendorIndex];
    const cleanAccount = newAccount.trim();

    // Check if new account already used by another vendor
    const existing = this.vendors.find((other) => other.id !== vendorId && other.bankAccountNumber.trim() === cleanAccount);
    if (existing) {
      throw new DuplicateEntityError(`Bank account "${cleanAccount}" is already registered to "${existing.name}". Cannot assign duplicate bank accounts.`, 'bankAccountNumber', existing.id);
    }

    const historyItem = {
      bankAccountNumber: v.bankAccountNumber,
      bankIfsc: v.bankIfsc,
      bankName: v.bankName,
      changedAt: new Date().toISOString(),
      changedBy: updatedBy,
      reason,
    };

    const updatedVendor: Vendor = {
      ...v,
      bankAccountNumber: cleanAccount,
      bankIfsc: newIfsc.trim().toUpperCase(),
      bankName: newBankName.trim(),
      lastBankChangeDate: new Date().toISOString(),
      bankHistory: [historyItem, ...(v.bankHistory || [])],
      riskScore: Math.min(100, v.riskScore + 30),
      riskLevel: v.riskScore + 30 >= 60 ? 'High Risk' : 'Suspicious',
    };

    this.vendors[vendorIndex] = updatedVendor;
    this.logAudit(updatedBy, 'VENDOR_BANK_CHANGED', 'VENDOR', vendorId, `Updated bank account for "${v.name}" to ${cleanAccount} (${newBankName}). Flagged for lookback risk.`);
    this.saveState();
    return updatedVendor;
  }

  // ==========================================
  // INVOICE REPOSITORY & DUPLICATE PREVENTION
  // ==========================================

  public getInvoices(): Invoice[] {
    return [...this.invoices];
  }

  public getInvoiceById(id: string): Invoice | undefined {
    return this.invoices.find((i) => i.id === id);
  }

  /**
   * Add Invoice with Strict Backend Validation and Duplicate Detection
   */
  public addInvoice(invoiceData: Omit<Invoice, 'id' | 'riskScore' | 'riskLevel' | 'fraudReasons' | 'isDuplicate' | 'createdAt'>): Invoice {
    const invNoClean = invoiceData.invoiceNumber.trim();
    const vendor = this.vendors.find((v) => v.id === invoiceData.vendorId);
    if (!vendor) {
      throw new ValidationError(`Vendor with ID "${invoiceData.vendorId}" does not exist in master directory.`);
    }

    // Backend Unique Constraint Check: Same Invoice Number + Same Vendor
    const existingExact = this.invoices.find(
      (inv) =>
        inv.vendorId === invoiceData.vendorId &&
        inv.invoiceNumber.trim().toLowerCase() === invNoClean.toLowerCase()
    );

    if (existingExact) {
      // Record blocked duplicate attempt in audit log and create Investigation Case
      const preventedAmt = Number(invoiceData.amount || 0);
      this.createInvestigationCase({
        entityType: 'INVOICE',
        entityId: existingExact.id,
        entityReference: `${invNoClean} (${vendor.name})`,
        fraudType: 'DUPLICATE_INVOICE',
        involvedParty: vendor.name,
        amountInvolved: preventedAmt,
        riskScore: 95,
        riskLevel: 'Blocked',
        evidence: [
          { label: 'Duplicate Invoice #', detail: invNoClean, severity: 'Critical' },
          { label: 'Existing Invoice ID', detail: existingExact.id, severity: 'Critical' },
          { label: 'Prevented Amount', detail: `₹${preventedAmt.toLocaleString('en-IN')}`, severity: 'Warning' },
        ],
        preventedAmount: preventedAmt,
      });

      this.logAudit(
        'SYSTEM_GATEWAY',
        'DUPLICATE_INVOICE_REJECTED',
        'INVOICE',
        existingExact.id,
        `Rejected duplicate invoice #${invNoClean} for vendor ${vendor.name} (Amount: ₹${preventedAmt.toLocaleString('en-IN')}).`
      );

      throw new DuplicateEntityError(
        `DUPLICATE INVOICE REJECTED: Invoice #${invNoClean} was already submitted for vendor "${vendor.name}" on ${formatDate(existingExact.issueDate)} for ₹${existingExact.amount.toLocaleString('en-IN')} (Status: ${existingExact.status}). Duplicate submissions are blocked by corporate financial integrity rules.`,
        'invoiceNumber',
        existingExact.id
      );
    }

    // Run Fraud Detection Engine
    const assessment = assessInvoiceFraud(invoiceData, this.invoices, this.vendors, this.settings);

    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber: invNoClean,
      vendorName: vendor.name,
      vendorGstin: vendor.gstin,
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel,
      fraudReasons: assessment.triggeredRules.map((r) => r.reason),
      isDuplicate: assessment.triggeredRules.some((r) => r.ruleId === 'EXACT_DUPLICATE_INVOICE'),
      status: assessment.riskLevel === 'Blocked' ? 'Flagged' : assessment.riskLevel === 'High Risk' ? 'Flagged' : 'Pending Approval',
      createdAt: new Date().toISOString(),
    };

    this.invoices = [newInvoice, ...this.invoices];

    // Update vendor total invoiced and average amount
    vendor.totalInvoiced += newInvoice.amount;
    const vendorInvoices = this.invoices.filter((i) => i.vendorId === vendor.id);
    vendor.averageInvoiceAmount = Math.round(vendor.totalInvoiced / vendorInvoices.length);

    // If High Risk or Blocked, automatically spawn Investigation Case
    if (assessment.riskLevel === 'High Risk' || assessment.riskLevel === 'Blocked') {
      const primaryFraudType = assessment.triggeredRules[0]?.ruleId === 'SUSPICIOUS_BANK_CHANGE'
        ? 'SUSPICIOUS_BANK_CHANGE'
        : assessment.triggeredRules[0]?.ruleId === 'INFLATED_INVOICE_AMOUNT'
        ? 'INFLATED_INVOICE_AMOUNT'
        : 'DUPLICATE_INVOICE';

      this.createInvestigationCase({
        entityType: 'INVOICE',
        entityId: newInvoice.id,
        entityReference: `${newInvoice.invoiceNumber} (${vendor.name})`,
        fraudType: primaryFraudType,
        involvedParty: vendor.name,
        amountInvolved: newInvoice.amount,
        riskScore: newInvoice.riskScore,
        riskLevel: newInvoice.riskLevel,
        evidence: assessment.evidence,
        preventedAmount: newInvoice.amount,
      });
    }

    this.logAudit('AP_CLERK', 'INVOICE_CREATED', 'INVOICE', newInvoice.id, `Created invoice #${newInvoice.invoiceNumber} for ${vendor.name} (Amount: ₹${newInvoice.amount.toLocaleString('en-IN')}, Risk: ${newInvoice.riskLevel} - ${newInvoice.riskScore} pts).`);
    this.saveState();
    return newInvoice;
  }

  // ==========================================
  // PAYMENT REPOSITORY & IDEMPOTENCY ENGINE
  // ==========================================

  public getPayments(): Payment[] {
    return [...this.payments];
  }

  /**
   * Process Payment with Idempotency Key and Double-Submission Prevention
   */
  public addPayment(paymentData: Omit<Payment, 'id' | 'riskScore' | 'riskLevel' | 'fraudReasons' | 'isSplitPayment' | 'createdAt'>): Payment {
    const idempKey = paymentData.idempotencyKey.trim();
    const payRef = paymentData.paymentReference.trim();

    // Enforce Idempotency Key Constraint
    if (this.idempotencyCache.has(idempKey)) {
      const existing = this.payments.find((p) => p.idempotencyKey === idempKey);
      if (existing) {
        this.logAudit('SYSTEM_GATEWAY', 'IDEMPOTENT_DUPLICATE_IGNORED', 'PAYMENT', existing.id, `Idempotency match for key "${idempKey}". Prevented duplicate payout of ₹${paymentData.amount.toLocaleString('en-IN')}.`);
        return existing;
      }
    }

    // Enforce Payment Reference Unique Constraint
    const dupRef = this.payments.find((p) => p.paymentReference.toLowerCase() === payRef.toLowerCase());
    if (dupRef) {
      throw new DuplicateEntityError(
        `DUPLICATE PAYMENT BLOCKED: Transaction reference "${payRef}" has already been processed. Prevented duplicate disbursement.`,
        'paymentReference',
        dupRef.id
      );
    }

    // Run Fraud Engine
    const assessment = assessPaymentFraud(paymentData, this.payments, this.vendors, this.settings);
    const isSplit = assessment.triggeredRules.some((r) => r.ruleId === 'SPLIT_PAYMENT_AVOID_APPROVAL');

    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      paymentReference: payRef,
      idempotencyKey: idempKey,
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel,
      fraudReasons: assessment.triggeredRules.map((r) => r.reason),
      isSplitPayment: isSplit,
      status: assessment.riskLevel === 'Blocked' ? 'Blocked' : assessment.riskLevel === 'High Risk' ? 'Held' : 'Completed',
      createdAt: new Date().toISOString(),
    };

    this.idempotencyCache.add(idempKey);
    this.payments = [newPayment, ...this.payments];

    // If completed, update vendor total paid
    if (newPayment.status === 'Completed') {
      const vendor = this.vendors.find((v) => v.id === newPayment.vendorId);
      if (vendor) vendor.totalPaid += newPayment.amount;
    }

    // If Held or Blocked, generate Investigation Case
    if (newPayment.status === 'Held' || newPayment.status === 'Blocked') {
      this.createInvestigationCase({
        entityType: 'PAYMENT',
        entityId: newPayment.id,
        entityReference: `${newPayment.paymentReference} (${newPayment.vendorName})`,
        fraudType: isSplit ? 'SPLIT_PAYMENT_AVOID_APPROVAL' : 'UNAUTHORIZED_PAYMENT',
        involvedParty: newPayment.vendorName,
        amountInvolved: newPayment.amount,
        riskScore: newPayment.riskScore,
        riskLevel: newPayment.riskLevel,
        evidence: assessment.evidence,
        preventedAmount: newPayment.amount,
      });
    }

    this.logAudit('PAYMENT_SERVICE', 'PAYMENT_SUBMITTED', 'PAYMENT', newPayment.id, `Submitted payment ${newPayment.paymentReference} for ${newPayment.vendorName} (Amount: ₹${newPayment.amount.toLocaleString('en-IN')}, Status: ${newPayment.status}).`);
    this.saveState();
    return newPayment;
  }

  // ==========================================
  // EMPLOYEE EXPENSES & DUPLICATE RECEIPTS
  // ==========================================

  public getExpenses(): EmployeeExpense[] {
    return [...this.expenses];
  }

  public addExpense(expenseData: Omit<EmployeeExpense, 'id' | 'riskScore' | 'riskLevel' | 'fraudReasons' | 'isDuplicateReceipt' | 'createdAt'>): EmployeeExpense {
    const receiptClean = expenseData.receiptNumber.trim();
    const empIdClean = expenseData.employeeId.trim();

    // Check exact duplicate receipt for this employee
    const dupReceipt = this.expenses.find(
      (e) =>
        e.employeeId === empIdClean &&
        e.receiptNumber.trim().toLowerCase() === receiptClean.toLowerCase()
    );

    if (dupReceipt) {
      const preventedAmt = Number(expenseData.amount || 0);
      this.createInvestigationCase({
        entityType: 'EXPENSE',
        entityId: dupReceipt.id,
        entityReference: `Receipt #${receiptClean} (${expenseData.employeeName})`,
        fraudType: 'EMPLOYEE_EXPENSE_FRAUD',
        involvedParty: `${expenseData.employeeName} (${empIdClean})`,
        amountInvolved: preventedAmt,
        riskScore: 90,
        riskLevel: 'Blocked',
        evidence: [
          { label: 'Duplicate Receipt #', detail: receiptClean, severity: 'Critical' },
          { label: 'Prior Claim Ref', detail: dupReceipt.claimReference, severity: 'Critical' },
          { label: 'Prevented Reclaim', detail: `₹${preventedAmt.toLocaleString('en-IN')}`, severity: 'Warning' },
        ],
        preventedAmount: preventedAmt,
      });

      this.logAudit('EXPENSE_PORTAL', 'DUPLICATE_RECEIPT_BLOCKED', 'EXPENSE', dupReceipt.id, `Blocked duplicate expense receipt #${receiptClean} claimed by ${expenseData.employeeName} (${empIdClean}).`);

      throw new DuplicateEntityError(
        `DUPLICATE EXPENSE RECEIPT REJECTED: Receipt #${receiptClean} has already been claimed on expense report "${dupReceipt.claimReference}" for ₹${dupReceipt.amount.toLocaleString('en-IN')}. Duplicate receipt submissions violate corporate expense integrity policies.`,
        'receiptNumber',
        dupReceipt.id
      );
    }

    const assessment = assessExpenseFraud(expenseData, this.expenses);
    const isDup = assessment.triggeredRules.some((r) => r.ruleId === 'DUPLICATE_RECEIPT_NUMBER' || r.ruleId === 'REPEATED_EXPENSE_CLAIM');

    const newExpense: EmployeeExpense = {
      ...expenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      receiptNumber: receiptClean,
      employeeId: empIdClean,
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel,
      fraudReasons: assessment.triggeredRules.map((r) => r.reason),
      isDuplicateReceipt: isDup,
      status: assessment.riskLevel === 'Blocked' || assessment.riskLevel === 'High Risk' ? 'Flagged Duplicate' : 'Submitted',
      createdAt: new Date().toISOString(),
    };

    this.expenses = [newExpense, ...this.expenses];

    if (assessment.riskLevel === 'High Risk' || assessment.riskLevel === 'Blocked') {
      this.createInvestigationCase({
        entityType: 'EXPENSE',
        entityId: newExpense.id,
        entityReference: `${newExpense.claimReference} (${newExpense.employeeName})`,
        fraudType: 'EMPLOYEE_EXPENSE_FRAUD',
        involvedParty: `${newExpense.employeeName} (${newExpense.employeeId})`,
        amountInvolved: newExpense.amount,
        riskScore: newExpense.riskScore,
        riskLevel: newExpense.riskLevel,
        evidence: assessment.evidence,
        preventedAmount: newExpense.amount,
      });
    }

    this.logAudit('EMPLOYEE_PORTAL', 'EXPENSE_SUBMITTED', 'EXPENSE', newExpense.id, `Submitted expense claim ${newExpense.claimReference} by ${newExpense.employeeName} (Amount: ₹${newExpense.amount.toLocaleString('en-IN')}, Status: ${newExpense.status}).`);
    this.saveState();
    return newExpense;
  }

  // ==========================================
  // INVESTIGATION QUEUE & DECISION AUDIT
  // ==========================================

  public getInvestigations(): InvestigationCase[] {
    return [...this.investigations];
  }

  public getInvestigationById(id: string): InvestigationCase | undefined {
    return this.investigations.find((c) => c.id === id);
  }

  public createInvestigationCase(data: Omit<InvestigationCase, 'id' | 'caseId' | 'detectionDate' | 'status' | 'reviewerComments' | 'updatedAt'>): InvestigationCase {
    const caseNum = this.investigations.length + 1;
    const newCase: InvestigationCase = {
      ...data,
      id: `case-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      caseId: `CASE-2026-${String(caseNum).padStart(3, '0')}`,
      detectionDate: new Date().toISOString(),
      status: 'Under Investigation',
      reviewerComments: [],
      updatedAt: new Date().toISOString(),
    };
    this.investigations = [newCase, ...this.investigations];
    this.saveState();
    return newCase;
  }

  public updateInvestigationStatus(
    caseId: string,
    newStatus: InvestigationCase['status'],
    commentText: string,
    author: string = 'Auditor'
  ): InvestigationCase {
    const caseIndex = this.investigations.findIndex((c) => c.id === caseId);
    if (caseIndex === -1) throw new Error('Case not found');

    const currentCase = this.investigations[caseIndex];
    const newComment = {
      id: `comm-${Date.now()}`,
      author,
      role: 'Fraud Investigation Specialist',
      comment: commentText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedCase: InvestigationCase = {
      ...currentCase,
      status: newStatus,
      reviewerComments: [newComment, ...currentCase.reviewerComments],
      updatedAt: new Date().toISOString(),
    };

    this.investigations[caseIndex] = updatedCase;

    // Log decision in audit trail
    this.logAudit(
      author,
      `CASE_STATUS_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
      'INVESTIGATION',
      caseId,
      `Case ${currentCase.caseId} (${currentCase.fraudType}) status updated to "${newStatus}". Note: "${commentText.trim()}".`
    );

    this.saveState();
    return updatedCase;
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  // ==========================================
  // DASHBOARD RECONCILED CALCULATIONS
  // ==========================================

  public getDashboardStats(): DashboardStats {
    const totalInvoicesCount = this.invoices.length;
    const totalInvoicesValue = this.invoices.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalVendorsCount = this.vendors.length;
    const totalPaymentsCount = this.payments.length;
    const totalPaymentsValue = this.payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalExpensesCount = this.expenses.length;
    const totalExpensesValue = this.expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const fraudCasesDetected = this.investigations.length;
    const pendingInvestigations = this.investigations.filter((c) => c.status === 'Under Investigation').length;
    const confirmedFraudCases = this.investigations.filter((c) => c.status === 'Confirmed Fraud').length;

    // Estimated Financial Exposure = sum of active (Under Investigation) fraud cases
    const estimatedFinancialExposure = this.investigations
      .filter((c) => c.status === 'Under Investigation')
      .reduce((sum, c) => sum + (c.amountInvolved || 0), 0);

    // Amount Prevented = sum of prevented amounts from blocked/quarantined items and confirmed fraud
    const amountPreventedDuplicatePayments = this.investigations
      .filter((c) => c.status === 'Confirmed Fraud' || c.status === 'Under Investigation')
      .reduce((sum, c) => sum + (c.preventedAmount || 0), 0);

    return {
      totalInvoicesCount,
      totalInvoicesValue,
      totalVendorsCount,
      totalPaymentsCount,
      totalPaymentsValue,
      totalExpensesCount,
      totalExpensesValue,
      fraudCasesDetected,
      pendingInvestigations,
      confirmedFraudCases,
      estimatedFinancialExposure,
      amountPreventedDuplicatePayments,
    };
  }

  // ==========================================
  // BACKUP & RESTORE & CSV EXPORT
  // ==========================================

  public exportBackupJson(): string {
    const state = {
      vendors: this.vendors,
      invoices: this.invoices,
      payments: this.payments,
      expenses: this.expenses,
      investigations: this.investigations,
      auditLogs: this.auditLogs,
      settings: this.settings,
      exportedAt: new Date().toISOString(),
      platform: 'TrustLedger AI',
    };
    return JSON.stringify(state, null, 2);
  }

  public importBackupJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.vendors || !parsed.invoices) throw new Error('Invalid backup schema');
      this.vendors = parsed.vendors;
      this.invoices = parsed.invoices;
      this.payments = parsed.payments || [];
      this.expenses = parsed.expenses || [];
      this.investigations = parsed.investigations || [];
      this.auditLogs = parsed.auditLogs || [];
      this.settings = parsed.settings || DEFAULT_SETTINGS;
      this.saveState();
      this.logAudit('ADMIN', 'SYSTEM_RESTORE', 'SYSTEM', 'BACKUP', 'Restored complete database state from JSON backup.');
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }

  public batchImportCustomData(data: {
    vendors?: any[];
    invoices?: any[];
    payments?: any[];
    expenses?: any[];
  }): { addedVendors: number; addedInvoices: number; addedPayments: number; addedExpenses: number; errors: string[] } {
    const errors: string[] = [];
    let addedVendors = 0;
    let addedInvoices = 0;
    let addedPayments = 0;
    let addedExpenses = 0;

    if (Array.isArray(data.vendors)) {
      data.vendors.forEach((v) => {
        try {
          this.addVendor(v);
          addedVendors++;
        } catch (e: any) {
          errors.push(`Vendor "${v.name || 'Unknown'}": ${e.message}`);
        }
      });
    }

    if (Array.isArray(data.invoices)) {
      data.invoices.forEach((i) => {
        try {
          let resolvedVendorId = i.vendorId;
          if (!resolvedVendorId || !this.vendors.some((v) => v.id === resolvedVendorId)) {
            const matched = this.vendors.find(
              (v) => v.name.trim().toLowerCase() === (i.vendorName || '').trim().toLowerCase()
            );
            if (matched) {
              resolvedVendorId = matched.id;
            }
          }
          this.addInvoice({ ...i, vendorId: resolvedVendorId });
          addedInvoices++;
        } catch (e: any) {
          errors.push(`Invoice #${i.invoiceNumber || 'Unknown'}: ${e.message}`);
        }
      });
    }

    if (Array.isArray(data.payments)) {
      data.payments.forEach((p) => {
        try {
          this.addPayment(p);
          addedPayments++;
        } catch (e: any) {
          errors.push(`Payment "${p.paymentReference || 'Unknown'}": ${e.message}`);
        }
      });
    }

    if (Array.isArray(data.expenses)) {
      data.expenses.forEach((ex) => {
        try {
          this.addExpense(ex);
          addedExpenses++;
        } catch (e: any) {
          errors.push(`Expense Receipt #${ex.receiptNumber || 'Unknown'}: ${e.message}`);
        }
      });
    }

    this.saveState(this.vendors.length === 0 && this.invoices.length === 0);
    return { addedVendors, addedInvoices, addedPayments, addedExpenses, errors };
  }

  public resetDemoData() {
    this.vendors = SEED_VENDORS;
    this.invoices = SEED_INVOICES;
    this.payments = SEED_PAYMENTS;
    this.expenses = SEED_EXPENSES;
    this.investigations = SEED_INVESTIGATIONS;
    this.auditLogs = [
      {
        id: `log-reset-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Admin',
        action: 'RESET_DEMO_DATA',
        entityType: 'SYSTEM',
        entityId: 'ALL',
        details: 'Reset system database to verified initial enterprise demo state.',
      },
    ];
    this.settings = DEFAULT_SETTINGS;
    this.saveState();
  }

  public exportTableToCsv(tableName: 'invoices' | 'vendors' | 'payments' | 'expenses' | 'investigations' | 'audit'): string {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (tableName === 'invoices') {
      headers = ['ID', 'Invoice Number', 'Vendor Name', 'GSTIN', 'Amount', 'Date', 'Status', 'Risk Level', 'Risk Score'];
      rows = this.invoices.map((i) => [i.id, i.invoiceNumber, i.vendorName, i.vendorGstin || '', i.amount, i.issueDate, i.status, i.riskLevel, i.riskScore]);
    } else if (tableName === 'vendors') {
      headers = ['ID', 'Vendor Code', 'Name', 'GSTIN', 'Category', 'Bank Account', 'IFSC', 'Status', 'Risk Score', 'Total Invoiced'];
      rows = this.vendors.map((v) => [v.id, v.vendorCode, v.name, v.gstin, v.category, v.bankAccountNumber, v.bankIfsc, v.status, v.riskScore, v.totalInvoiced]);
    } else if (tableName === 'payments') {
      headers = ['ID', 'Payment Reference', 'Invoice ID', 'Vendor', 'Amount', 'Method', 'Account', 'Status', 'Risk Level'];
      rows = this.payments.map((p) => [p.id, p.paymentReference, p.invoiceNumber, p.vendorName, p.amount, p.paymentMethod, p.beneficiaryAccount, p.status, p.riskLevel]);
    } else if (tableName === 'expenses') {
      headers = ['ID', 'Claim Reference', 'Employee', 'Department', 'Receipt #', 'Category', 'Amount', 'Date', 'Status'];
      rows = this.expenses.map((e) => [e.id, e.claimReference, e.employeeName, e.department, e.receiptNumber, e.expenseCategory, e.amount, e.expenseDate, e.status]);
    } else if (tableName === 'investigations') {
      headers = ['Case ID', 'Entity Type', 'Reference', 'Fraud Type', 'Involved Party', 'Amount', 'Risk Score', 'Status', 'Date'];
      rows = this.investigations.map((c) => [c.caseId, c.entityType, c.entityReference, c.fraudType, c.involvedParty, c.amountInvolved, c.riskScore, c.status, c.detectionDate]);
    } else {
      headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details'];
      rows = this.auditLogs.map((l) => [l.timestamp, l.user, l.action, l.entityType, l.entityId, l.details]);
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    return csvContent;
  }
}

// Global Singleton Instance
export const db = new DatabaseService();
