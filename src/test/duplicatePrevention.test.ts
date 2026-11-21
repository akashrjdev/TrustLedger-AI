import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService, DuplicateEntityError } from '../services/db';

describe('Duplicate Prevention & Idempotency Tests', () => {
  let db: DatabaseService;

  beforeEach(() => {
    localStorage.clear();
    db = new DatabaseService();
  });

  describe('Invoice Duplicate Prevention', () => {
    it('prevents exact same invoice number for the same vendor', () => {
      const vendor = db.getVendors()[0];

      // Existing invoice in seed: INV-2026-089 for vendor v-101
      expect(() => {
        db.addInvoice({
          invoiceNumber: 'INV-2026-089',
          vendorId: vendor.id,
          vendorName: vendor.name,
          amount: 50000,
          currency: 'INR',
          issueDate: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          description: 'Attempted duplicate invoice submission',
          department: 'Engineering',
          lineItems: [],
          status: 'Pending Approval',
        });
      }).toThrowError(DuplicateEntityError);
    });

    it('allows same invoice number for DIFFERENT vendors', () => {
      const vendors = db.getVendors();
      expect(vendors.length).toBeGreaterThanOrEqual(2);

      const v1 = vendors[0];
      const v2 = vendors[1];

      // Add unique invoice to v1
      const inv1 = db.addInvoice({
        invoiceNumber: 'COMM-INV-001',
        vendorId: v1.id,
        vendorName: v1.name,
        amount: 25000,
        currency: 'INR',
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        description: 'V1 billing',
        department: 'Operations',
        lineItems: [],
        status: 'Pending Approval',
      });
      expect(inv1.id).toBeDefined();

      // Same invoice number for v2 should be permitted
      const inv2 = db.addInvoice({
        invoiceNumber: 'COMM-INV-001',
        vendorId: v2.id,
        vendorName: v2.name,
        amount: 30000,
        currency: 'INR',
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        description: 'V2 independent billing',
        department: 'Operations',
        lineItems: [],
        status: 'Pending Approval',
      });
      expect(inv2.id).toBeDefined();
      expect(inv2.id).not.toBe(inv1.id);
    });
  });

  describe('Vendor Duplicate Prevention', () => {
    it('rejects duplicate vendor registration with existing GSTIN', () => {
      const existingVendor = db.getVendors()[0];

      expect(() => {
        db.addVendor({
          name: 'Completely New Vendor Name',
          gstin: existingVendor.gstin, // Duplicate GSTIN!
          category: 'Facilities',
          email: 'new@vendor.com',
          phone: '+91 99999 11111',
          address: 'Bengaluru, India',
          bankAccountNumber: '998877665544',
          bankIfsc: 'HDFC0009999',
          bankName: 'HDFC Bank',
          status: 'Active',
        });
      }).toThrowError(DuplicateEntityError);
    });

    it('rejects duplicate vendor registration with existing bank account', () => {
      const existingVendor = db.getVendors()[0];

      expect(() => {
        db.addVendor({
          name: 'Second Vendor Name',
          gstin: '29AABCB9999P1Z8', // Unique GSTIN
          category: 'Logistics',
          email: 'second@vendor.com',
          phone: '+91 99999 22222',
          address: 'Mumbai, India',
          bankAccountNumber: existingVendor.bankAccountNumber, // Duplicate Bank Account!
          bankIfsc: 'HDFC0001029',
          bankName: 'HDFC Bank',
          status: 'Active',
        });
      }).toThrowError(DuplicateEntityError);
    });
  });

  describe('Payment Idempotency & Duplicate Reference Prevention', () => {
    it('returns existing payment on duplicate idempotency key submission (avoids double-click duplicate payout)', () => {
      const vendor = db.getVendors()[0];
      const key = 'idemp_test_double_click_123';

      const payment1 = db.addPayment({
        paymentReference: 'PAY-REF-UNIQUE-001',
        idempotencyKey: key,
        invoiceId: 'inv-test-1',
        invoiceNumber: 'INV-TEST-1',
        vendorId: vendor.id,
        vendorName: vendor.name,
        amount: 20000,
        currency: 'INR',
        paymentMethod: 'NEFT',
        beneficiaryAccount: vendor.bankAccountNumber,
        beneficiaryIfsc: vendor.bankIfsc,
        paymentDate: new Date().toISOString(),
        approvalLimitThreshold: 50000,
        status: 'Completed',
      });

      // Simultaneous / second call with same idempotency key
      const payment2 = db.addPayment({
        paymentReference: 'PAY-REF-UNIQUE-002',
        idempotencyKey: key,
        invoiceId: 'inv-test-1',
        invoiceNumber: 'INV-TEST-1',
        vendorId: vendor.id,
        vendorName: vendor.name,
        amount: 20000,
        currency: 'INR',
        paymentMethod: 'NEFT',
        beneficiaryAccount: vendor.bankAccountNumber,
        beneficiaryIfsc: vendor.bankIfsc,
        paymentDate: new Date().toISOString(),
        approvalLimitThreshold: 50000,
        status: 'Completed',
      });

      // Must return identical existing payment record without creating a second record
      expect(payment1.id).toBe(payment2.id);
      expect(payment2.paymentReference).toBe('PAY-REF-UNIQUE-001');
    });

    it('blocks duplicate payment reference', () => {
      const vendor = db.getVendors()[0];

      db.addPayment({
        paymentReference: 'PAY-REF-LOCK-999',
        idempotencyKey: 'key_1',
        invoiceId: 'inv-1',
        invoiceNumber: 'INV-1',
        vendorId: vendor.id,
        vendorName: vendor.name,
        amount: 15000,
        currency: 'INR',
        paymentMethod: 'NEFT',
        beneficiaryAccount: vendor.bankAccountNumber,
        beneficiaryIfsc: vendor.bankIfsc,
        paymentDate: new Date().toISOString(),
        approvalLimitThreshold: 50000,
        status: 'Completed',
      });

      expect(() => {
        db.addPayment({
          paymentReference: 'PAY-REF-LOCK-999', // duplicate reference
          idempotencyKey: 'key_2',
          invoiceId: 'inv-2',
          invoiceNumber: 'INV-2',
          vendorId: vendor.id,
          vendorName: vendor.name,
          amount: 15000,
          currency: 'INR',
          paymentMethod: 'NEFT',
          beneficiaryAccount: vendor.bankAccountNumber,
          beneficiaryIfsc: vendor.bankIfsc,
          paymentDate: new Date().toISOString(),
          approvalLimitThreshold: 50000,
          status: 'Completed',
        });
      }).toThrowError(DuplicateEntityError);
    });
  });

  describe('Employee Expense Duplicate Receipt Detection', () => {
    it('blocks repeated receipt number claimed by the same employee', () => {
      // Seed contains HOTEL-DEL-9841 for EMP-0881
      expect(() => {
        db.addExpense({
          claimReference: 'EXP-CLM-NEW-001',
          employeeId: 'EMP-0881',
          employeeName: 'Rajesh Sharma',
          department: 'Sales',
          receiptNumber: 'HOTEL-DEL-9841', // Exact duplicate receipt!
          merchantName: 'The Oberoi',
          expenseCategory: 'Lodging',
          amount: 24500,
          currency: 'INR',
          expenseDate: '2026-11-04',
          submissionDate: new Date().toISOString(),
          status: 'Submitted',
        });
      }).toThrowError(DuplicateEntityError);
    });
  });
});
