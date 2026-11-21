import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InvestigationCase, InvestigationStatus } from '../types';
import { formatCurrency, formatDateTime, getRiskBadgeClasses, getInvestigationBadgeClasses } from '../utils/formatter';
import {
  FileSearch,
  Search,
  Download,
  X,
  MessageSquare,
  Send,
} from 'lucide-react';

export const InvestigationsPage: React.FC = () => {
  const { investigations, updateInvestigationStatus, downloadCsv } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(null);

  // Modal Review Form
  const [newStatus, setNewStatus] = useState<InvestigationStatus>('Confirmed Fraud');
  const [newComment, setNewComment] = useState('');

  const filteredCases = investigations.filter((c) => {
    const matchesSearch =
      c.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.involvedParty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.fraudType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newComment.trim()) return;

    updateInvestigationStatus(selectedCase.id, newStatus, newComment.trim());

    // Update local modal state
    const updated = {
      ...selectedCase,
      status: newStatus,
      reviewerComments: [
        {
          id: `comm-${Date.now()}`,
          author: 'Lead Fraud Auditor',
          role: 'Fraud Investigation Specialist',
          comment: newComment.trim(),
          timestamp: new Date().toISOString(),
        },
        ...selectedCase.reviewerComments,
      ],
    };
    setSelectedCase(updated);
    setNewComment('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F58220] flex items-center justify-center">
              <FileSearch className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Investigation Queue &amp; Case Management
            </h2>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Review suspicious payments, duplicate invoices, and employee expense claims with full audit trail.
          </p>
        </div>

        <button
          onClick={() => downloadCsv('investigations')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Case Log</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search case ID, party, or fraud type..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#F58220] bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Confirmed Fraud">Confirmed Fraud</option>
            <option value="False Positive">False Positive</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredCases.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500 font-medium">
            No investigation cases matching filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Fraud Type</th>
                  <th className="py-3 px-4">Involved Party</th>
                  <th className="py-3 px-4 text-right">Amount Involved</th>
                  <th className="py-3 px-4">Risk Rating</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Detection Date</th>
                  <th className="py-3 px-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((c) => {
                  const riskBadge = getRiskBadgeClasses(c.riskLevel);
                  const statusBadge = getInvestigationBadgeClasses(c.status);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {c.caseId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px]">
                          {c.fraudType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.involvedParty}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{c.entityReference}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900 num-cell">
                        {formatCurrency(c.amountInvolved)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${riskBadge.bg} ${riskBadge.text} ${riskBadge.border}`}>
                          {c.riskLevel} ({c.riskScore})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDateTime(c.detectionDate)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedCase(c);
                            setNewStatus(c.status);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-xs transition"
                        >
                          Review Case
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

      {/* Case Details & Review Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    Investigation {selectedCase.caseId}
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {selectedCase.entityType}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Reference: {selectedCase.entityReference}
                </p>
              </div>

              <button onClick={() => setSelectedCase(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block font-semibold">Involved Party:</span>
                <span className="font-bold text-slate-900">{selectedCase.involvedParty}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">Amount Involved:</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {formatCurrency(selectedCase.amountInvolved)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">Risk Rating:</span>
                <span className="font-mono font-bold text-red-700">
                  {selectedCase.riskLevel} ({selectedCase.riskScore} pts)
                </span>
              </div>
            </div>

            {/* Evidence Artifacts */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Audit Evidence &amp; Rule Violations
              </h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {selectedCase.evidence.map((ev, i) => (
                  <div key={i} className="p-2.5 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{ev.label}</span>
                    <span className="font-mono font-bold text-slate-900">{ev.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviewer Comments Feed */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                Reviewer Comments &amp; Findings ({selectedCase.reviewerComments.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {selectedCase.reviewerComments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No notes recorded yet.</p>
                ) : (
                  selectedCase.reviewerComments.map((comm) => (
                    <div key={comm.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{comm.author}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{formatDateTime(comm.timestamp)}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{comm.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Decision Form */}
            <form onSubmit={handleUpdateStatus} className="p-4 bg-orange-50/50 rounded-xl border border-orange-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F58220]">
                Record Reviewer Decision &amp; Update Status
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Set Case Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Confirmed Fraud">Confirmed Fraud</option>
                    <option value="False Positive">False Positive</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prevented Amount
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-xs font-mono font-bold text-slate-800">
                    {formatCurrency(selectedCase.amountInvolved)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Investigation Findings &amp; Justification *
                </label>
                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Document reason for decision, vendor communication, or resolution actions..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#F58220] hover:bg-[#DE6E10] text-white shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Save Decision &amp; Log Audit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
