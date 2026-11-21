import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime, maskBankAccount, getRiskBadgeClasses } from '../utils/formatter';
import {
  CreditCard,
  PlusCircle,
  Search,
  Download,
  Lock,
  X,
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { payments, vendors, createPayment, downloadCsv } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'NEFT' | 'RTGS' | 'IMPS' | 'ACH' | 'Corporate Wire'>('NEFT');
  const [idempotencyKey, setIdempotencyKey] = useState(`idemp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredPayments = payments.filter((p) =>
    p.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numAmount = parseFloat(amount);
    if (!vendorId || !invoiceNumber.trim() || isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please select vendor, provide invoice reference, and enter valid amount.');
      return;
    }

    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) {
      setFormError('Selected vendor does not exist.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payRef = `PAY-REF-${Date.now().toString().slice(-6)}`;
      const res = createPayment({
        paymentReference: payRef,
        idempotencyKey,
        invoiceId: `inv-ref-${Date.now()}`,
        invoiceNumber: invoiceNumber.trim(),
        vendorId: vendor.id,
        vendorName: vendor.name,
        amount: numAmount,
        currency: 'INR',
        paymentMethod,
        beneficiaryAccount: vendor.bankAccountNumber,
        beneficiaryIfsc: vendor.bankIfsc,
        paymentDate: new Date().toISOString(),
        approvalLimitThreshold: 50000,
        status: 'Completed',
      });

      if (!res.success) {
        setFormError(res.error || 'Payment execution blocked');
      } else {
        setShowModal(false);
        setAmount('');
        setInvoiceNumber('');
        setIdempotencyKey(`idemp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F58220] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Payment Monitoring &amp; Disbursement Integrity
            </h2>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Idempotent payment gate, double-submission blocking, and split-payment detection.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadCsv('payments')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setIdempotencyKey(`idemp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-md shadow-orange-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Initiate Payout</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payment reference, vendor, or invoice..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#F58220] bg-slate-50 focus:bg-white"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
          {filteredPayments.length} Transactions
        </span>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#F58220] flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {payments.length === 0 ? 'No Payments in Database (Clean Custom Mode)' : 'No matching payments found'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {payments.length === 0
                ? 'Default demo data has been rejected. Initiate a custom payment to test idempotency and approval thresholds.'
                : 'Try adjusting your search query.'}
            </p>
            {payments.length === 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#F58220] text-white hover:bg-[#DE6E10] shadow-md shadow-orange-500/20 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Initiate First Payment</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Beneficiary Account</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Split Risk</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Disbursed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const badge = getRiskBadgeClasses(p.riskLevel);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {p.paymentReference}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {p.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {p.vendorName}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {maskBankAccount(p.beneficiaryAccount)}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900 num-cell">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-4">
                        {p.isSplitPayment ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-900 border border-red-300">
                            SPLIT ATTEMPT
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Normal</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {p.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${p.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : p.status === 'Held'
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDateTime(p.paymentDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Initiate Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Initiate Corporate Payout
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Idempotency Protection Indicator */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold">Idempotency Token Active:</span>
              </div>
              <span className="font-mono text-[11px] text-blue-800 font-bold">{idempotencyKey.slice(0, 18)}...</span>
            </div>

            {formError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-900">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreatePayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Payee Vendor *</label>
                {vendors.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                    No registered vendors in database. Please onboard a vendor first in the Vendor Management tab before initiating payouts.
                  </div>
                ) : (
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.bankName} • {maskBankAccount(v.bankAccountNumber)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-2026-089"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (INR ₹) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 48500"
                    min="1"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Disbursement Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="NEFT">NEFT (National Electronic Fund Transfer)</option>
                  <option value="RTGS">RTGS (Real-Time Gross Settlement &gt; ₹2 Lakhs)</option>
                  <option value="IMPS">IMPS (Immediate Payment Service)</option>
                  <option value="Corporate Wire">Corporate Wire</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-md shadow-orange-500/20 flex items-center gap-2 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                >
                  <span>{isSubmitting ? 'Verifying Gateway...' : 'Submit Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
