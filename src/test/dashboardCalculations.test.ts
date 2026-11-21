import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '../services/db';

describe('Dashboard Exact Calculations & Reconciliation Tests', () => {
  let db: DatabaseService;

  beforeEach(() => {
    localStorage.clear();
    db = new DatabaseService();
  });

  it('Section 4: reconciles all dashboard stats strictly from saved database records', () => {
    const stats = db.getDashboardStats();
    const invoices = db.getInvoices();
    const vendors = db.getVendors();
    const payments = db.getPayments();
    const expenses = db.getExpenses();
    const cases = db.getInvestigations();

    // Verify counts
    expect(stats.totalInvoicesCount).toBe(invoices.length);
    expect(stats.totalVendorsCount).toBe(vendors.length);
    expect(stats.totalPaymentsCount).toBe(payments.length);
    expect(stats.totalExpensesCount).toBe(expenses.length);
    expect(stats.fraudCasesDetected).toBe(cases.length);

    // Verify invoice volume sum
    const expectedInvoiceSum = invoices.reduce((s, i) => s + i.amount, 0);
    expect(stats.totalInvoicesValue).toBe(expectedInvoiceSum);

    // Verify payment volume sum
    const expectedPaymentSum = payments.reduce((s, p) => s + p.amount, 0);
    expect(stats.totalPaymentsValue).toBe(expectedPaymentSum);

    // Verify expense volume sum
    const expectedExpenseSum = expenses.reduce((s, e) => s + e.amount, 0);
    expect(stats.totalExpensesValue).toBe(expectedExpenseSum);

    // Verify pending investigations count
    const expectedPending = cases.filter((c) => c.status === 'Under Investigation').length;
    expect(stats.pendingInvestigations).toBe(expectedPending);

    // Verify confirmed fraud cases count
    const expectedConfirmed = cases.filter((c) => c.status === 'Confirmed Fraud').length;
    expect(stats.confirmedFraudCases).toBe(expectedConfirmed);

    // Verify exposure calculation matches sum of active cases
    const expectedExposure = cases
      .filter((c) => c.status === 'Under Investigation')
      .reduce((s, c) => s + c.amountInvolved, 0);
    expect(stats.estimatedFinancialExposure).toBe(expectedExposure);
  });

  it('Section 4: adding a valid invoice updates total invoices count and value in real-time', () => {
    const initialStats = db.getDashboardStats();
    const vendor = db.getVendors()[0];

    db.addInvoice({
      invoiceNumber: 'INV-NEW-RECON-1',
      vendorId: vendor.id,
      vendorName: vendor.name,
      amount: 45000,
      currency: 'INR',
      issueDate: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      description: 'Reconciliation test',
      department: 'Finance',
      lineItems: [],
      status: 'Pending Approval',
    });

    const updatedStats = db.getDashboardStats();
    expect(updatedStats.totalInvoicesCount).toBe(initialStats.totalInvoicesCount + 1);
    expect(updatedStats.totalInvoicesValue).toBe(initialStats.totalInvoicesValue + 45000);
  });
});
