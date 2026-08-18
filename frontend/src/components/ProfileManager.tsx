import React, { useState } from 'react';
import { Sliders, Plus, Edit, Trash2, Check, ShieldCheck, X } from 'lucide-react';
import { Profile } from '../types';
import { api } from '../services/api';

interface ProfileManagerProps {
  profiles: Profile[];
  onProfilesUpdated: () => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  profiles,
  onProfilesUpdated
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [allowedToolsStr, setAllowedToolsStr] = useState<string>('');
  const [allowedDataSourcesStr, setAllowedDataSourcesStr] = useState<string>('');
  const [allowedActions, setAllowedActions] = useState<string[]>(['READ', 'SEND_EMAIL']);
  const [maxCallsPerDay, setMaxCallsPerDay] = useState<number>(100);
  const [maxTokensPerRun, setMaxTokensPerRun] = useState<number>(4000);
  const [maxFinancialLimit, setMaxFinancialLimit] = useState<number>(100.0);
  const [warningThresholdPct, setWarningThresholdPct] = useState<number>(80.0);
  const [criticalThresholdPct, setCriticalThresholdPct] = useState<number>(90.0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availableActionVerbs = ['READ', 'WRITE', 'EXECUTE', 'DELETE', 'SEND_EMAIL', 'REFUND', 'EXPORT'];

  const openCreateModal = () => {
    setEditingProfile(null);
    setName('');
    setDescription('');
    setAllowedToolsStr('faq_search, email_sender, order_status_check');
    setAllowedDataSourcesStr('faq_db, kb_articles');
    setAllowedActions(['READ', 'SEND_EMAIL']);
    setMaxCallsPerDay(100);
    setMaxTokensPerRun(4000);
    setMaxFinancialLimit(100.0);
    setWarningThresholdPct(80.0);
    setCriticalThresholdPct(90.0);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Profile) => {
    setEditingProfile(p);
    setName(p.name);
    setDescription(p.description || '');
    setAllowedToolsStr(p.allowed_tools.join(', '));
    setAllowedDataSourcesStr(p.allowed_data_sources.join(', '));
    setAllowedActions(p.allowed_actions);
    setMaxCallsPerDay(p.max_calls_per_day);
    setMaxTokensPerRun(p.max_tokens_per_run);
    setMaxFinancialLimit(p.max_financial_limit);
    setWarningThresholdPct(p.warning_threshold_pct);
    setCriticalThresholdPct(p.critical_threshold_pct);
    setIsModalOpen(true);
  };

  const toggleAction = (act: string) => {
    if (allowedActions.includes(act)) {
      setAllowedActions(allowedActions.filter((a) => a !== act));
    } else {
      setAllowedActions([...allowedActions, act]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const toolsList = allowedToolsStr.split(',').map((s) => s.trim()).filter(Boolean);
    const dataSourcesList = allowedDataSourcesStr.split(',').map((s) => s.trim()).filter(Boolean);

    const payload = {
      name,
      description,
      allowed_tools: toolsList,
      allowed_data_sources: dataSourcesList,
      allowed_actions: allowedActions,
      max_calls_per_day: Number(maxCallsPerDay),
      max_tokens_per_run: Number(maxTokensPerRun),
      max_financial_limit: Number(maxFinancialLimit),
      warning_threshold_pct: Number(warningThresholdPct),
      critical_threshold_pct: Number(criticalThresholdPct),
    };

    try {
      if (editingProfile) {
        await api.updateProfile(editingProfile.id, payload);
      } else {
        await api.createProfile(payload);
      }
      setIsModalOpen(false);
      onProfilesUpdated();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this behavior profile?')) return;
    try {
      await api.deleteProfile(id);
      onProfilesUpdated();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete profile');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 mb-1">
            <Sliders className="h-5 w-5" />
            <h2 className="text-base font-extrabold text-white">Sanctioned Agent Behavior Profiles</h2>
          </div>
          <p className="text-xs text-slate-300">
            Define baseline allowed tools, data sources, action verbs, and threshold guardrails for runtime enforcement.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-2 shadow-md shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Profile</span>
        </button>
      </div>

      {/* Profiles Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">{p.id}</span>
                  <h3 className="text-sm font-bold text-slate-100">{p.name}</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Edit Profile"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 transition-colors"
                    title="Delete Profile"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-2 line-clamp-2">{p.description}</p>

              {/* Scope Tags */}
              <div className="mt-4 space-y-2 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Allowed Tools:</span>
                  <div className="flex flex-wrap gap-1">
                    {p.allowed_tools.map((t) => (
                      <span key={t} className="bg-slate-950 text-blue-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-800">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Allowed Data Sources:</span>
                  <div className="flex flex-wrap gap-1">
                    {p.allowed_data_sources.map((d) => (
                      <span key={d} className="bg-slate-950 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-800">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Allowed Action Verbs:</span>
                  <div className="flex flex-wrap gap-1">
                    {p.allowed_actions.map((act) => (
                      <span key={act} className="bg-slate-950 text-indigo-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-800">
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Threshold & Limit Badges */}
            <div className="pt-3 border-t border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Daily Call Budget:</span>
                <strong className="text-slate-200 font-mono">{p.max_calls_per_day} calls/day</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Max Financial Threshold:</span>
                <strong className="text-emerald-400 font-mono">${p.max_financial_limit}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Warning Zones:</span>
                <span className="text-amber-400 font-mono">{p.warning_threshold_pct}% Warn | {p.critical_threshold_pct}% Crit</span>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Profile Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                {editingProfile ? 'Edit Behavior Profile' : 'Create Sanctioned Behavior Profile'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded bg-red-950/60 border border-red-800 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Profile Name:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Customer Support Profile"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe governance intent and scope..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Allowed Tools (Comma Separated):</label>
                <input
                  type="text"
                  value={allowedToolsStr}
                  onChange={(e) => setAllowedToolsStr(e.target.value)}
                  placeholder="faq_search, email_sender, order_status_check"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Allowed Data Sources (Comma Separated):</label>
                <input
                  type="text"
                  value={allowedDataSourcesStr}
                  onChange={(e) => setAllowedDataSourcesStr(e.target.value)}
                  placeholder="faq_db, kb_articles, order_catalog"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Allowed Action Verbs:</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableActionVerbs.map((act) => {
                    const isChecked = allowedActions.includes(act);
                    return (
                      <button
                        type="button"
                        key={act}
                        onClick={() => toggleAction(act)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center space-x-1 ${
                          isChecked
                            ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 font-bold'
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                        <span>{act}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Daily Call Quota:</label>
                  <input
                    type="number"
                    value={maxCallsPerDay}
                    onChange={(e) => setMaxCallsPerDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Financial Action Limit ($):</label>
                  <input
                    type="number"
                    value={maxFinancialLimit}
                    onChange={(e) => setMaxFinancialLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Warning Threshold (%):</label>
                  <input
                    type="number"
                    value={warningThresholdPct}
                    onChange={(e) => setWarningThresholdPct(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Critical Threshold (%):</label>
                  <input
                    type="number"
                    value={criticalThresholdPct}
                    onChange={(e) => setCriticalThresholdPct(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
