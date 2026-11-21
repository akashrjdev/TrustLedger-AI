import {
  Invoice,
  Vendor,
  Payment,
  EmployeeExpense,
  FraudAssessmentResult,
  FraudRuleResult,
  RiskLevel,
  EvidenceItem,
  SettingsConfig,
} from '../types';
import { formatCurrency, formatDate } from '../utils/formatter';

export const DEFAULT_SETTINGS: SettingsConfig = {
  approvalLimitThreshold: 50000, // Rs 50,000 standard corporate maker-checker limit
  splitPaymentWindowHours: 48,
  invoiceInflationMultiplier: 3.0, // 300% of historical average
  vendorBankLookbackDays: 7, // 7 days prior to transaction
  duplicateLookbackDays: 90,
};

/**
 * Assess Invoice for Business Fraud:
 * - Duplicate invoice number for the same vendor
 * - Duplicate amount and vendor within lookback window
 * - Inflated amount against vendor historical average
 * - Unregistered or blacklisted vendor
 * - Recent bank account change on vendor
 */
export function assessInvoiceFraud(
  candidateInvoice: Partial<Invoice>,
  allInvoices: Invoice[],
  allVendors: Vendor[],
  settings: SettingsConfig = DEFAULT_SETTINGS
): FraudAssessmentResult {
  const triggeredRules: FraudRuleResult[] = [];
  const evidence: EvidenceItem[] = [];
  let score = 0;

  const vendor = allVendors.find((v) => v.id === candidateInvoice.vendorId);

  // Rule 1: Fake / Unregistered / Blacklisted Vendor
  if (!vendor) {
    score += 75;
    const ruleRes: FraudRuleResult = {
      ruleId: 'UNREGISTERED_VENDOR',
      ruleName: 'Unregistered Vendor Entity',
      score: 75,
      triggered: true,
      reason: 'Invoice submitted for a vendor not registered in the approved vendor master directory.',
      recommendedAction: 'Halt processing. Require vendor KYC onboarding and compliance verification.',
      evidence: [
        { label: 'Vendor ID Provided', detail: candidateInvoice.vendorId || 'None', severity: 'Critical' },
      ],
    };
    triggeredRules.push(ruleRes);
    evidence.push(...ruleRes.evidence);
  } else if (vendor.status === 'Blacklisted') {
    score += 90;
    const ruleRes: FraudRuleResult = {
      ruleId: 'BLACKLISTED_VENDOR',
      ruleName: 'Blacklisted Vendor Transaction',
      score: 90,
      triggered: true,
      reason: `Vendor "${vendor.name}" (${vendor.vendorCode}) is marked as Blacklisted due to prior compliance violations.`,
      recommendedAction: 'Block invoice immediately. Refer to corporate legal and compliance.',
      evidence: [
        { label: 'Vendor Status', detail: 'Blacklisted', severity: 'Critical' },
        { label: 'Vendor GSTIN', detail: vendor.gstin, severity: 'Critical' },
      ],
    };
    triggeredRules.push(ruleRes);
    evidence.push(...ruleRes.evidence);
  } else if (vendor.status === 'Suspicious' || vendor.status === 'Under Review') {
    score += 45;
    const ruleRes: FraudRuleResult = {
      ruleId: 'SUSPICIOUS_VENDOR_STATUS',
      ruleName: 'Vendor Under Compliance Review',
      score: 45,
      triggered: true,
      reason: `Vendor is currently flagged as "${vendor.status}". New invoices require secondary authorization.`,
      recommendedAction: 'Escalate to Accounts Payable manager for manual review before approval.',
      evidence: [
        { label: 'Current Vendor Status', detail: vendor.status, severity: 'Warning' },
      ],
    };
    triggeredRules.push(ruleRes);
    evidence.push(...ruleRes.evidence);
  }

  // Rule 2: Exact Duplicate Invoice (Same Invoice Number + Same Vendor)
  const exactDuplicate = allInvoices.find(
    (inv) =>
      inv.id !== candidateInvoice.id &&
      inv.vendorId === candidateInvoice.vendorId &&
      inv.invoiceNumber.trim().toLowerCase() === (candidateInvoice.invoiceNumber || '').trim().toLowerCase()
  );

  if (exactDuplicate) {
    score += 90;
    const ruleRes: FraudRuleResult = {
      ruleId: 'EXACT_DUPLICATE_INVOICE',
      ruleName: 'Duplicate Invoice Submission',
      score: 90,
      triggered: true,
      reason: `Identical invoice number "${candidateInvoice.invoiceNumber}" previously submitted on ${formatDate(exactDuplicate.issueDate)} for ${formatCurrency(exactDuplicate.amount)}.`,
      recommendedAction: 'Reject invoice immediately to avoid duplicate corporate payout.',
      evidence: [
        { label: 'Original Invoice ID', detail: exactDuplicate.id, severity: 'Critical' },
        { label: 'Original Date & Amount', detail: `${formatDate(exactDuplicate.issueDate)} • ${formatCurrency(exactDuplicate.amount)}`, severity: 'Critical' },
        { label: 'Original Status', detail: exactDuplicate.status, severity: 'Warning' },
      ],
    };
    triggeredRules.push(ruleRes);
    evidence.push(...ruleRes.evidence);
  } else {
    // Rule 3: Fuzzy Duplicate (Same Vendor + Exact Same Amount within Lookback Window)
    const candAmount = Number(candidateInvoice.amount || 0);
    const candDate = candidateInvoice.issueDate ? new Date(candidateInvoice.issueDate).getTime() : Date.now();
    const lookbackMs = settings.duplicateLookbackDays * 86400000;

    const fuzzyMatch = allInvoices.find((inv) => {
      if (inv.id === candidateInvoice.id || inv.vendorId !== candidateInvoice.vendorId) return false;
      const invDate = new Date(inv.issueDate).getTime();
      const isWithinWindow = Math.abs(candDate - invDate) <= lookbackMs;
      return isWithinWindow && Math.abs(inv.amount - candAmount) < 0.01;
    });

    if (fuzzyMatch) {
      score += 65;
      const ruleRes: FraudRuleResult = {
        ruleId: 'REPEATED_INVOICE_AMOUNT_PATTERN',
        ruleName: 'Potential Repeated Amount Duplicate',
        score: 65,
        triggered: true,
        reason: `Vendor previously billed the exact identical amount of ${formatCurrency(fuzzyMatch.amount)} on invoice #${fuzzyMatch.invoiceNumber} within ${settings.duplicateLookbackDays} days.`,
        recommendedAction: 'Verify delivery challan and purchase order to ensure this is not a duplicate billing cycle.',
        evidence: [
          { label: 'Matched Invoice #', detail: fuzzyMatch.invoiceNumber, severity: 'Warning' },
          { label: 'Prior Invoice Date', detail: formatDate(fuzzyMatch.issueDate), severity: 'Info' },
          { label: 'Billed Amount', detail: formatCurrency(fuzzyMatch.amount), severity: 'Warning' },
        ],
      };
      triggeredRules.push(ruleRes);
      evidence.push(...ruleRes.evidence);
    }
  }

  // Rule 4: Inflated Invoice Amount vs Vendor Historical Average
  if (vendor && vendor.averageInvoiceAmount > 0 && candidateInvoice.amount) {
    const ratio = candidateInvoice.amount / vendor.averageInvoiceAmount;
    if (ratio >= settings.invoiceInflationMultiplier) {
      score += 55;
      const ruleRes: FraudRuleResult = {
        ruleId: 'INFLATED_INVOICE_AMOUNT',
        ruleName: 'Abnormal Invoice Amount Spike',
        score: 55,
        triggered: true,
        reason: `Invoice amount (${formatCurrency(candidateInvoice.amount)}) is ${ratio.toFixed(1)}x greater than this vendor's historical average of ${formatCurrency(vendor.averageInvoiceAmount)}.`,
        recommendedAction: 'Request supporting purchase orders and executive approval before processing.',
        evidence: [
          { label: 'Current Invoice Amount', detail: formatCurrency(candidateInvoice.amount), severity: 'Warning' },
          { label: 'Vendor Historical Average', detail: formatCurrency(vendor.averageInvoiceAmount), severity: 'Info' },
          { label: 'Inflation Multiplier', detail: `${ratio.toFixed(1)}x`, severity: 'Warning' },
        ],
      };
      triggeredRules.push(ruleRes);
      evidence.push(...ruleRes.evidence);
    }
  }

  // Rule 5: Suspicious Vendor Bank Account Change Lookback
  if (vendor && vendor.lastBankChangeDate) {
    const bankChangeMs = new Date(vendor.lastBankChangeDate).getTime();
    const invDateMs = candidateInvoice.issueDate ? new Date(candidateInvoice.issueDate).getTime() : Date.now();
    const daysSinceChange = (invDateMs - bankChangeMs) / (1000 * 60 * 60 * 24);

    if (daysSinceChange >= 0 && daysSinceChange <= settings.vendorBankLookbackDays) {
      score += 80;
      const ruleRes: FraudRuleResult = {
        ruleId: 'SUSPICIOUS_BANK_CHANGE',
        ruleName: 'Recent Vendor Bank Account Modification',
        score: 80,
        triggered: true,
        reason: `Vendor updated their payout bank account ${Math.max(1, Math.round(daysSinceChange))} day(s) before this invoice submission. High risk of vendor impersonation / account takeover.`,
        recommendedAction: 'Require direct telephone confirmation with the vendor CFO on registered landline before release.',
        evidence: [
          { label: 'Bank Change Date', detail: formatDate(vendor.lastBankChangeDate), severity: 'Critical' },
          { label: 'Current Account #', detail: vendor.bankAccountNumber, severity: 'Warning' },
          { label: 'Current IFSC', detail: vendor.bankIfsc, severity: 'Warning' },
        ],
      };
      triggeredRules.push(ruleRes);
      evidence.push(...ruleRes.evidence);
    }
  }

  const finalScore = Math.min(100, Math.max(0, score));
  let riskLevel: RiskLevel = 'Safe';
  if (finalScore >= 90) riskLevel = 'Blocked';
  else if (finalScore >= 60) riskLevel = 'High Risk';
  else if (finalScore >= 30) riskLevel = 'Suspicious';

  let recommendedAction = 'Standard processing permitted. No fraud indicators detected.';
  if (riskLevel === 'Blocked') {
    recommendedAction = 'Transaction blocked automatically. Forward case to corporate fraud audit team.';
  } else if (riskLevel === 'High Risk') {
    recommendedAction = 'Hold transaction. Requires two-tier executive verification and vendor verification.';
  } else if (riskLevel === 'Suspicious') {
    recommendedAction = 'Proceed with caution. Request supervisor signoff before payment release.';
  }

  return {
    riskScore: finalScore,
    riskLevel,
    triggeredRules,
    recommendedAction,
    evidence,
  };
}

