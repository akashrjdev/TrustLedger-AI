import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardPage } from './pages/DashboardPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { VendorsPage } from './pages/VendorsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { FraudCentrePage } from './pages/FraudCentrePage';
import { InvestigationsPage } from './pages/InvestigationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ShieldCheck } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Enterprise Header */}
      <Header />

      {/* 10 Working Navigation Sections */}
      <Navigation />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6" role="main">
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'invoices' && <InvoicesPage />}
        {activeTab === 'vendors' && <VendorsPage />}
        {activeTab === 'payments' && <PaymentsPage />}
        {activeTab === 'expenses' && <ExpensesPage />}
        {activeTab === 'fraud-centre' && <FraudCentrePage />}
        {activeTab === 'investigations' && <InvestigationsPage />}
        {activeTab === 'reports' && <ReportsPage />}
        {activeTab === 'audit-logs' && <AuditLogsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <span className="w-5 h-5 rounded bg-[#F58220] text-white flex items-center justify-center text-xs font-black">
              T
            </span>
            <span>TrustLedger AI</span>
            <span className="text-[11px] font-normal text-slate-400">
              • Intelligent Business Fraud Detection &amp; Financial Integrity Platform
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Demo Mode: Enterprise Synthetic Datasets Only</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Continuous Surveillance Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
