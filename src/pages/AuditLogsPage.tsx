import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime } from '../utils/formatter';
import { ScrollText, Search, Download } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs, downloadCsv } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F58220] flex items-center justify-center">
              <ScrollText className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Enterprise Security &amp; Decision Audit Trail
            </h2>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Immutable log of all rejected duplicate invoices, bank changes, payment holds, and auditor decisions.
          </p>
        </div>

        <button
          onClick={() => downloadCsv('audit')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Trail</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, user, entity, or details..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#F58220] bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Audit Logs Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            No audit records found matching search.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-50/70 transition flex items-start justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {log.action}
                  </span>
                  <span className="font-semibold text-slate-700">
                    User: <strong className="text-slate-900">{log.user}</strong>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {log.entityType} ({log.entityId})
                  </span>
                </div>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {log.details}
                </p>
              </div>

              <span className="text-slate-400 font-mono text-[11px] shrink-0 whitespace-nowrap">
                {formatDateTime(log.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
