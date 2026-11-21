import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { assessInvoiceFraud, assessPaymentFraud, assessExpenseFraud } from '../engine/fraudDetectionEngine';
import { getRiskBadgeClasses } from '../utils/formatter';
import {
  Search,
  Cpu,
} from 'lucide-react';

export const FraudCentrePage: React.FC = () => {
  const { invoices, vendors, payments, expenses, settings } = useApp();

  // Interactive Live Scanner State
  const [scanType, setScanType] = useState<'INVOICE' | 'PAYMENT' | 'EXPENSE'>('INVOICE');
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('98000');
  const [employeeId, setEmployeeId] = useState('EMP-0881');
  const [receiptNumber, setReceiptNumber] = useState('HOTEL-DEL-9841');

  const [scanResult, setScanResult] = useState<any>(null);

  const handleRunScan = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount) || 0;

    if (scanType === 'INVOICE') {
      const res = assessInvoiceFraud(
        {
          id: 'test-scan-inv',
          invoiceNumber: invoiceNumber.trim(),
          vendorId,
          amount: numAmt,
          issueDate: new Date().toISOString(),
        },
        invoices,
        vendors,
        settings
      );
      setScanResult(res);
    } else if (scanType === 'PAYMENT') {
      const res = assessPaymentFraud(
        {
          id: 'test-scan-pay',
          vendorId,
          amount: numAmt,
          paymentDate: new Date().toISOString(),
        },
        payments,
        vendors,
        settings
      );
      setScanResult(res);
    } else {
      const res = assessExpenseFraud(
        {
          id: 'test-scan-exp',
          employeeId: employeeId.trim(),
          receiptNumber: receiptNumber.trim(),
          amount: numAmt,
          expenseDate: new Date().toISOString().slice(0, 10),
        },
        expenses
      );
      setScanResult(res);
    }
  };

  // Pre-configured Test Fraud Scenarios
  const handleLoadScenario = (scId: string) => {
    if (scId === 'dup-inv') {
      setScanType('INVOICE');
      setVendorId('v-101');
      setInvoiceNumber('INV-2026-089'); // Existing invoice in seed!
      setAmount('98000');
    } else if (scId === 'bank-mod') {
      setScanType('INVOICE');
      setVendorId('v-102'); // Vanguard changed bank 3 days ago!
      setInvoiceNumber('INV-2026-999');
      setAmount('150000');
    } else if (scId === 'split-pay') {
      setScanType('PAYMENT');
      setVendorId('v-103'); // Rapid Express has a 48,500 payment recently!
      setAmount('49500'); // Another near-threshold payment!
    } else if (scId === 'dup-receipt') {
      setScanType('EXPENSE');
      setEmployeeId('EMP-0881');
      setReceiptNumber('HOTEL-DEL-9841'); // Existing receipt!
      setAmount('24500');
    }
  };

  const rulesCatalog = [
    {
      id: 'R-01',
      name: 'Duplicate Invoice Prevention',
      severity: 'High (90 pts)',
      desc: 'Matches invoice number and vendor against the historical invoice repository.',
    },
    {
      id: 'R-02',
      name: 'Recent Bank Account Modification Lookback',
      severity: 'High (80 pts)',
      desc: 'Flags payments to vendors whose bank routing details were altered within 7 days.',
    },
    {
      id: 'R-03',
      name: 'Split Payment Evasion Detection',
      severity: 'High (70 pts)',
      desc: 'Flags multiple payments to the same vendor structured just below executive approval limit (₹50,000).',
    },
    {
      id: 'R-04',
      name: 'Duplicate Employee Expense Receipt',
      severity: 'High (85 pts)',
      desc: 'Compares merchant tax invoice numbers, amounts, and dates for repeated claims.',
    },
    {
      id: 'R-05',
      name: 'Invoice Inflation Anomaly',
      severity: 'Medium (55 pts)',
      desc: 'Identifies invoices exceeding 300% of vendor historical average billings.',
    },
    {
      id: 'R-06',
      name: 'Blacklisted & Ghost Vendor Filter',
      severity: 'Blocked (95 pts)',
      desc: 'Enforces hard stops for de-registered, shell, or compliance-blacklisted vendors.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F58220] flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Fraud Detection Centre &amp; Rules Engine
          </h2>
        </div>
        <p className="text-xs text-slate-600 font-medium">
          Transparent, explainable business fraud heuristics. All risk scores (0–100) are accompanied by exact evidentiary reasons and recommended actions.
        </p>
      </div>

      {/* Interactive Risk Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulator Form */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Live Transaction Scanner
            </h3>
            <span className="text-xs font-mono font-semibold text-slate-500">
              Modular Scoring Engine
            </span>
          </div>

          {/* Quick Scenario Pre-fill Pills */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
              Test Pre-configured Fraud Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleLoadScenario('dup-inv')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 hover:bg-orange-100 text-[#F58220] border border-orange-200"
              >
                Duplicate Invoice
              </button>
              <button
                type="button"
                onClick={() => handleLoadScenario('bank-mod')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
              >
                Bank Modification
              </button>
              <button
                type="button"
                onClick={() => handleLoadScenario('split-pay')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 text-red-800 border border-red-200"
              >
                Split Payout
              </button>
              <button
                type="button"
                onClick={() => handleLoadScenario('dup-receipt')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200"
              >
                Duplicate Expense
              </button>
            </div>
          </div>

          <form onSubmit={handleRunScan} className="space-y-3.5 pt-2 border-t border-slate-100">
            {/* Scan Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Entity Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScanType('INVOICE')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    scanType === 'INVOICE'
                      ? 'bg-[#F58220] text-white border-[#F58220]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setScanType('PAYMENT')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    scanType === 'PAYMENT'
                      ? 'bg-[#F58220] text-white border-[#F58220]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Payment
                </button>
                <button
                  type="button"
                  onClick={() => setScanType('EXPENSE')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    scanType === 'EXPENSE'
                      ? 'bg-[#F58220] text-white border-[#F58220]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Expense
                </button>
              </div>
            </div>

            {scanType !== 'EXPENSE' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vendor
                </label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  {vendors.length === 0 ? (
                    <option value="">(No vendors registered - clean custom mode)</option>
                  ) : (
                    vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.vendorCode})
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>
            )}

            {scanType === 'INVOICE' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-2026-089"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>
            )}

            {scanType === 'EXPENSE' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Receipt Number
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="e.g. HOTEL-DEL-9841"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount (INR ₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Evaluate Risk Profile</span>
            </button>
          </form>
        </div>

        {/* Scan Assessment Output */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Risk Analysis Breakdown
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Explainable Score &amp; Evidence
              </span>
            </div>

            {!scanResult ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Select a test scenario or enter parameters and click "Evaluate Risk Profile" to inspect the explainable scoring output.
              </div>
            ) : (
              <div className="space-y-4 mt-3">
                {/* Score Header */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase">
                      Calculated Risk Score:
                    </span>
                    <div className="text-2xl font-black font-mono text-slate-900">
                      {scanResult.riskScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getRiskBadgeClasses(scanResult.riskLevel).bg} ${getRiskBadgeClasses(scanResult.riskLevel).text} ${getRiskBadgeClasses(scanResult.riskLevel).border}`}>
                    {scanResult.riskLevel}
                  </span>
                </div>

                {/* Recommended Action */}
                <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl text-xs">
                  <span className="font-bold text-[#F58220] block mb-0.5">
                    Recommended Compliance Action:
                  </span>
                  <p className="text-slate-800 font-medium">{scanResult.recommendedAction}</p>
                </div>

                {/* Triggered Rules */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Triggered Integrity Rules ({scanResult.triggeredRules.length}):
                  </h4>
                  {scanResult.triggeredRules.length === 0 ? (
                    <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 font-medium">
                      ✓ No fraud indicators detected. Transaction conforms with corporate financial policy.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {scanResult.triggeredRules.map((r: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{r.ruleName}</span>
                            <span className="text-red-600 font-mono">+{r.score} pts</span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">{r.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Evidence Items */}
                {scanResult.evidence && scanResult.evidence.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Audit Evidence Artifacts:
                    </h4>
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                      {scanResult.evidence.map((ev: any, idx: number) => (
                        <div key={idx} className="p-2 flex items-center justify-between">
                          <span className="font-semibold text-slate-700">{ev.label}</span>
                          <span className="font-mono text-slate-900 font-bold">{ev.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rules Catalog Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Active Business Fraud Detection Rules
        </h3>
        <p className="text-xs text-slate-500 font-medium mb-4">
          All scoring rules are deterministic, explainable, and logged to audit trails.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rulesCatalog.map((r) => (
            <div key={r.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                  {r.id}
                </span>
                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  {r.severity}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">{r.name}</h4>
              <p className="text-[11px] text-slate-600 leading-snug">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
