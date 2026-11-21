import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatter';
import { BarChart3, Download, TrendingUp, ShieldCheck, CreditCard } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { stats, invoices, downloadCsv } = useApp();

  // Departmental Breakdown
  const deptStats: { [dept: string]: { count: number; value: number } } = {};
  invoices.forEach((inv) => {
    const d = inv.department || 'General';
    if (!deptStats[d]) deptStats[d] = { count: 0, value: 0 };
    deptStats[d].count += 1;
    deptStats[d].value += inv.amount;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F58220] flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Reports &amp; Financial Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Executive summaries of corporate loss prevention, vendor spending reconciliation, and departmental spend.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => downloadCsv('invoices')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Invoices CSV</span>
          </button>
          <button
            onClick={() => downloadCsv('investigations')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Fraud Audit Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Processed Volume</span>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatCurrency(stats.totalInvoicesValue + stats.totalPaymentsValue + stats.totalExpensesValue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Combined enterprise ledger transactions</p>
        </div>

        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Prevented Duplicate Loss</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-900">
            {formatCurrency(stats.amountPreventedDuplicatePayments)}
          </div>
          <p className="text-xs text-emerald-700 mt-1">Capital saved via duplicate &amp; fraud blocks</p>
        </div>

        <div className="bg-orange-50 rounded-2xl p-5 border border-orange-200 shadow-2xs">
          <div className="flex items-center justify-between text-[#F58220] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Exposure Under Review</span>
            <TrendingUp className="w-4 h-4 text-[#F58220]" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatCurrency(stats.estimatedFinancialExposure)}
          </div>
          <p className="text-xs text-slate-600 mt-1">Held pending fraud case determination</p>
        </div>
      </div>

      {/* Departmental Spend Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-base font-bold text-slate-900">
          Departmental Billing &amp; Expense Distribution
        </h3>
        <p className="text-xs text-slate-500">
          Spend reconciliation segmented by organizational cost center
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Invoices Count</th>
                <th className="py-2.5 px-3 text-right">Invoiced Volume</th>
                <th className="py-2.5 px-3 text-right">% of Total Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.keys(deptStats).length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs text-slate-500 font-medium">
                    No departmental spend recorded yet in custom data mode.
                  </td>
                </tr>
              ) : (
                Object.entries(deptStats).map(([dept, data]) => {
                  const pct = stats.totalInvoicesValue > 0 ? (data.value / stats.totalInvoicesValue) * 100 : 0;
                  return (
                    <tr key={dept} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{dept}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{data.count}</td>
                      <td className="py-2.5 px-3 font-mono font-black text-slate-900 num-cell">{formatCurrency(data.value)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700 text-right">{pct.toFixed(1)}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
