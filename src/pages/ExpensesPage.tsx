import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getRiskBadgeClasses } from '../utils/formatter';
import {
  Receipt,
  PlusCircle,
  Search,
  Download,
  X,
} from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { expenses, createExpense, downloadCsv } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [employeeId, setEmployeeId] = useState('EMP-0881');
  const [employeeName, setEmployeeName] = useState('Rajesh Sharma');
  const [department, setDepartment] = useState('Sales & BD');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [category, setCategory] = useState<'Travel' | 'Meals & Entertainment' | 'Lodging' | 'Software & Subscriptions' | 'Office Supplies'>('Lodging');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredExpenses = expenses.filter((e) =>
    e.claimReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.merchantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numAmount = parseFloat(amount);
    if (!employeeId.trim() || !receiptNumber.trim() || !merchantName.trim() || isNaN(numAmount) || numAmount <= 0) {
      setFormError('Employee ID, Receipt Number, Merchant, and valid Amount are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const claimRef = `EXP-CLM-2026-${String(expenses.length + 1).padStart(4, '0')}`;
      const res = createExpense({
        claimReference: claimRef,
        employeeId: employeeId.trim(),
        employeeName: employeeName.trim(),
        department,
        receiptNumber: receiptNumber.trim(),
        merchantName: merchantName.trim(),
        expenseCategory: category,
        amount: numAmount,
        currency: 'INR',
        expenseDate,
        submissionDate: new Date().toISOString(),
        notes: notes.trim(),
        status: 'Submitted',
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to submit expense claim');
      } else {
        setShowModal(false);
        setReceiptNumber('');
        setMerchantName('');
        setAmount('');
        setNotes('');
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
              <Receipt className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Employee Expense Auditing &amp; Duplicate Receipt Check
            </h2>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Prevents repeated receipt submissions, cross-checks merchant tax invoices, and identifies duplicate reimbursements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadCsv('expenses')}
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
            <span>Submit Expense Claim</span>
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
            placeholder="Search claim ref, employee, or receipt #..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#F58220] bg-slate-50 focus:bg-white"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
          {filteredExpenses.length} Expense Claims
        </span>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#F58220] flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {expenses.length === 0 ? 'No Expense Claims in Database (Clean Custom Mode)' : 'No matching expenses found'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {expenses.length === 0
                ? 'Default demo data has been rejected. Submit your custom expense claim to test duplicate receipt scanning.'
                : 'Try adjusting your search query.'}
            </p>
            {expenses.length === 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#F58220] text-white hover:bg-[#DE6E10] shadow-md shadow-orange-500/20 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Submit First Expense Claim</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-3 px-4">Claim Ref</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Merchant</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Expense Date</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => {
                const badge = getRiskBadgeClasses(exp.riskLevel);
                return (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {exp.claimReference}
                      {exp.isDuplicateReceipt && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-900 border border-red-300">
                          DUP RECEIPT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{exp.employeeName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{exp.employeeId} • {exp.department}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {exp.receiptNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {exp.merchantName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {exp.expenseCategory}
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-slate-900 num-cell">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {formatDate(exp.expenseDate)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {exp.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        exp.status === 'Reimbursed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : exp.status === 'Flagged Duplicate'
                          ? 'bg-red-50 text-red-800 border border-red-300'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {exp.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Submit Expense Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Submit Employee Expense Claim
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-900">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitExpense} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee Name *</label>
                  <input
                    type="text"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Merchant Receipt # *</label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="e.g. HOTEL-DEL-9841"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Merchant / Establishment *</label>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="e.g. The Oberoi or Indigo Airlines"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expense Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Lodging">Lodging</option>
                    <option value="Travel">Travel</option>
                    <option value="Meals & Entertainment">Meals & Entertainment</option>
                    <option value="Software & Subscriptions">Software & Subscriptions</option>
                    <option value="Office Supplies">Office Supplies</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (INR ₹) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 24500"
                    min="1"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expense Date</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
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
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-md shadow-orange-500/20"
                >
                  {isSubmitting ? 'Scanning Receipt...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
