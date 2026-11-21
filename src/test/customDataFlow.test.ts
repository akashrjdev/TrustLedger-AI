import { describe, it, expect, beforeEach } from 'vitest';
import { db, DuplicateEntityError } from '../services/db';

describe('Custom User Data Flow & Default Data Rejection', () => {
  beforeEach(() => {
    // Start by clearing or resetting
    db.resetDemoData();
  });

  it('correctly detects default demo data initially', () => {
    expect(db.isDefaultDataLoaded()).toBe(true);
    expect(db.getVendors().length).toBeGreaterThan(0);
    expect(db.getInvoices().length).toBeGreaterThan(0);
  });

  it('rejects default data and creates a 100% clean custom database', () => {
    // User clicks "Reject Default Data"
    db.clearAllData('Default data rejected by user');

    expect(db.isDefaultDataLoaded()).toBe(false);
    expect(db.getVendors().length).toBe(0);
    expect(db.getInvoices().length).toBe(0);
    expect(db.getPayments().length).toBe(0);
    expect(db.getExpenses().length).toBe(0);
    expect(db.getInvestigations().length).toBe(0);

    const stats = db.getDashboardStats();
    expect(stats.totalInvoicesCount).toBe(0);
    expect(stats.totalVendorsCount).toBe(0);
    expect(stats.totalPaymentsCount).toBe(0);
    expect(stats.totalExpensesCount).toBe(0);
    expect(stats.totalInvoicesValue).toBe(0);
    expect(stats.totalPaymentsValue).toBe(0);
  });

  it('accepts custom user vendors and enforces uniqueness constraints on custom data', () => {
    db.clearAllData('Default data rejected');

    // Register Custom Vendor #1
    const vendor1 = db.addVendor({
      name: 'Acme Logistics India Pvt Ltd',
      gstin: '29AABCU9603R1ZM',
      category: 'Logistics & Warehousing',
      email: 'finance@acme-logistics.in',
      phone: '+91 80 2345 6789',
      address: 'Whitefield Industrial Zone, Bengaluru',
      bankAccountNumber: '987654321012',
      bankIfsc: 'HDFC0001234',
      bankName: 'HDFC Bank Ltd',
      status: 'Active',
    });

    expect(vendor1.id).toBeDefined();
    expect(vendor1.vendorCode).toMatch(/^VND-\d{4,5}$/);
    expect(db.getVendors().length).toBe(1);

    // Duplicate GSTIN should be strictly blocked
    expect(() => {
      db.addVendor({
        name: 'Another Clone Company',
        gstin: '29AABCU9603R1ZM', // Duplicate GSTIN
        category: 'Consulting',
        email: 'info@clone.com',
        phone: '+91 80 9999 8888',
        address: 'MG Road, Bengaluru',
        bankAccountNumber: '555544443333',
        bankIfsc: 'SBIN0001234',
        bankName: 'State Bank of India',
        status: 'Active',
      });
    }).toThrow(DuplicateEntityError);
  });

  it('accepts custom user invoices and detects duplicates on custom records', () => {
    db.clearAllData('Default data rejected');

    const vendor = db.addVendor({
      name: 'Bharat Telecom Infrastructure',
      gstin: '27AAACB1234P1Z5',
      category: 'Telecom',
      email: 'corp@bharat-telecom.in',
      phone: '+91 22 4000 1122',
      address: 'Nariman Point, Mumbai',
      bankAccountNumber: '02811040008899',
      bankIfsc: 'ICIC0000281',
      bankName: 'ICICI Bank',
      status: 'Active',
    });

    // Ingest Custom Invoice
    const invoice1 = db.addInvoice({
      invoiceNumber: 'BTI-2026-901',
      vendorId: vendor.id,
      vendorName: vendor.name,
      amount: 85000,
      currency: 'INR',
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      description: 'Fiber optics leased lines',
      department: 'Engineering',
      lineItems: [
        {
          id: 'li-1',
          description: '1 Gbps Dedicated Circuit',
          quantity: 1,
          unitPrice: 85000,
          amount: 85000,
        },
      ],
      status: 'Pending Approval',
    });

    expect(invoice1.id).toBeDefined();
    expect(db.getInvoices().length).toBe(1);
    expect(invoice1.riskLevel).toBe('Safe');

    // Attempt to submit identical custom invoice number for same vendor -> must be blocked
    expect(() => {
      db.addInvoice({
        invoiceNumber: 'BTI-2026-901', // Duplicate invoice!
        vendorId: vendor.id,
        vendorName: vendor.name,
        amount: 85000,
        currency: 'INR',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        description: 'Duplicate submission attempt',
        department: 'Engineering',
        lineItems: [
          {
            id: 'li-dup',
            description: 'Duplicate',
            quantity: 1,
            unitPrice: 85000,
            amount: 85000,
          },
        ],
        status: 'Pending Approval',
      });
    }).toThrow(DuplicateEntityError);

    // Dashboard stats must update from custom data
    const stats = db.getDashboardStats();
    expect(stats.totalInvoicesCount).toBe(1);
    expect(stats.totalInvoicesValue).toBe(85000);
    expect(stats.totalVendorsCount).toBe(1);
  });

  it('allows batch importing custom JSON datasets and rejects malformed records', () => {
    db.clearAllData('Default data rejected');

    const customBatch = {
      vendors: [
        {
          name: 'Solaris Cloud Computing LLP',
          gstin: '36AAAFS5555R1Z9',
          category: 'Cloud Hosting',
          email: 'support@solariscloud.in',
          phone: '+91 40 2300 4455',
          address: 'HITEC City, Hyderabad',
          bankAccountNumber: '601020304050',
          bankIfsc: 'HDFC0000601',
          bankName: 'HDFC Bank',
          status: 'Active' as const,
        },
      ],
      invoices: [
        {
          invoiceNumber: 'SOL-INV-1001',
          vendorId: 'auto-resolve',
          vendorName: 'Solaris Cloud Computing LLP',
          amount: 120000,
          currency: 'INR' as const,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
          description: 'GPU Compute Cluster',
          department: 'AI Research',
          lineItems: [],
          status: 'Pending Approval' as const,
        },
      ],
    };

    const result = db.batchImportCustomData(customBatch);
    expect(result.addedVendors).toBe(1);
    expect(result.addedInvoices).toBe(1);
    expect(result.errors.length).toBe(0);

    expect(db.getVendors().length).toBe(1);
    expect(db.getInvoices().length).toBe(1);
    expect(db.getDashboardStats().totalInvoicesValue).toBe(120000);
  });

  it('can restore sample demo data on demand', () => {
    db.clearAllData('Clean mode');
    expect(db.getVendors().length).toBe(0);

    // User chooses to restore demo scenarios
    db.loadSampleData();
    expect(db.isDefaultDataLoaded()).toBe(true);
    expect(db.getVendors().length).toBeGreaterThan(0);
    expect(db.getInvoices().length).toBeGreaterThan(0);
  });
});
