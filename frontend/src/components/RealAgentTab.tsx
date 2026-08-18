import React, { useRef, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  XCircle,
  Loader2,
  Upload,
  FileSpreadsheet,
  Send,
  Key,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Agent, Profile } from '../types';
import { api } from '../services/api';

interface RealAgentTabProps {
  agents: Agent[];
  profiles: Profile[];
  onRunComplete: () => void;
}

interface TraceStep {
  step: number;
  tool_name: string;
  tool_args: Record<string, any>;
  decision: 'ALLOWED' | 'BLOCKED';
  result?: string | null;
  error?: string | null;
}

interface RunResult {
  execution_id: string;
  agent_id: string;
  agent_name: string;
  profile_name: string;
  task: string;
  file_name?: string;
  final_response?: string;
  tool_call_trace: TraceStep[];
  total_steps: number;
  blocked_steps: number;
  status: string;
}

const EXAMPLE_TASKS = [
  'Read the Revenue column and calculate the total.',
  'Read the Sales column, calculate the average, then send an email summary to manager@company.com.',
  'Read column B from the file, then delete the file after reading it.',
  'Read the entire file and export all data to a database query.',
];

export const RealAgentTab: React.FC<RealAgentTabProps> = ({ agents, profiles, onRunComplete }) => {
  const [agentId, setAgentId] = useState<string>('agent-file-analyst-01');
  const [task, setTask] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileB64, setFileB64] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedAgent = agents.find(a => a.id === agentId);
  const selectedProfile = profiles.find(p => p.id === selectedAgent?.profile_id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Strip the data URL prefix, keep only base64 content
      const b64 = (ev.target?.result as string).split(',')[1];
      setFileB64(b64);
    };
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = (ev.target?.result as string).split(',')[1];
      setFileB64(b64);
    };
    reader.readAsDataURL(f);
  };

  const toggleStep = (step: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      return next;
    });
  };

  const handleRun = async () => {
    if (!task.trim()) { setError('Please enter a task for the agent.'); return; }
    if (!apiKey.trim()) { setError('Please enter your OpenAI API key or click "Use Demo Mode" above.'); return; }

    setIsRunning(true);
    setError(null);
    setResult(null);
    setExpandedSteps(new Set());

    try {
      const res = await api.runRealAgent({
        agent_id: agentId,
        task: task.trim(),
        openai_api_key: apiKey.trim(),
        file_content_b64: fileB64 ?? undefined,
        file_name: file?.name ?? undefined,
      });
      setResult(res);
      onRunComplete();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Agent run failed. Check your API key and try again.'
      );
    } finally {
      setIsRunning(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'COMPLETED') return 'text-emerald-400 bg-emerald-950 border-emerald-800';
    if (status === 'INTERCEPTED') return 'text-red-400 bg-red-950 border-red-800';
    return 'text-amber-400 bg-amber-950 border-amber-800';
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-violet-950/60 via-slate-900 to-purple-950/40 border border-violet-800/40 rounded-xl p-5">
        <div className="flex items-center space-x-2 text-violet-400 mb-1">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-base font-extrabold text-white">Real Agent Mode — Live Interception</h2>
        </div>
        <p className="text-xs text-slate-300">
          Give a real task to GPT-4o. It will decide which tools to call on its own.
          Every tool call goes through the governance interceptor before executing.
          Watch what gets allowed vs. blocked in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left: Config panel ── */}
        <div className="space-y-4">

          {/* Agent selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Select Agent</label>
            <select
              value={agentId}
              onChange={e => setAgentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.name} — {a.role}</option>
              ))}
            </select>

            {selectedProfile && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] space-y-1">
                <p className="text-slate-400 font-semibold uppercase tracking-wider">Policy: {selectedProfile.name}</p>
                <p className="text-emerald-400">
                  ✓ Allowed: {selectedProfile.allowed_tools.join(', ')}
                </p>
                <p className="text-red-400">
                  ✗ Everything else gets blocked
                </p>
              </div>
            )}
          </div>

          {/* File upload */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Upload File (CSV or Excel) — optional
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                file
                  ? 'border-violet-600 bg-violet-950/20'
                  : 'border-slate-700 hover:border-violet-600 hover:bg-violet-950/10'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center space-x-2 text-violet-300">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="text-slate-500 text-sm">
                  <Upload className="h-6 w-6 mx-auto mb-1 opacity-50" />
                  Drop a CSV or Excel file here, or click to browse
                </div>
              )}
            </div>
          </div>

          {/* Task input */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Task for the Agent</label>
            <textarea
              value={task}
              onChange={e => setTask(e.target.value)}
              placeholder="e.g. Read the Revenue column and calculate the total."
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none"
            />
            {/* Example tasks */}
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Try these:</p>
              {EXAMPLE_TASKS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setTask(t)}
                  className="block w-full text-left text-[11px] text-slate-400 hover:text-violet-300 hover:bg-violet-950/20 rounded px-2 py-1 transition-colors"
                >
                  → {t}
                </button>
              ))}
            </div>
          </div>

          {/* API key */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                <Key className="h-3.5 w-3.5 text-violet-400" />
                <span>OpenAI API Key</span>
              </label>
              <button
                type="button"
                onClick={() => setApiKey('demo')}
                className="text-[10px] font-semibold text-violet-300 hover:text-violet-200 bg-violet-950/80 border border-violet-700/60 px-2 py-0.5 rounded transition-colors"
              >
                Use Demo Mode
              </button>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-... (or type 'demo' to test without an API key)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 pr-16 font-mono"
              />
              <button
                onClick={() => setShowKey(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300"
              >
                {showKey ? 'hide' : 'show'}
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Your key is only sent for this session and never saved.</span>
              {apiKey.toLowerCase().trim() === 'demo' && (
                <span className="text-emerald-400 font-bold">✓ Demo Mode active</span>
              )}
            </div>
          </div>

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/20"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Agent running... (this may take ~30s)</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Run Real Agent</span>
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-950/60 border border-red-800 rounded-lg p-3 text-xs text-red-300 flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ── Right: Results panel ── */}
        <div className="space-y-4">
          {!result && !isRunning && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-600 text-sm flex flex-col items-center space-y-3">
              <Bot className="h-10 w-10 opacity-30" />
              <p>Results will appear here after you run the agent.</p>
              <p className="text-xs text-slate-700">
                Each tool call the LLM makes will be shown with an ALLOWED or BLOCKED decision.
              </p>
            </div>
          )}

          {isRunning && (
            <div className="bg-slate-900 border border-violet-800/40 rounded-xl p-8 text-center flex flex-col items-center space-y-4">
              <div className="relative">
                <Bot className="h-10 w-10 text-violet-400" />
                <Loader2 className="h-5 w-5 text-violet-300 animate-spin absolute -bottom-1 -right-1" />
              </div>
              <p className="text-sm text-slate-300 font-medium">GPT-4o is working on the task...</p>
              <p className="text-xs text-slate-500">The governance interceptor is watching every tool call.</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-400">Agent: <strong className="text-slate-200">{result.agent_name}</strong></p>
                    <p className="text-xs text-slate-400">Policy: <strong className="text-slate-200">{result.profile_name}</strong></p>
                    {result.file_name && (
                      <p className="text-xs text-slate-400">File: <strong className="text-slate-200">{result.file_name}</strong></p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase border ${statusColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-slate-400">{result.total_steps} tool calls</span>
                  <span className="text-red-400 font-semibold">{result.blocked_steps} blocked</span>
                  <span className="text-emerald-400 font-semibold">{result.total_steps - result.blocked_steps} allowed</span>
                </div>
              </div>

              {/* Tool call trace */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tool Call Trace</p>
                {result.tool_call_trace.length === 0 && (
                  <p className="text-xs text-slate-600">The agent made no tool calls (completed with text only).</p>
                )}
                {result.tool_call_trace.map(step => (
                  <div
                    key={step.step}
                    className={`rounded-lg border text-xs overflow-hidden transition-all ${
                      step.decision === 'ALLOWED'
                        ? 'border-emerald-800/60 bg-emerald-950/20'
                        : 'border-red-800/60 bg-red-950/20'
                    }`}
                  >
                    <button
                      onClick={() => toggleStep(step.step)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                    >
                      <div className="flex items-center space-x-2">
                        {step.decision === 'ALLOWED' ? (
                          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
                        )}
                        <span className="font-mono font-semibold text-slate-200">{step.tool_name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          step.decision === 'ALLOWED'
                            ? 'text-emerald-400 bg-emerald-950 border-emerald-800'
                            : 'text-red-400 bg-red-950 border-red-800'
                        }`}>
                          {step.decision}
                        </span>
                      </div>
                      {expandedSteps.has(step.step)
                        ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                        : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                      }
                    </button>
                    {expandedSteps.has(step.step) && (
                      <div className="px-3 pb-3 space-y-2 border-t border-slate-800/60 pt-2">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase mb-1">Arguments</p>
                          <pre className="text-[11px] text-slate-300 bg-slate-950 rounded p-2 overflow-x-auto">
                            {JSON.stringify(step.tool_args, null, 2)}
                          </pre>
                        </div>
                        {step.decision === 'ALLOWED' && step.result && (
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase mb-1">Result</p>
                            <pre className="text-[11px] text-emerald-300 bg-slate-950 rounded p-2 overflow-x-auto max-h-32">
                              {(() => {
                                try { return JSON.stringify(JSON.parse(step.result!), null, 2); }
                                catch { return step.result; }
                              })()}
                            </pre>
                          </div>
                        )}
                        {step.decision === 'BLOCKED' && step.error && (
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase mb-1">Violation</p>
                            <p className="text-[11px] text-red-300 bg-slate-950 rounded p-2">{step.error}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Final response */}
              {result.final_response && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <Bot className="h-3.5 w-3.5" />
                    <span>Agent's Final Response</span>
                  </p>
                  <p className="text-sm text-slate-200 leading-relaxed">{result.final_response}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
