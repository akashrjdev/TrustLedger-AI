import { describe, it, expect } from 'vitest';
import { assessInvoiceFraud, assessPaymentFraud, assessExpenseFraud } from '../engine/fraudDetectionEngine';
import { Invoice, Vendor, Payment, EmployeeExpense } from '../types';

describe('Fraud Detection Engine Unit Tests', () => {
  const sampleVendor: Vendor = {
    id: 'v-test-1',
    vendorCode: 'VND-00001',
    name: 'Reliable Test Vendor',
    gstin: '29AABCR1234K1Z2',
    category: 'Hardware',
    email: 'test@vendor.com',
    phone: '1234567890',
    address: 'Bengaluru',
    bankAccountNumber: '123456789012',
    bankIfsc: 'HDFC0001234',
    bankName: 'HDFC Bank',
    status: 'Active',
    riskScore: 10,
    riskLevel: 'Safe',
    registeredAt: '2025-01-01T00:00:00Z',
    bankHistory: [],
    totalInvoiced: 100000,
    totalPaid: 100000,
    averageInvoiceAmount: 25000,
  };

  it('assigns Safe risk to standard invoice conforming to historical patterns', () => {
    const inv: Partial<Invoice> = {
      id: 'inv-test-new',
      invoiceNumber: 'INV-NEW-99',
      vendorId: sampleVendor.id,
      amount: 26000,
      issueDate: '2026-11-20T00:00:00Z',
    };

    const res = assessInvoiceFraud(inv, [], [sampleVendor]);
    expect(res.riskScore).toBeLessThan(30);
    expect(res.riskLevel).toBe('Safe');
    expect(res.triggeredRules.length).toBe(0);
  });

  it('Rule: flags unregistered vendor with High Risk (+75)', () => {
    const inv: Partial<Invoice> = {
      id: 'inv-unreg',
      invoiceNumber: 'INV-UNREG-01',
      vendorId: 'v-nonexistent',
      amount: 40000,
      issueDate: '2026-11-20T00:00:00Z',
    };

    const res = assessInvoiceFraud(inv, [], [sampleVendor]);
    expect(res.riskScore).toBeGreaterThanOrEqual(75);
    expect(res.riskLevel).toBe('High Risk');
    expect(res.triggeredRules.some((r) => r.ruleId === 'UNREGISTERED_VENDOR')).toBe(true);
  });

  it('Rule: flags blacklisted vendor with Blocked level (+90)', () => {
    const blacklistedVendor: Vendor = {
      ...sampleVendor,
      id: 'v-blacklisted',
      status: 'Blacklisted',
    };

    const inv: Partial<Invoice> = {
      id: 'inv-black',
      invoiceNumber: 'INV-BLACK-01',
      vendorId: blacklistedVendor.id,
      amount: 10000,
      issueDate: '2026-11-20T00:00:00Z',
    };

    const res = assessInvoiceFraud(inv, [], [blacklistedVendor]);
    expect(res.riskScore).toBeGreaterThanOrEqual(90);
    expect(res.riskLevel).toBe('Blocked');
    expect(res.triggeredRules.some((r) => r.ruleId === 'BLACKLISTED_VENDOR')).toBe(true);
  });

  it('Rule: flags suspicious recent bank account change within 7 days (+80)', () => {
    const vendorWithRecentBankChange: Vendor = {
      ...sampleVendor,
      id: 'v-bank-change',
      lastBankChangeDate: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
    };

    const inv: Partial<Invoice> = {
      id: 'inv-bank-check',
      invoiceNumber: 'INV-BANK-01',
      vendorId: vendorWithRecentBankChange.id,
      amount: 30000,
      issueDate: new Date().toISOString(),
    };

    const res = assessInvoiceFraud(inv, [], [vendorWithRecentBankChange]);
    expect(res.riskScore).toBeGreaterThanOrEqual(80);
    expect(res.riskLevel).toBe('High Risk');
    expect(res.triggeredRules.some((r) => r.ruleId === 'SUSPICIOUS_BANK_CHANGE')).toBe(true);
  });

  it('Rule: flags inflated invoice exceeding 300% of historical average (+55)', () => {
    // sampleVendor historical average is 25,000
    // 300% threshold is 75,000. Test with 90,000 (3.6x)
    const inv: Partial<Invoice> = {
      id: 'inv-inflated',
      invoiceNumber: 'INV-INF-01',
      vendorId: sampleVendor.id,
      amount: 90000,
      issueDate: new Date().toISOString(),
    };

    const res = assessInvoiceFraud(inv, [], [sampleVendor]);
    expect(res.riskScore).toBeGreaterThanOrEqual(55);
    expect(res.triggeredRules.some((r) => r.ruleId === 'INFLATED_INVOICE_AMOUNT')).toBe(true);
  });

  it('Rule: flags split payment evasion of approval limits (+70)', () => {
    const existingPayment: Payment = {
      id: 'pay-exist',
      paymentReference: 'PAY-1',
      idempotencyKey: 'idemp-1',
      invoiceId: 'inv-1',
      invoiceNumber: 'INV-1',
      vendorId: sampleVendor.id,
      vendorName: sampleVendor.name,
      amount: 48500, // structured just under 50,000
      currency: 'INR',
      paymentMethod: 'NEFT',
      beneficiaryAccount: sampleVendor.bankAccountNumber,
      beneficiaryIfsc: sampleVendor.bankIfsc,
      paymentDate: new Date(Date.now() - 2 * 3600000).toISOString(), // 2h ago
      status: 'Completed',
      riskScore: 0,
      riskLevel: 'Safe',
      fraudReasons: [],
      isSplitPayment: false,
      approvalLimitThreshold: 50000,
      createdAt: new Date().toISOString(),
    };

    const candidatePayment: Partial<Payment> = {
      id: 'pay-candidate',
      vendorId: sampleVendor.id,
      amount: 49200, // second payment just under 50,000
      paymentDate: new Date().toISOString(),
    };

    const res = assessPaymentFraud(candidatePayment, [existingPayment], [sampleVendor]);
    expect(res.riskScore).toBeGreaterThanOrEqual(70);
    expect(res.riskLevel).toBe('High Risk');
    expect(res.triggeredRules.some((r) => r.ruleId === 'SPLIT_PAYMENT_AVOID_APPROVAL')).toBe(true);
  });

  it('Rule: flags duplicate employee expense receipt (+85)', () => {
    const existingExpense: EmployeeExpense = {
      id: 'exp-1',
      claimReference: 'EXP-CLM-1',
      employeeId: 'EMP-001',
      employeeName: 'Alice',
      department: 'Marketing',
      receiptNumber: 'TAX-INV-7788',
      merchantName: 'Airlines',
      expenseCategory: 'Travel',
      amount: 18000,
      currency: 'INR',
      expenseDate: '2026-11-10',
      submissionDate: '2026-11-11T00:00:00Z',
      status: 'Reimbursed',
      riskScore: 0,
      riskLevel: 'Safe',
      fraudReasons: [],
      isDuplicateReceipt: false,
      createdAt: '2026-11-11T00:00:00Z',
    };

    const candidateExpense: Partial<EmployeeExpense> = {
      id: 'exp-cand',
      employeeId: 'EMP-001',
      receiptNumber: 'TAX-INV-7788', // identical receipt
      amount: 18000,
      expenseDate: '2026-11-10',
    };

    const res = assessExpenseFraud(candidateExpense, [existingExpense]);
    expect(res.riskScore).toBeGreaterThanOrEqual(85);
    expect(res.riskLevel).toBe('High Risk');
    expect(res.triggeredRules.some((r) => r.ruleId === 'DUPLICATE_RECEIPT_NUMBER')).toBe(true);
  });
});