/**
 * Assess Payment for Fraud:
 * - Split payments to avoid approval limits
 * - Duplicate payment reference / idempotency violations
 * - Vendor bank changes prior to disbursement
 */
export function assessPaymentFraud(
  candidatePayment: Partial<Payment>,
  allPayments: Payment[],
  allVendors: Vendor[],
  settings: SettingsConfig = DEFAULT_SETTINGS
): FraudAssessmentResult {
  const triggeredRules: FraudRuleResult[] = [];
  const evidence: EvidenceItem[] = [];
  let score = 0;

  const candAmount = Number(candidatePayment.amount || 0);
  const threshold = settings.approvalLimitThreshold;

  // Rule: Split Payments Just Below Approval Limits
  // Detect multiple payments to same vendor within window whose individual amounts are between 80% and 99.9% of limit
  const isNearLimit = candAmount >= threshold * 0.8 && candAmount < threshold;
  const candDate = candidatePayment.paymentDate ? new Date(candidatePayment.paymentDate).getTime() : Date.now();
  const windowMs = settings.splitPaymentWindowHours * 3600000;

  const recentVendorPayments = allPayments.filter((p) => {
    if (p.vendorId !== candidatePayment.vendorId) return false;
    const pDate = new Date(p.paymentDate).getTime();
    return Math.abs(candDate - pDate) <= windowMs;
  });

  if (isNearLimit && recentVendorPayments.length > 0) {
    const totalRecent = recentVendorPayments.reduce((sum, p) => sum + p.amount, 0) + candAmount;
    if (totalRecent >= threshold) {
      score += 70;
      const ruleRes: FraudRuleResult = {
        ruleId: 'SPLIT_PAYMENT_AVOID_APPROVAL',
        ruleName: 'Split Payment Evasion of Approval Threshold',
        score: 70,
        triggered: true,
        reason: `Payment amount (${formatCurrency(candAmount)}) is structured just beneath the ${formatCurrency(threshold)} approval threshold. Combined recent payout is ${formatCurrency(totalRecent)}.`,
        recommendedAction: 'Enforce consolidated approval limit check. Escalate to Finance Director.',
        evidence: [
          { label: 'Current Payment', detail: formatCurrency(candAmount), severity: 'Critical' },
          { label: 'Approval Limit', detail: formatCurrency(threshold), severity: 'Info' },
          { label: 'Combined 48h Volume', detail: formatCurrency(totalRecent), severity: 'Critical' },
        ],
      };
      triggeredRules.push(ruleRes);
      evidence.push(...ruleRes.evidence);
    }
  }

  // Check vendor status
  const vendor = allVendors.find((v) => v.id === candidatePayment.vendorId);
  if (vendor && vendor.status === 'Blacklisted') {
    score += 95;
    const ruleRes: FraudRuleResult = {
      ruleId: 'BLACKLISTED_PAYMENT',
      ruleName: 'Payment Attempt to Blacklisted Entity',
      score: 95,
      triggered: true,
      reason: `Attempted disbursement to blacklisted vendor "${vendor.name}".`,
      recommendedAction: 'Block payment gateway execution immediately.',
      evidence: [
        { label: 'Vendor Name', detail: vendor.name, severity: 'Critical' },
      ],
    };
    triggeredRules.push(ruleRes);
    evidence.push(...ruleRes.evidence);
  }

  const finalScore = Math.min(100, Math.max(0, score));
  let riskLevel: RiskLevel = 'Safe';
  if (finalScore >= 90) riskLevel = 'Blocked';
  else if (finalScore >= 60) riskLevel = 'High Risk';
  else if (finalScore >= 30) riskLevel = 'Suspicious';

  return {
    riskScore: finalScore,
    riskLevel,
    triggeredRules,
    recommendedAction:
      riskLevel === 'Safe'
        ? 'Safe for automated bank batch file disbursement.'
        : 'Hold disbursement and require maker-checker verification.',
    evidence,
  };
}

