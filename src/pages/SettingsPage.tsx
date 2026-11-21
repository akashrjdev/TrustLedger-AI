import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Sliders,
  Database,
  RotateCcw,
  Download,
  CheckCircle2,
  Trash2,
  Sparkles,
  UploadCloud,
  FileCode,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

const SAMPLE_CUSTOM_DATA_JSON = JSON.stringify(
  {
    vendors: [
      {
        name: 'Bharat Telecom Infrastructure Ltd',
        gstin: '29AAACB1234P1Z5',
        category: 'Telecommunications & Cloud',
        email: 'billing@bharat-telecom.in',
        phone: '+91 80 4455 6677',
        address: 'MG Road, Bengaluru, Karnataka',
        bankAccountNumber: '02811040008899',
        bankIfsc: 'HDFC0000281',
        bankName: 'HDFC Bank Ltd',
        status: 'Active',
      },
      {
        name: 'Southern Logistics & Warehousing',
        gstin: '33AABCS9876Q1Z2',
        category: 'Supply Chain & Transport',
        email: 'accounts@southern-logistics.com',
        phone: '+91 44 2828 1122',
        address: 'Guindy Industrial Estate, Chennai, Tamil Nadu',
        bankAccountNumber: '91802003004050',
        bankIfsc: 'UTIB0000918',
        bankName: 'Axis Bank Ltd',
        status: 'Active',
      },
    ],
    invoices: [
      {
        invoiceNumber: 'BTI-2026-8801',
        vendorName: 'Bharat Telecom Infrastructure Ltd',
        amount: 85000,
        currency: 'INR',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        description: 'Dedicated enterprise leased-line internet (Quarterly)',
        department: 'Engineering',
        lineItems: [
          {
            id: 'li-1',
            description: 'Fiber leased line bandwidth 1 Gbps',
            quantity: 1,
            unitPrice: 85000,
            amount: 85000,
          },
        ],
        status: 'Pending Approval',
      },
    ],
  },
  null,
  2
);

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    downloadBackupJson,
    restoreBackupJson,
    isDefaultData,
    rejectDefaultData,
    loadSampleData,
    importCustomData,
  } = useApp();

  const [approvalLimit, setApprovalLimit] = useState(settings.approvalLimitThreshold.toString());
  const [splitWindow, setSplitWindow] = useState(settings.splitPaymentWindowHours.toString());
  const [inflationMultiplier, setInflationMultiplier] = useState(settings.invoiceInflationMultiplier.toString());
  const [bankLookback, setBankLookback] = useState(settings.vendorBankLookbackDays.toString());
  const [duplicateLookback, setDuplicateLookback] = useState(settings.duplicateLookbackDays.toString());

  const [jsonInput, setJsonInput] = useState('');
  const [customDataJson, setCustomDataJson] = useState('');
  const [customImportResult, setCustomImportResult] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      approvalLimitThreshold: parseFloat(approvalLimit) || 50000,
      splitPaymentWindowHours: parseInt(splitWindow, 10) || 48,
      invoiceInflationMultiplier: parseFloat(inflationMultiplier) || 3.0,
      vendorBankLookbackDays: parseInt(bankLookback, 10) || 7,
      duplicateLookbackDays: parseInt(duplicateLookback, 10) || 90,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleImportBackup = () => {
    if (!jsonInput.trim()) {
      alert('Please paste valid backup JSON content into the text area.');
      return;
    }
    const ok = restoreBackupJson(jsonInput.trim());
    if (ok) setJsonInput('');
  };

  const handleImportCustomData = () => {
    if (!customDataJson.trim()) {
      alert('Please paste or fill custom JSON data first.');
      return;
    }
    const res = importCustomData(customDataJson.trim());
    if (res.success) {
      setCustomImportResult(
        `Accepted & Ingested: ${res.addedVendors} vendors, ${res.addedInvoices} invoices, ${res.addedPayments} payments. ${
          res.errors.length > 0 ? `(${res.errors.length} skipped duplicates/errors)` : ''
        }`
      );
      setCustomDataJson('');
    } else {
      setCustomImportResult(`Error: ${res.errors.join('; ')}`);
    }
    setTimeout(() => setCustomImportResult(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F58220] flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Platform Settings &amp; Data Governance
          </h2>
        </div>
        <p className="text-xs text-slate-600 font-medium">
          Reject pre-seeded demo records, load custom business data, adjust fraud thresholds, and manage data governance.
        </p>
      </div>

      {/* Prominent Data Source Control: Reject Default Data vs Custom Data Mode */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#F58220]" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Data Mode &amp; Default Data Rejection
              </h3>
              <p className="text-xs text-slate-500">
                Switch between simulated enterprise sample datasets and pure custom user data.
              </p>
            </div>
          </div>
          <div>
            {isDefaultData ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Default Demo Data Active
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Clean Custom Data Mode Active
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reject Default Data Card */}
          <div className="p-4 bg-red-50/50 rounded-xl border border-red-200 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <h4 className="text-xs font-bold text-red-950 uppercase">Reject Default Data (Start Fresh)</h4>
              </div>
              <p className="text-xs text-red-900/80 mt-1 leading-relaxed">
                Purges all pre-seeded dummy records (mock vendors, demo invoices, fake expenses). The database will remain 100% empty so TrustLedger AI only processes your own custom business data.
              </p>
            </div>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Reject all default demo data?\n\nAll pre-loaded sample records will be cleared. TrustLedger AI will run exclusively on custom user-provided records.'
                  )
                ) {
                  rejectDefaultData();
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reject Default Data &amp; Wipe DB</span>
            </button>
          </div>

          {/* Load Sample Demo Data Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F58220]" />
                <h4 className="text-xs font-bold text-slate-900 uppercase">Load Enterprise Sample Data</h4>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Re-seeds the environment with calibrated enterprise fraud scenarios (duplicate invoice #INV-2026-089, split payment #PAY-REF-2026-1025, and duplicate employee hotel bill #HOTEL-DEL-9841).
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Restore default enterprise demo scenarios?')) {
                  loadSampleData();
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#F58220]" />
              <span>Load Sample Demo Data</span>
            </button>
          </div>
        </div>

        {/* Batch Ingest Custom Data Tool */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-[#F58220]" />
                Batch Ingest Custom Data (JSON)
              </h4>
              <p className="text-[11px] text-slate-500">
                Paste your custom vendors and invoices in JSON format to ingest them into TrustLedger AI simultaneously.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCustomDataJson(SAMPLE_CUSTOM_DATA_JSON)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#F58220] bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition self-start sm:self-auto"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Paste Sample Template</span>
            </button>
          </div>

          <textarea
            rows={5}
            value={customDataJson}
            onChange={(e) => setCustomDataJson(e.target.value)}
            placeholder='Paste JSON with { "vendors": [...], "invoices": [...], "payments": [...] }'
            className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-slate-50 focus:bg-white resize-none"
          />

          {customImportResult && (
            <div
              role="alert"
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                customImportResult.startsWith('Accepted')
                  ? 'bg-emerald-50 text-emerald-950 border border-emerald-300'
                  : 'bg-red-50 text-red-950 border border-red-300'
              }`}
            >
              {customImportResult.startsWith('Accepted') ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{customImportResult}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleImportCustomData}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-md shadow-orange-500/20 transition flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Accept &amp; Ingest Custom Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Threshold Configuration */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#F58220]" />
            <h3 className="text-base font-bold text-slate-900">
              Fraud Detection Thresholds
            </h3>
          </div>
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveThresholds} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Approval Limit Threshold (INR ₹)
            </label>
            <input
              type="number"
              value={approvalLimit}
              onChange={(e) => setApprovalLimit(e.target.value)}
              step="5000"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Standard single-approver threshold</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Split Payment Window (Hours)
            </label>
            <input
              type="number"
              value={splitWindow}
              onChange={(e) => setSplitWindow(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Timeframe to detect structured split payouts</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Invoice Inflation Multiplier (x)
            </label>
            <input
              type="number"
              step="0.5"
              value={inflationMultiplier}
              onChange={(e) => setInflationMultiplier(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Flags amounts exceeding vendor historical average</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Vendor Bank Change Lookback (Days)
            </label>
            <input
              type="number"
              value={bankLookback}
              onChange={(e) => setBankLookback(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Quarantines payments after bank routing updates</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Duplicate Invoice Lookback (Days)
            </label>
            <input
              type="number"
              value={duplicateLookback}
              onChange={(e) => setDuplicateLookback(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Fuzzy duplicate amount detection window</span>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-md transition"
            >
              Update Thresholds
            </button>
          </div>
        </form>
      </div>

      {/* Backup and Recovery Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Database className="w-5 h-5 text-[#F58220]" />
          <h3 className="text-base font-bold text-slate-900">
            Database Snapshot &amp; File Export
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase">Export JSON Snapshot</h4>
            <p className="text-xs text-slate-600">
              Download the entire repository including all custom invoices, vendors, payment logs, and investigation cases as an exportable JSON file.
            </p>
            <button
              onClick={downloadBackupJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition mt-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Database Snapshot</span>
            </button>
          </div>

          {/* Restore from JSON */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase">Restore From Backup File</h4>
            <p className="text-xs text-slate-600">
              Paste a previously exported snapshot JSON to restore the complete repository state.
            </p>
            <textarea
              rows={2}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste exported backup JSON here..."
              className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-300 bg-white focus:bg-white resize-none"
            />
            <button
              onClick={handleImportBackup}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition"
            >
              Import Snapshot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
