import React, { useState } from 'react';
import { History, Search, Filter, ShieldCheck, Lock, CheckCircle, UserCheck } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditTrailProps {
  auditLogs: AuditLog[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.agent_id && log.agent_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = eventTypeFilter === 'ALL' || log.event_type === eventTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <History className="h-5 w-5" />
            <h2 className="text-base font-extrabold text-white">Immutable Governance Audit Trail</h2>
          </div>
          <p className="text-xs text-slate-300">
            Chronological, verifiable record of all profile changes, runtime evaluations, human decisions, and automated agent blocks.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit trail..."
              className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Audit Timeline */}
      {filteredLogs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-16 text-center text-slate-500 text-xs">
          No audit logs match current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg mt-0.5 ${
                  log.event_type.includes('BLOCK') ? 'bg-red-950 text-red-400 border border-red-800' :
                  log.event_type.includes('APPROVAL') ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                  log.event_type.includes('DEVIATION') ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                  'bg-blue-950 text-blue-400 border border-blue-800'
                }`}>
                  <History className="h-4 w-4" />
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-slate-500">{log.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      log.event_type.includes('BLOCK') ? 'bg-red-950 text-red-300' :
                      log.event_type.includes('GRANTED') ? 'bg-emerald-950 text-emerald-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {log.event_type}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-200 mt-1">
                    Actor: <strong className="text-cyan-400 font-mono">{log.actor}</strong>
                    {log.agent_id && (
                      <span className="ml-2 text-slate-400">Target Agent: <strong className="text-blue-400 font-mono">{log.agent_id}</strong></span>
                    )}
                  </div>

                  <div className="mt-2 bg-slate-950 p-2 rounded border border-slate-800 text-[11px] font-mono text-slate-300 max-w-2xl overflow-x-auto">
                    {JSON.stringify(log.details)}
                  </div>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-500 font-mono whitespace-nowrap self-end sm:self-center">
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
