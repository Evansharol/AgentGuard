import React, { useState } from 'react';
import { Bot, Shield, PauseCircle, PlayCircle, Lock, Plus, UserCheck, X } from 'lucide-react';
import { Agent, Profile } from '../types';
import { api } from '../services/api';

interface AgentFleetProps {
  agents: Agent[];
  profiles: Profile[];
  onAgentsUpdated: () => void;
}

export const AgentFleet: React.FC<AgentFleetProps> = ({
  agents,
  profiles,
  onAgentsUpdated
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [profileId, setProfileId] = useState<string>(profiles[0]?.id || '');
  const [ownerEmail, setOwnerEmail] = useState<string>('governance-admin@flyyai.com');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.createAgent({
        name,
        role,
        profile_id: profileId,
        owner_email: ownerEmail
      });
      setIsCreateOpen(false);
      setName('');
      setRole('');
      onAgentsUpdated();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverrideStatus = async (agentId: string, status: string) => {
    const reason = prompt(`Enter governance reason for overriding status to ${status}:`, `Manual officer override`);
    if (!reason) return;

    try {
      await api.overrideAgentStatus(agentId, status, reason);
      onAgentsUpdated();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to override status');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 mb-1">
            <Bot className="h-5 w-5" />
            <h2 className="text-base font-extrabold text-white">Monitored Enterprise Agent Fleet</h2>
          </div>
          <p className="text-xs text-slate-300">
            Real-time status tracking and administrative control overrides for all registered AI agents.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-2 shadow-md shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Agent</span>
        </button>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((a) => {
          const profile = profiles.find((p) => p.id === a.profile_id);
          const maxCalls = profile?.max_calls_per_day || 100;
          const usagePct = Math.min(100, (a.daily_calls_count / maxCalls) * 100);

          return (
            <div
              key={a.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">{a.id}</span>
                    <h3 className="text-sm font-bold text-slate-100">{a.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{a.role}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase ${
                    a.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    a.status === 'BLOCKED' ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse' :
                    a.status === 'PENDING_APPROVAL' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {a.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>Assigned Profile:</span>
                      <strong className="text-cyan-400 font-mono">{profile?.name || a.profile_id}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>Owner Email:</span>
                      <span className="text-slate-300">{a.owner_email}</span>
                    </div>
                  </div>

                  {/* Quota Usage Bar */}
                  <div className="pt-1">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Daily Call Usage:</span>
                      <span className="font-mono text-slate-200">{a.daily_calls_count} / {maxCalls} ({usagePct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usagePct >= 100 ? 'bg-red-500' : usagePct >= 80 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Override Controls */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">Admin Override:</span>
                <div className="flex items-center space-x-1">
                  {a.status !== 'ACTIVE' && (
                    <button
                      onClick={() => handleOverrideStatus(a.id, 'ACTIVE')}
                      className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 rounded text-[10px] font-bold transition-colors"
                    >
                      Activate
                    </button>
                  )}
                  {a.status !== 'PAUSED' && (
                    <button
                      onClick={() => handleOverrideStatus(a.id, 'PAUSED')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-colors"
                    >
                      Pause
                    </button>
                  )}
                  {a.status !== 'BLOCKED' && (
                    <button
                      onClick={() => handleOverrideStatus(a.id, 'BLOCKED')}
                      className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 rounded text-[10px] font-bold transition-colors"
                    >
                      Block
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Create Agent Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Register New Agent</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Agent Name:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Order Status Bot"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Agent Role / Purpose:</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Customer Order Tracking Specialist"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assign Behavior Profile:</label>
                <select
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Owner Email:</label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  {isLoading ? 'Registering...' : 'Register Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
