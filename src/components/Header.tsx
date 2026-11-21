import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Download,
  AlertTriangle,
  X,
  CheckCircle2,
  AlertOctagon,
  Info,
  Trash2,
  Sparkles,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    stats,
    isDefaultData,
    rejectDefaultData,
    loadSampleData,
    downloadBackupJson,
    notifications,
    dismissNotification,
  } = useApp();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner for Enterprise Demo Notice */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 font-medium flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F58220] animate-pulse"></span>
          <span className="font-semibold text-white">TrustLedger AI Engine Active:</span>
          <span className="text-slate-300">Continuous enterprise transaction surveillance &amp; duplicate prevention mode</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
          <span>Protected Volume: ₹{((stats.totalInvoicesValue + stats.totalPaymentsValue) / 100000).toFixed(1)}L</span>
          <span>•</span>
          <span className="text-amber-400 font-bold">{stats.pendingInvestigations} Pending Reviews</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#F58220] flex items-center justify-center text-white font-extrabold text-2xl shadow-md shadow-orange-500/20 ring-4 ring-orange-100">
            T
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">
                TrustLedger <span className="text-[#F58220]">AI</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-orange-50 text-[#F58220] border border-orange-200 px-2 py-0.5 rounded-full">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Intelligent Business Fraud Detection &amp; Financial Integrity Platform
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Prevented Fraud badge */}
          <div className="hidden md:flex flex-col items-end text-right pr-2 border-r border-slate-200">
            <span className="text-[11px] text-slate-700 font-semibold uppercase tracking-wider">
              Prevented Duplicates
            </span>
            <span className="text-sm font-black text-emerald-600 font-mono">
              ₹{stats.amountPreventedDuplicatePayments.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Mode Switcher: Reject Default Data vs Clean Custom Data */}
          {isDefaultData ? (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Reject all default demo data?\n\nThis will purge pre-loaded sample invoices, payments, and vendors so you can enter or import your own custom business data.'
                  )
                ) {
                  rejectDefaultData();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 shadow-xs transition"
              title="Purge default sample records and switch to clean custom data mode"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Reject Default Data</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Custom Data Active
              </span>
              <button
                onClick={() => {
                  if (window.confirm('Load sample enterprise demo scenarios into the database?')) {
                    loadSampleData();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#F58220] bg-slate-100 hover:bg-orange-50 border border-slate-300 hover:border-orange-200 transition"
                title="Restore default demo scenarios"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F58220]" />
                <span className="hidden sm:inline">Load Sample Data</span>
              </button>
            </div>
          )}

          <button
            onClick={downloadBackupJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
            title="Download complete JSON backup"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Backup</span>
          </button>
        </div>
      </div>

      {/* Floating Toast Notification Container */}
      {notifications.length > 0 && (
        <div className="fixed top-24 right-4 z-50 w-full max-w-md space-y-2 pointer-events-none">
          {notifications.map((notif) => {
            const isError = notif.type === 'error';
            const isWarn = notif.type === 'warning';
            const isSuccess = notif.type === 'success';

            return (
              <div
                key={notif.id}
                role="alert"
                className={`pointer-events-auto p-4 rounded-xl shadow-xl border flex items-start gap-3 backdrop-blur-md transition-all animate-in slide-in-from-top-2 ${isError
                    ? 'bg-red-50/95 border-red-300 text-red-950'
                    : isWarn
                      ? 'bg-amber-50/95 border-amber-300 text-amber-950'
                      : isSuccess
                        ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
                        : 'bg-slate-900/95 border-slate-700 text-white'
                  }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isError && <AlertOctagon className="w-5 h-5 text-red-600" />}
                  {isWarn && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                  {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  {!isError && !isWarn && !isSuccess && <Info className="w-5 h-5 text-[#F58220]" />}
                </div>

                <div className="flex-1 text-xs">
                  <h4 className="font-bold text-sm leading-snug">{notif.title}</h4>
                  <p className="mt-1 leading-relaxed opacity-95">{notif.message}</p>
                </div>

                <button
                  onClick={() => dismissNotification(notif.id)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 transition"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
};
