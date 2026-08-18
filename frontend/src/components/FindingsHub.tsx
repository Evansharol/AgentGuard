import React, { useState } from 'react';
import { AlertTriangle, Search, Filter, ShieldAlert, FileText, CornerDownRight } from 'lucide-react';
import { Finding } from '../types';

interface FindingsHubProps {
  findings: Finding[];
}

export const FindingsHub: React.FC<FindingsHubProps> = ({ findings }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredFindings = findings.filter((f) => {
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.deviation_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSev = selectedSeverity === 'ALL' || f.severity === selectedSeverity;
    const matchesStat = selectedStatus === 'ALL' || f.status === selectedStatus;
    return matchesSearch && matchesSev && matchesStat;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 mb-1">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-base font-extrabold text-white">Incidents & Policy Violations</h2>
          </div>
          <p className="text-xs text-slate-300">
            Every time an agent tried to do something outside its allowed policy, it gets logged here with full context.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search findings..."
              className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Severity Select */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical (Block)</option>
            <option value="HIGH">High (Approval)</option>
            <option value="MEDIUM">Medium (Warn)</option>
            <option value="LOW">Low (Notify)</option>
          </select>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="PENDING_HUMAN_REVIEW">Pending Review</option>
            <option value="RESOLVED_APPROVED">Resolved (Approved)</option>
            <option value="RESOLVED_BLOCKED">Resolved (Blocked)</option>
          </select>
        </div>
      </div>

      {/* Findings Cards List */}
      {filteredFindings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-16 text-center text-slate-500 text-xs">
          No incidents yet. Run something in the Test Lab and see what gets flagged.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFindings.map((f) => (
            <div
              key={f.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 rounded text-[11px] font-extrabold uppercase tracking-wider ${
                    f.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                    f.severity === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                    f.severity === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-blue-950 text-blue-400 border border-blue-800'
                  }`}>
                    {f.severity}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-slate-400">{f.id}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs font-mono text-blue-400">Agent: {f.agent_id}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 mt-0.5">{f.title}</h3>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-start sm:self-center">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">Response Action Triggered</span>
                    <span className="text-xs font-extrabold font-mono text-cyan-400">{f.response_action_triggered}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-sans">{f.description}</p>

              {/* Side-by-Side Scope Comparison Code View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                  <span className="text-emerald-400 font-semibold block mb-1">What was allowed:</span>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto">
                    {JSON.stringify(f.expected_scope, null, 2)}
                  </pre>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                  <span className="text-red-400 font-semibold block mb-1">What it actually tried:</span>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto">
                    {JSON.stringify(f.observed_activity, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 flex justify-between font-mono">
                <span>Deviation Type: <strong className="text-slate-300">{f.deviation_type}</strong></span>
                <span>Timestamp: {new Date(f.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
