import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime, getRiskBadgeClasses } from '../utils/formatter';
import {
  FileText,
  Building2,
  CreditCard,
  Receipt,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  FileSearch,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { stats, invoices, investigations, setActiveTab, isDefaultData, loadSampleData } = useApp();

  // Reconciled summary stats directly from underlying records
  const statCards = [
    {
      title: 'Total Invoices',
      value: stats.totalInvoicesCount,
      subValue: formatCurrency(stats.totalInvoicesValue),
      subLabel: 'Total billed volume',
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50/60 border-blue-200',
    },
    {
      title: 'Active Vendors',
      value: stats.totalVendorsCount,
      subValue: '100% KYC Verified',
      subLabel: 'Master vendor records',
      icon: <Building2 className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50/60 border-indigo-200',
    },
    {
      title: 'Payments Disbursed',
      value: stats.totalPaymentsCount,
      subValue: formatCurrency(stats.totalPaymentsValue),
      subLabel: 'Processed transactions',
      icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50/60 border-emerald-200',
    },
    {
      title: 'Employee Expenses',
      value: stats.totalExpensesCount,
      subValue: formatCurrency(stats.totalExpensesValue),
      subLabel: 'Submitted expense claims',
      icon: <Receipt className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50/60 border-purple-200',
    },
    {
      title: 'Fraud Cases Detected',
      value: stats.fraudCasesDetected,
      subValue: `${stats.pendingInvestigations} Pending Review`,
      subLabel: 'Total flagged anomalies',
      icon: <ShieldAlert className="w-5 h-5 text-[#F58220]" />,
      bg: 'bg-orange-50/60 border-orange-200',
    },
    {
      title: 'Confirmed Fraud Cases',
      value: stats.confirmedFraudCases,
      subValue: 'Substantiated by audit',
      subLabel: 'Actionable integrity blocks',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      bg: 'bg-red-50/60 border-red-200',
    },
    {
      title: 'Financial Exposure',
      value: formatCurrency(stats.estimatedFinancialExposure),
      subValue: `${stats.pendingInvestigations} active cases`,
      subLabel: 'Under ongoing investigation',
      icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50/60 border-amber-200',
    },
    {
      title: 'Prevented Duplicate Loss',
      value: formatCurrency(stats.amountPreventedDuplicatePayments),
      subValue: 'Capital saved from fraud',
      subLabel: 'Prevented duplicate payouts',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50/80 border-emerald-300',
    },
  ];

  // Chart data: Distribution by Risk Level across Invoices
  const riskCounts = {
    Safe: invoices.filter((i) => i.riskLevel === 'Safe').length,
    Suspicious: invoices.filter((i) => i.riskLevel === 'Suspicious').length,
    'High Risk': invoices.filter((i) => i.riskLevel === 'High Risk').length,
    Blocked: invoices.filter((i) => i.riskLevel === 'Blocked').length,
  };

  const riskPieData = [
    { name: 'Safe', value: riskCounts.Safe, color: '#10B981' },
    { name: 'Suspicious', value: riskCounts.Suspicious, color: '#F59E0B' },
    { name: 'High Risk', value: riskCounts['High Risk'], color: '#EF4444' },
    { name: 'Blocked', value: riskCounts.Blocked, color: '#7F1D1D' },
  ];

  // Chart data: Volume Comparison
  const volumeData = [
    { name: 'Invoices Billed', amount: stats.totalInvoicesValue, color: '#F58220' },
    { name: 'Payments Paid', amount: stats.totalPaymentsValue, color: '#10B981' },
    { name: 'Expenses Claimed', amount: stats.totalExpensesValue, color: '#6366F1' },
    { name: 'Prevented Fraud', amount: stats.amountPreventedDuplicatePayments, color: '#EF4444' },
  ];

  const recentCases = investigations.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Integrity Health Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#F58220] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
            Enterprise Financial Integrity Overview
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Fraud Surveillance Dashboard
          </h2>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Real-time multi-vector detection monitoring duplicate invoices, employee expenses, split payments, and suspicious vendor modifications.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setActiveTab('invoices')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-md shadow-orange-500/20 transition"
          >
            <span>+ Ingest Invoice</span>
          </button>
          <button
            onClick={() => setActiveTab('investigations')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition"
          >
            <FileSearch className="w-4 h-4 text-[#F58220]" />
            <span>Review Queue ({stats.pendingInvestigations})</span>
          </button>
        </div>
      </div>

      {/* Clean Custom Data Mode Notice Banner if empty */}
      {!isDefaultData && stats.totalInvoicesCount === 0 && stats.totalVendorsCount === 0 && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Clean Custom Data Mode Active
              </h4>
              <p className="text-xs text-emerald-800">
                Default demo records have been rejected and cleared. Enter your custom business vendors and invoices to start fraud scanning.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('invoices')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-xs transition"
            >
              + Ingest First Invoice
            </button>
            <button
              onClick={loadSampleData}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition"
            >
              Load Demo Data
            </button>
          </div>
        </div>
      )}

      {/* 8 Strict Reconciled Metric Cards */}
      <section aria-label="Reconciled Metrics Grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`rounded-2xl p-5 border shadow-2xs flex flex-col justify-between transition hover:shadow-md ${card.bg}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {card.title}
              </span>
              <div className="p-2 rounded-xl bg-white shadow-xs border border-slate-200/60">
                {card.icon}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                {card.value}
              </div>
              <div className="text-xs font-bold text-slate-800 mt-1">
                {card.subValue}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {card.subLabel}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Financial Volume Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Financial Volume &amp; Integrity Breakdown
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Live volume comparisons across invoices, payments, expenses, and prevented fraud
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
              Reconciled DB Values
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickFormatter={(v) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${v / 1000}k`}`}
                />
                <Tooltip
                  formatter={(val: number) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {volumeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Invoices Risk Level Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Invoice Risk Profile
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Real-time classification based on 8 fraud rules
            </p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val} invoices`, 'Count']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
            {riskPieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 font-medium">{item.name}:</span>
                <span className="font-bold text-slate-900 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Investigations & Priority Alerts Queue */}
      <section aria-labelledby="active-cases-heading" className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 id="active-cases-heading" className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-[#F58220]" />
              Priority Fraud Investigations ({investigations.length})
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Transactions flagged by automated rules awaiting compliance signoff
            </p>
          </div>

          <button
            onClick={() => setActiveTab('investigations')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#F58220] hover:text-[#DE6E10] transition"
          >
            <span>View Full Investigation Queue</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {recentCases.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            All transactions and invoices are verified. No open fraud investigations.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Involved Entity</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Detected Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCases.map((c) => {
                  const badge = getRiskBadgeClasses(c.riskLevel);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {c.caseId}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px]">
                          {c.fraudType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[180px] truncate">
                        {c.involvedParty}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-slate-900 num-cell">
                        {formatCurrency(c.amountInvolved)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {c.riskLevel} ({c.riskScore})
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {formatDateTime(c.detectionDate)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setActiveTab('investigations')}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F58220] text-white hover:bg-[#DE6E10] transition"
                        >
                          Investigate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
