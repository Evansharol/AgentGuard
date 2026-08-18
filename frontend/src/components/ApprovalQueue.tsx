import React, { useState } from 'react';
import { 
  CheckSquare, 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Send,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ApprovalRequest } from '../types';
import { api } from '../services/api';

interface ApprovalQueueProps {
  approvals: ApprovalRequest[];
  onDecisionMade: () => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  approvals,
  onDecisionMade
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [reasonsMap, setReasonsMap] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredApprovals = approvals.filter((a) => {
    if (filterStatus === 'ALL') return true;
    return a.status === filterStatus;
  });

  const handleDecide = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    const reason = reasonsMap[id] || (decision === 'APPROVED' ? 'Approved after safety evaluation.' : 'Blocked due to unacceptable policy risk.');
    setDecidingId(id);
    setErrorMsg(null);

    try {
      await api.decideApproval(id, decision, reason, 'Governance Officer');
      
      if (decision === 'APPROVED') {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      onDecisionMade();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to submit decision');
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/30 border border-amber-800/40 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 mb-1">
              <CheckSquare className="h-5 w-5" />
              <h2 className="text-base font-extrabold text-white">Human-in-the-Loop (HITL) Governance Gate</h2>
            </div>
            <p className="text-xs text-slate-300">
              When high-risk deviations or threshold overruns occur, agent actions are frozen. Review forensic evidence and grant approval to resume execution or reject to block permanently.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 p-1 rounded-lg">
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  filterStatus === st
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Approvals List */}
      {filteredApprovals.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-16 text-center text-slate-500 text-xs space-y-2">
          <UserCheck className="h-10 w-10 mx-auto text-slate-700" />
          <p>No approval requests found matching status "{filterStatus}".</p>
          <p className="text-slate-600 text-[11px]">When rogue behavior occurs during simulation, approval cards will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((req) => {
            const isPending = req.status === 'PENDING';
            const finding = req.finding;

            return (
              <div
                key={req.id}
                className={`bg-slate-900 border rounded-xl p-5 shadow-lg transition-all ${
                  isPending
                    ? 'border-amber-500/40 shadow-amber-950/20'
                    : req.status === 'APPROVED'
                    ? 'border-emerald-500/30'
                    : 'border-red-500/30'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${
                      isPending ? 'bg-amber-500/20 text-amber-400' :
                      req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {isPending ? <Clock className="h-6 w-6 animate-spin" /> :
                       req.status === 'APPROVED' ? <ShieldCheck className="h-6 w-6" /> :
                       <ShieldAlert className="h-6 w-6" />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-slate-400">{req.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          isPending ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse' :
                          req.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          'bg-red-950 text-red-400 border border-red-800'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100 mt-0.5">
                        Target Agent: <strong className="text-blue-400">{req.agent_id}</strong>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{req.risk_assessment}</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 font-mono self-start md:self-center">
                    Requested: {new Date(req.requested_at).toLocaleString()}
                  </div>
                </div>

                {/* Evidence Section */}
                {finding && (
                  <div className="mt-4 bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 flex items-center space-x-1">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span>Forensic Evidence: {finding.title}</span>
                      </span>
                      <span className="text-red-400 font-extrabold text-[10px] uppercase">
                        Severity: {finding.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-sans">{finding.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-1">
                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                        <span className="text-emerald-400 font-semibold block mb-1">Expected Sanctioned Scope:</span>
                        <pre className="text-[11px] text-slate-300 overflow-x-auto">
                          {JSON.stringify(finding.expected_scope, null, 2)}
                        </pre>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                        <span className="text-red-400 font-semibold block mb-1">Observed Deviating Activity:</span>
                        <pre className="text-[11px] text-slate-300 overflow-x-auto">
                          {JSON.stringify(finding.observed_activity, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Decision Actions for Pending Requests */}
                {isPending ? (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">Governance Decision Rationale & Comments:</label>
                      <input
                        type="text"
                        value={reasonsMap[req.id] || ''}
                        onChange={(e) => setReasonsMap({ ...reasonsMap, [req.id]: e.target.value })}
                        placeholder="e.g. Risk assessed as acceptable under supervisor override..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => handleDecide(req.id, 'REJECTED')}
                        disabled={decidingId === req.id}
                        className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-bold transition-all flex items-center space-x-2"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject & Permanently Block Agent</span>
                      </button>

                      <button
                        onClick={() => handleDecide(req.id, 'APPROVED')}
                        disabled={decidingId === req.id}
                        className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center space-x-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Approve & Resume Agent Execution</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row justify-between gap-1">
                    <div>Decided by: <strong className="text-slate-200">{req.decided_by}</strong> on {new Date(req.decided_at!).toLocaleString()}</div>
                    <div>Reason: <span className="italic text-slate-300 font-sans">"{req.decision_reason}"</span></div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
