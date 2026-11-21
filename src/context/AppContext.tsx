import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Vendor,
  Invoice,
  Payment,
  EmployeeExpense,
  InvestigationCase,
  AuditLog,
  DashboardStats,
  NavigationTab,
  SettingsConfig,
} from '../types';
import { db, DuplicateEntityError } from '../services/db';

interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
}

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  stats: DashboardStats;
  vendors: Vendor[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: EmployeeExpense[];
  investigations: InvestigationCase[];
  auditLogs: AuditLog[];
  settings: SettingsConfig;
  notifications: ToastNotification[];
  isDefaultData: boolean;
  dismissNotification: (id: string) => void;
  createInvoice: (data: Parameters<typeof db.addInvoice>[0]) => { success: boolean; invoice?: Invoice; error?: string; isDuplicate?: boolean };
  createVendor: (data: Parameters<typeof db.addVendor>[0]) => { success: boolean; vendor?: Vendor; error?: string };
  updateVendorBank: (vendorId: string, newAccount: string, newIfsc: string, newBankName: string, reason: string) => { success: boolean; error?: string };
  createPayment: (data: Parameters<typeof db.addPayment>[0]) => { success: boolean; payment?: Payment; error?: string };
  createExpense: (data: Parameters<typeof db.addExpense>[0]) => { success: boolean; expense?: EmployeeExpense; error?: string; isDuplicate?: boolean };
  updateInvestigationStatus: (caseId: string, status: InvestigationCase['status'], comment: string) => void;
  updateSettings: (newSettings: Partial<SettingsConfig>) => void;
  resetDemoData: () => void;
  rejectDefaultData: () => void;
  loadSampleData: () => void;
  importCustomData: (jsonString: string) => { success: boolean; addedVendors: number; addedInvoices: number; addedPayments: number; addedExpenses: number; errors: string[] };
  downloadCsv: (tableName: 'invoices' | 'vendors' | 'payments' | 'expenses' | 'investigations' | 'audit') => void;
  downloadBackupJson: () => void;
  restoreBackupJson: (json: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<EmployeeExpense[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationCase[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SettingsConfig>(db.getSettings());
  const [stats, setStats] = useState<DashboardStats>(db.getDashboardStats());
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [isDefaultData, setIsDefaultData] = useState<boolean>(db.isDefaultDataLoaded());

  const refreshState = useCallback(() => {
    setVendors(db.getVendors());
    setInvoices(db.getInvoices());
    setPayments(db.getPayments());
    setExpenses(db.getExpenses());
    setInvestigations(db.getInvestigations());
    setAuditLogs(db.getAuditLogs());
    setSettings(db.getSettings());
    setStats(db.getDashboardStats());
    setIsDefaultData(db.isDefaultDataLoaded());
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const addNotification = (type: ToastNotification['type'], title: string, message: string) => {
    const newNotif: ToastNotification = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      message,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const createInvoice = (data: Parameters<typeof db.addInvoice>[0]) => {
    try {
      const invoice = db.addInvoice(data);
      refreshState();
      if (invoice.riskLevel === 'Blocked' || invoice.riskLevel === 'High Risk') {
        addNotification(
          'warning',
          'High Risk Invoice Quarantined',
          `Invoice #${invoice.invoiceNumber} was flagged with ${invoice.riskLevel} risk (${invoice.riskScore} pts) and moved to Investigation Queue.`
        );
      } else {
        addNotification(
          'success',
          'Invoice Registered',
          `Invoice #${invoice.invoiceNumber} for ${invoice.vendorName} successfully saved (Risk: ${invoice.riskLevel}).`
        );
      }
      return { success: true, invoice };
    } catch (err: unknown) {
      refreshState();
      const message = err instanceof Error ? err.message : 'Failed to create invoice';
      const isDuplicate = err instanceof DuplicateEntityError;
      addNotification('error', isDuplicate ? 'Duplicate Invoice Blocked' : 'Validation Error', message);
      return { success: false, error: message, isDuplicate };
    }
  };

  const createVendor = (data: Parameters<typeof db.addVendor>[0]) => {
    try {
      const vendor = db.addVendor(data);
      refreshState();
      addNotification('success', 'Vendor Registered', `Vendor "${vendor.name}" (${vendor.vendorCode}) successfully onboarded.`);
      return { success: true, vendor };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register vendor';
      addNotification('error', 'Duplicate / Validation Error', message);
      return { success: false, error: message };
    }
  };

  const updateVendorBank = (vendorId: string, newAccount: string, newIfsc: string, newBankName: string, reason: string) => {
    try {
      db.updateVendorBank(vendorId, newAccount, newIfsc, newBankName, reason, 'Admin / Auditor');
      refreshState();
      addNotification('warning', 'Vendor Bank Changed', 'Bank account updated. Vendor flagged for transaction lookback inspection.');
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update bank details';
      addNotification('error', 'Bank Update Blocked', message);
      return { success: false, error: message };
    }
  };

  const createPayment = (data: Parameters<typeof db.addPayment>[0]) => {
    try {
      const payment = db.addPayment(data);
      refreshState();
      if (payment.status === 'Held') {
        addNotification('warning', 'Payment Quarantined', `Payment ${payment.paymentReference} held due to split payment threshold evasion.`);
      } else if (payment.status === 'Blocked') {
        addNotification('error', 'Payment Blocked', `Payment ${payment.paymentReference} blocked by integrity rules.`);
      } else {
        addNotification('success', 'Payment Disbursed', `Payment ${payment.paymentReference} of ₹${payment.amount.toLocaleString('en-IN')} completed.`);
      }
      return { success: true, payment };
    } catch (err: unknown) {
      refreshState();
      const message = err instanceof Error ? err.message : 'Payment error';
      addNotification('error', 'Duplicate Payment Blocked', message);
      return { success: false, error: message };
    }
  };

  const createExpense = (data: Parameters<typeof db.addExpense>[0]) => {
    try {
      const expense = db.addExpense(data);
      refreshState();
      if (expense.riskLevel === 'Blocked' || expense.riskLevel === 'High Risk') {
        addNotification('warning', 'Expense Flagged', `Expense ${expense.claimReference} flagged for duplicate or compliance review.`);
      } else {
        addNotification('success', 'Expense Submitted', `Expense report ${expense.claimReference} submitted for approval.`);
      }
      return { success: true, expense };
    } catch (err: unknown) {
      refreshState();
      const message = err instanceof Error ? err.message : 'Expense submission error';
      const isDuplicate = err instanceof DuplicateEntityError;
      addNotification('error', isDuplicate ? 'Duplicate Receipt Blocked' : 'Expense Error', message);
      return { success: false, error: message, isDuplicate };
    }
  };

  const updateInvestigationStatus = (caseId: string, status: InvestigationCase['status'], comment: string) => {
    try {
      db.updateInvestigationStatus(caseId, status, comment, 'Lead Fraud Investigator');
      refreshState();
      addNotification('success', 'Case Updated', `Investigation case status marked as "${status}". Decision audit logged.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating case';
      addNotification('error', 'Update Failed', message);
    }
  };

  const updateSettings = (newSettings: Partial<SettingsConfig>) => {
    db.updateSettings(newSettings);
    refreshState();
    addNotification('success', 'Settings Updated', 'Fraud detection threshold parameters saved.');
  };

  const resetDemoData = () => {
    db.resetDemoData();
    refreshState();
    addNotification('info', 'Demo Data Reset', 'Restored verified enterprise dataset with clean reconciliation.');
  };

  const rejectDefaultData = () => {
    db.clearAllData('Default demo data rejected by user. Switched to clean custom data mode.');
    refreshState();
    addNotification('warning', 'Default Data Rejected', 'All pre-seeded sample records purged. TrustLedger AI is now in pure custom data mode.');
  };

  const loadSampleData = () => {
    db.loadSampleData();
    refreshState();
    addNotification('success', 'Sample Data Loaded', 'Restored enterprise demo records (duplicate invoices, split payments, audit cases).');
  };

  const importCustomData = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const res = db.batchImportCustomData(parsed);
      refreshState();
      if (res.errors.length > 0) {
        addNotification(
          'warning',
          'Partial Custom Data Import',
          `Imported ${res.addedVendors} vendors, ${res.addedInvoices} invoices, ${res.addedPayments} payments. ${res.errors.length} item(s) skipped due to validation/duplicate rules.`
        );
      } else {
        addNotification(
          'success',
          'Custom Data Accepted',
          `Successfully ingested ${res.addedVendors} vendors, ${res.addedInvoices} invoices, ${res.addedPayments} payments, and ${res.addedExpenses} expenses.`
        );
      }
      return { success: true, ...res };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON format';
      addNotification('error', 'Import Failed', `Could not parse custom data JSON: ${msg}`);
      return { success: false, addedVendors: 0, addedInvoices: 0, addedPayments: 0, addedExpenses: 0, errors: [msg] };
    }
  };

  const downloadCsv = (tableName: 'invoices' | 'vendors' | 'payments' | 'expenses' | 'investigations' | 'audit') => {
    const csvData = db.exportTableToCsv(tableName);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trustledger-${tableName}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadBackupJson = () => {
    const json = db.exportBackupJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trustledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const restoreBackupJson = (json: string): boolean => {
    const ok = db.importBackupJson(json);
    if (ok) {
      refreshState();
      addNotification('success', 'Database Restored', 'Successfully restored all records from JSON backup.');
      return true;
    } else {
      addNotification('error', 'Restore Failed', 'Invalid backup file format.');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        stats,
        vendors,
        invoices,
        payments,
        expenses,
        investigations,
        auditLogs,
        settings,
        notifications,
        isDefaultData,
        dismissNotification,
        createInvoice,
        createVendor,
        updateVendorBank,
        createPayment,
        createExpense,
        updateInvestigationStatus,
        updateSettings,
        resetDemoData,
        rejectDefaultData,
        loadSampleData,
        importCustomData,
        downloadCsv,
        downloadBackupJson,
        restoreBackupJson,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