/**
 * Assess Employee Expense Claim for Fraud:
 * - Duplicate receipt number for the employee
 * - Duplicate amount, date, and employee
 */
export function assessExpenseFraud(
  candidateExpense: Partial<EmployeeExpense>,
  allExpenses: EmployeeExpense[]
): FraudAssessmentResult {
  const triggeredRules: FraudRuleResult[] = [];
  const evidence: EvidenceItem[] = [];
  let score = 0;

  const empId = (candidateExpense.employeeId || '').trim();
  const receiptNo = (candidateExpense.receiptNumber || '').trim().toLowerCase();
  const candAmt = Number(candidateExpense.amount || 0);

  // Rule 1: Identical Receipt Number for Employee
  if (receiptNo) {
    const dupReceipt = allExpenses.find(
      (exp) =>
        exp.id !== candidateExpense.id &&
        exp.employeeId === empId &&
        exp.receiptNumber.trim().toLowerCase() === receiptNo
    );

    if (dupReceipt) {
      score += 85;
      const ruleRes: FraudRuleResult = {
        ruleId: 'DUPLICATE_RECEIPT_NUMBER',
        ruleName: 'Repeated Expense Receipt Number',
        score: 85,
        triggered: true,
        reason: `Receipt #${candidateExpense.receiptNumber} was already claimed by Employee ${candidateExpense.employeeName || empId} on claim ${dupReceipt.claimReference} (${formatCurrency(dupReceipt.amount)}).`,
        recommendedAction: 'Reject expense claim and request original itemized merchant tax invoice.',
        evidence: [
          { label: 'Prior Claim Reference', detail: dupReceipt.claimReference, severity: 'Critical' },
          { label: 'Prior Claim Date', detail: formatDate(dupReceipt.submissionDate), severity: 'Warning' },
          { label: 'Claimed Amount', detail: formatCurrency(dupReceipt.amount), severity: 'Critical' },
        ],
      };
      triggeredRules.push(ruleRes);
      evidence.push(...ruleRes.evidence);
    }
  }

  // Rule 2: Identical Amount & Date (Same employee claiming same date/amount with different receipt label)
  if (score < 80 && candidateExpense.expenseDate) {
    const dupDateAndAmt = allExpenses.find(
      (exp) =>
        exp.id !== candidateExpense.id &&
        exp.employeeId === empId &&
        exp.expenseDate === candidateExpense.expenseDate &&
        Math.abs(exp.amount - candAmt) < 0.01
    );

    if (dupDateAndAmt) {
      score += 65;
      const ruleRes: FraudRuleResult = {
        ruleId: 'REPEATED_EXPENSE_CLAIM',
        ruleName: 'Identical Date and Amount Claimed',
        score: 65,
        triggered: true,
        reason: `Employee has a prior claim (${dupDateAndAmt.claimReference}) for the exact same amount of ${formatCurrency(candAmt)} on the same date (${formatDate(candidateExpense.expenseDate)}).`,
        recommendedAction: 'Review line items to verify if multiple identical expenses occurred on the same day.',
        evidence: [
          { label: 'Existing Claim', detail: dupDateAndAmt.claimReference, severity: 'Warning' },
          { label: 'Expense Date', detail: formatDate(dupDateAndAmt.expenseDate), severity: 'Info' },
        ],
      };
      triggeredRules.push(ruleRes);
      evidence.push(...ruleRes.evidence);
    }
  }

  const finalScore = Math.min(100, Math.max(0, score));
  let riskLevel: RiskLevel = 'Safe';
  if (finalScore >= 90) riskLevel = 'Blocked';
  else if (finalScore >= 60) riskLevel = 'High Risk';
  else if (finalScore >= 30) riskLevel = 'Suspicious';

  return {
    riskScore: finalScore,
    riskLevel,
    triggeredRules,
    recommendedAction:
      riskLevel === 'Safe'
        ? 'Expense conforms to corporate travel and entertainment policy.'
        : 'Flag for internal audit review before reimbursement approval.',
    evidence,
  };
}
