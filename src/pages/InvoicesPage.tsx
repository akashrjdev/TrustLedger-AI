import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice } from '../types';
import { formatCurrency, formatDate, getRiskBadgeClasses } from '../utils/formatter';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  Download,
  AlertTriangle,
  AlertOctagon,
  Eye,
  X,
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const { invoices, vendors, createInvoice, createVendor, downloadCsv } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // New Invoice Modal State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [vendorMode, setVendorMode] = useState<'existing' | 'new'>(vendors.length === 0 ? 'new' : 'existing');
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');

  // Inline New Vendor Fields (for frictionless custom data entry)
  const [inlineVendorName, setInlineVendorName] = useState('');
  const [inlineVendorGstin, setInlineVendorGstin] = useState('');
  const [inlineVendorBank, setInlineVendorBank] = useState('');
  const [inlineVendorIfsc, setInlineVendorIfsc] = useState('');
  const [inlineBankName, setInlineBankName] = useState('State Bank of India');

  const [amount, setAmount] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [department, setDepartment] = useState('Procurement');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Synchronize vendorId when vendors list changes
  React.useEffect(() => {
    if (vendors.length === 0) {
      setVendorMode('new');
    } else if (!vendorId) {
      setVendorId(vendors[0]?.id || '');
    }
  }, [vendors, vendorId]);

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = filterRisk === 'ALL' || inv.riskLevel === filterRisk;
    const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;

    return matchesSearch && matchesRisk && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numAmount = parseFloat(amount);
    if (!invoiceNo.trim()) {
      setFormError('Invoice number is required.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid amount greater than zero.');
      return;
    }

    setIsSubmitting(true);

    try {
      let targetVendorId = vendorId;
      let targetVendorName = vendors.find((v) => v.id === vendorId)?.name || '';

      // If user is registering a custom vendor inline or no vendors exist yet
      if (vendorMode === 'new' || vendors.length === 0) {
        if (!inlineVendorName.trim() || !inlineVendorGstin.trim() || !inlineVendorBank.trim() || !inlineVendorIfsc.trim()) {
          setFormError('Vendor Name, GSTIN, Bank Account Number, and IFSC Code are required.');
          setIsSubmitting(false);
          return;
        }

        const vRes = createVendor({
          name: inlineVendorName.trim(),
          gstin: inlineVendorGstin.trim().toUpperCase(),
          category: 'Enterprise Vendor',
          email: `${inlineVendorName.toLowerCase().replace(/[^a-z0-9]/g, '')}@vendor.com`,
          phone: '+91 80 4000 1234',
          address: 'Commercial District, India',
          bankAccountNumber: inlineVendorBank.trim(),
          bankIfsc: inlineVendorIfsc.trim().toUpperCase(),
          bankName: inlineBankName.trim() || 'Commercial Bank',
          status: 'Active',
        });

        if (!vRes.success || !vRes.vendor) {
          setFormError(vRes.error || 'Failed to register vendor.');
          setIsSubmitting(false);
          return;
        }

        targetVendorId = vRes.vendor.id;
        targetVendorName = vRes.vendor.name;
      } else {
        if (!targetVendorId) {
          setFormError('Please select a valid registered vendor.');
          setIsSubmitting(false);
          return;
        }
      }

      const res = createInvoice({
        invoiceNumber: invoiceNo.trim(),
        vendorId: targetVendorId,
        vendorName: targetVendorName,
        amount: numAmount,
        currency: 'INR',
        issueDate: new Date(issueDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        description: description.trim() || 'General supplies & services',
        department,
        lineItems: [
          {
            id: `li-${Date.now()}`,
            description: description.trim() || 'Primary invoiced deliverable',
            quantity: 1,
            unitPrice: numAmount,
            amount: numAmount,
          },
        ],
        status: 'Pending Approval',
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to submit invoice');
      } else {
        setShowModal(false);
        setInvoiceNo('');
        setAmount('');
        setDescription('');
        setInlineVendorName('');
        setInlineVendorGstin('');
        setInlineVendorBank('');
        setInlineVendorIfsc('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F58220] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Invoice Management
            </h2>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Strict duplicate prevention, line item analysis, and automated fraud quarantine.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadCsv('invoices')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-md shadow-orange-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ingest New Invoice</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice #, vendor, or dept..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#F58220] bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Risk:</span>
          </div>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 bg-white"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="Safe">Safe</option>
            <option value="Suspicious">Suspicious</option>
            <option value="High Risk">High Risk</option>
            <option value="Blocked">Blocked</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold shrink-0 ml-2">
            <span>Status:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Flagged">Flagged</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#F58220] flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {invoices.length === 0 ? 'No Invoices in Database (Custom Data Mode)' : 'No matching invoices found'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {invoices.length === 0
                ? 'Default demo data has been rejected or cleared. Ingest your business invoice or upload data to begin fraud analysis.'
                : 'Try adjusting your search query or filter options.'}
            </p>
            {invoices.length === 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#F58220] text-white hover:bg-[#DE6E10] shadow-md shadow-orange-500/20 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Ingest First Custom Invoice</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Vendor Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const badge = getRiskBadgeClasses(inv.riskLevel);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                        {inv.isDuplicate && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                            DUPLICATE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {inv.vendorName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {inv.department}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900 num-cell">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {inv.riskLevel} ({inv.riskScore})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${inv.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : inv.status === 'Flagged'
                              ? 'bg-red-50 text-red-800 border border-red-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#F58220] hover:bg-orange-50 transition"
                          title="View Invoice Details"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Invoice #{selectedInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Vendor: {selectedInvoice.vendorName} ({selectedInvoice.vendorGstin})
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block font-semibold">Total Amount:</span>
                <span className="text-base font-black font-mono text-slate-900">
                  {formatCurrency(selectedInvoice.amount)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">Risk Rating:</span>
                <span className="text-sm font-bold text-[#F58220] font-mono">
                  {selectedInvoice.riskLevel} ({selectedInvoice.riskScore} pts)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">Issue Date:</span>
                <span className="font-medium text-slate-800">{formatDate(selectedInvoice.issueDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">Due Date:</span>
                <span className="font-medium text-slate-800">{formatDate(selectedInvoice.dueDate)}</span>
              </div>
            </div>

            {selectedInvoice.fraudReasons.length > 0 && (
              <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 space-y-1.5 text-xs">
                <span className="font-bold text-red-900 block flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Fraud Engine Findings:
                </span>
                {selectedInvoice.fraudReasons.map((r, i) => (
                  <p key={i} className="text-red-800 font-medium leading-relaxed">
                    • {r}
                  </p>
                ))}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Line Items
              </h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {selectedInvoice.lineItems.map((item) => (
                  <div key={item.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{item.description}</p>
                      <span className="text-[11px] text-slate-500 font-mono">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ingest New Invoice Modal (with Duplicate Prevention & Submit Lock) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Ingest Vendor Invoice
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-900 flex items-start gap-2"
              >
                <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-snug">{formError}</div>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              {/* Vendor Selector / Inline Vendor Registration */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Vendor Selection *
                  </label>
                  {vendors.length > 0 && (
                    <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setVendorMode('existing')}
                        className={`px-2.5 py-1 rounded-md transition ${vendorMode === 'existing'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        Existing Vendor
                      </button>
                      <button
                        type="button"
                        onClick={() => setVendorMode('new')}
                        className={`px-2.5 py-1 rounded-md transition ${vendorMode === 'new'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        + New Vendor Inline
                      </button>
                    </div>
                  )}
                </div>

                {vendorMode === 'existing' && vendors.length > 0 ? (
                  <div>
                    <select
                      value={vendorId}
                      onChange={(e) => setVendorId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                    >
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.vendorCode} • {v.status})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-slate-200/60">
                    <div className="text-[11px] font-medium text-slate-600">
                      {vendors.length === 0
                        ? 'No vendors found in clean mode. Enter custom vendor details to auto-register:'
                        : 'Registering a new custom vendor for this invoice:'}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                          Vendor Name *
                        </label>
                        <input
                          type="text"
                          value={inlineVendorName}
                          onChange={(e) => setInlineVendorName(e.target.value)}
                          placeholder="e.g. Acme Tech Labs"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                          GSTIN *
                        </label>
                        <input
                          type="text"
                          value={inlineVendorGstin}
                          onChange={(e) => setInlineVendorGstin(e.target.value)}
                          placeholder="e.g. 29ABCDE1234F1Z5"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white uppercase font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={inlineBankName}
                          onChange={(e) => setInlineBankName(e.target.value)}
                          placeholder="Bank Name"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                          Account Number *
                        </label>
                        <input
                          type="text"
                          value={inlineVendorBank}
                          onChange={(e) => setInlineVendorBank(e.target.value)}
                          placeholder="e.g. 502000123456"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                          IFSC Code *
                        </label>
                        <input
                          type="text"
                          value={inlineVendorIfsc}
                          onChange={(e) => setInlineVendorIfsc(e.target.value)}
                          placeholder="HDFC0001234"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white uppercase font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-2026-901"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount (INR ₹) *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 75000"
                    min="1"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Procurement">Procurement</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Operations">Operations</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Facilities">Facilities</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Deliverables
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Items or services billed"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white resize-none"
                />
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
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-md shadow-orange-500/20 transition flex items-center gap-2 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                >
                  <span>{isSubmitting ? 'Validating...' : 'Validate & Save Invoice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
