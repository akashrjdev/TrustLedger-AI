import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Vendor } from '../types';
import { formatCurrency, formatDate, maskBankAccount, getRiskBadgeClasses } from '../utils/formatter';
import {
  Building2,
  PlusCircle,
  Search,
  Download,
  AlertTriangle,
  X,
  ShieldAlert,
} from 'lucide-react';

export const VendorsPage: React.FC = () => {
  const { vendors, createVendor, updateVendorBank, downloadCsv } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [bankModalVendor, setBankModalVendor] = useState<Vendor | null>(null);

  // New Vendor Form
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [category, setCategory] = useState('IT Hardware & Cloud');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank Ltd');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bank Change Form
  const [newAccount, setNewAccount] = useState('');
  const [newIfsc, setNewIfsc] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [bankFormError, setBankFormError] = useState<string | null>(null);

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.gstin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegisterVendor = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !gstin.trim() || !bankAccount.trim() || !bankIfsc.trim()) {
      setFormError('Name, GSTIN, Bank Account, and IFSC are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = createVendor({
        name: name.trim(),
        gstin: gstin.trim().toUpperCase(),
        category,
        email: email.trim() || 'vendor@corporate.com',
        phone: phone.trim() || '+91 80 1234 5678',
        address: address.trim() || 'Industrial Estate, India',
        bankAccountNumber: bankAccount.trim(),
        bankIfsc: bankIfsc.trim().toUpperCase(),
        bankName,
        status: 'Active',
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to register vendor');
      } else {
        setShowAddModal(false);
        setName('');
        setGstin('');
        setBankAccount('');
        setBankIfsc('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBankChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBankFormError(null);
    if (!bankModalVendor) return;

    if (!newAccount.trim() || !newIfsc.trim() || !changeReason.trim()) {
      setBankFormError('New account number, IFSC, and change reason are required.');
      return;
    }

    const res = updateVendorBank(
      bankModalVendor.id,
      newAccount.trim(),
      newIfsc.trim(),
      newBankName.trim() || 'Updated Bank',
      changeReason.trim()
    );

    if (res.success) {
      setBankModalVendor(null);
      setNewAccount('');
      setNewIfsc('');
      setChangeReason('');
    } else {
      setBankFormError(res.error || 'Failed to update bank account.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F58220] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Vendor Management &amp; Bank Integrity
            </h2>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Prevents duplicate GSTIN registrations, monitors vendor bank modifications, and tracks risk ratings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadCsv('vendors')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-md shadow-orange-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Onboard New Vendor</span>
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
            placeholder="Search by vendor name, code, or GSTIN..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#F58220] bg-slate-50 focus:bg-white"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
          Showing {filteredVendors.length} of {vendors.length} Vendors
        </span>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredVendors.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#F58220] flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {vendors.length === 0 ? 'No Vendors in Database (Clean Custom Mode)' : 'No matching vendors found'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {vendors.length === 0
                ? 'Default demo data has been rejected. Click below to register your first business vendor.'
                : 'Try adjusting your search query.'}
            </p>
            {vendors.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#F58220] text-white hover:bg-[#DE6E10] shadow-md shadow-orange-500/20 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Register First Vendor</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-3 px-4">Vendor Code</th>
                <th className="py-3 px-4">Vendor Name</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Bank Account</th>
                <th className="py-3 px-4 text-right">Total Invoiced</th>
                <th className="py-3 px-4">Risk Rating</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.map((v) => {
                const badge = getRiskBadgeClasses(v.riskLevel);
                return (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {v.vendorCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{v.name}</div>
                      <div className="text-[11px] text-slate-500">{v.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {v.gstin}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {v.category}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800 font-bold">{maskBankAccount(v.bankAccountNumber)}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{v.bankIfsc} • {v.bankName}</div>
                      {v.lastBankChangeDate && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Bank updated {formatDate(v.lastBankChangeDate)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-slate-900 num-cell">
                      {formatCurrency(v.totalInvoiced)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {v.riskLevel} ({v.riskScore})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        v.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : v.status === 'Blacklisted'
                          ? 'bg-rose-950 text-white border border-rose-900'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setBankModalVendor(v);
                          setNewBankName(v.bankName);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                        title="Update payout bank details"
                      >
                        Change Bank
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Onboard Vendor Modal (Strict Unique Constraints) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Onboard New Master Vendor
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-snug">{formError}</div>
              </div>
            )}

            <form onSubmit={handleRegisterVendor} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Vendor Legal Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Industrial Solutions Pvt Ltd"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="billing@company.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 80 1234 5678"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registered Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Facilities or MRO"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account Number *</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="e.g. 918020491029"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank IFSC Code *</label>
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001029"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-md shadow-orange-500/20"
                >
                  {isSubmitting ? 'Verifying...' : 'Validate & Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Bank Details Modal */}
      {bankModalVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Update Bank for {bankModalVendor.name}
              </h3>
              <button onClick={() => setBankModalVendor(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Audit Warning:</strong> Updating vendor bank account automatically triggers the 7-day lookback fraud rule for any upcoming payouts.
              </span>
            </div>

            {bankFormError && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-900">
                {bankFormError}
              </div>
            )}

            <form onSubmit={handleBankChangeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Bank Account Number *</label>
                <input
                  type="text"
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  placeholder="e.g. 02811040001928"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New IFSC Code *</label>
                <input
                  type="text"
                  value={newIfsc}
                  onChange={(e) => setNewIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. ICIC0000281"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Bank Modification *</label>
                <textarea
                  rows={2}
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Official explanation and ticket reference"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBankModalVendor(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-md"
                >
                  Confirm &amp; Log Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
