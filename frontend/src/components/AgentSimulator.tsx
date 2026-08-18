import React, { useState } from 'react';
import { 
  Play, 
  Bot, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Terminal, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Info,
  CornerDownRight
} from 'lucide-react';
import { Agent, Execution, Profile } from '../types';
import { api } from '../services/api';
import { RealAgentTab } from './RealAgentTab';
import { Sparkles, Layers } from 'lucide-react';

interface AgentSimulatorProps {
  agents: Agent[];
  profiles: Profile[];
  onSimulationComplete: () => void;
  selectedAgentId?: string;
  selectedScenarioKey?: string;
}

export const AgentSimulator: React.FC<AgentSimulatorProps> = ({
  agents,
  profiles,
  onSimulationComplete,
  selectedAgentId,
  selectedScenarioKey
}) => {
  const [mode, setMode] = useState<'scenarios' | 'real'>('scenarios');
  const [agentId, setAgentId] = useState<string>(selectedAgentId || (agents[0]?.id || 'agent-support-01'));
  const [scenarioKey, setScenarioKey] = useState<string>(selectedScenarioKey || 'UNAUTHORIZED_TOOL');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<Execution | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedAgent = agents.find((a) => a.id === agentId) || agents[0];
  const selectedProfile = profiles.find((p) => p.id === selectedAgent?.profile_id);

  const scenariosList = [
    {
      key: 'NORMAL_SUPPORT',
      name: '1. Normal Customer Support Workflow',
      desc: 'Invokes faq_search & email_sender (Approved Scope)',
      risk: 'SAFE',
      agentRole: 'Customer Support Bot'
    },
    {
      key: 'UNAUTHORIZED_TOOL',
      name: '2. Unauthorized Rogue Tool (file_delete)',
      desc: 'Invokes unapproved tool file_delete -> Interceptor halt',
      risk: 'HIGH_RISK',
      agentRole: 'Customer Support Bot'
    },
    {
      key: 'UNAUTHORIZED_DB',
      name: '3. Restricted Database Access (customer_financial_db)',
      desc: 'Attempts querying unauthorized customer_financial_db',
      risk: 'HIGH_RISK',
      agentRole: 'Customer Support Bot'
    },
    {
      key: 'PARAMETER_LIMIT_BREACH',
      name: '4. Financial Boundary Violation ($15,000 Refund)',
      desc: 'Attempts refunding $15,000 (Approved Limit: $100)',
      risk: 'MEDIUM_RISK',
      agentRole: 'Payment Support Specialist'
    },
    {
      key: 'GUARDRAIL_OVERRUN',
      name: '5. Daily Call Budget Overrun (100% Exceeded)',
      desc: 'High-frequency automated loop exceeding daily quota',
      risk: 'HIGH_RISK',
      agentRole: 'Executive KPI Analyst'
    },
    {
      key: 'CATASTROPHIC_SQL_DROP',
      name: '6. Catastrophic Database Destruction (DROP TABLE)',
      desc: 'Rogue agent executing DROP TABLE on production DB',
      risk: 'CRITICAL_RISK',
      agentRole: 'Payment Support Specialist'
    }
  ];

  const handleRun = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    setExecutionResult(null);

    try {
      const result = await api.runSimulator(agentId, scenarioKey, customPrompt || undefined);
      setExecutionResult(result);
      onSimulationComplete();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Simulation execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/40 border border-blue-800/40 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-violet-400 mb-1">
              <Terminal className="h-5 w-5" />
              <h2 className="text-base font-extrabold text-white">Test Lab — Agent Policy Sandbox</h2>
            </div>
            <p className="text-xs text-slate-300">
              Pick an agent and a scenario below, then hit run. The interceptor will check every tool call against the policy before it executes.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-slate-300 font-semibold">Interceptor Engine Active</span>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setMode('scenarios')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            mode === 'scenarios'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Pre-configured Test Scenarios</span>
        </button>

        <button
          onClick={() => setMode('real')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            mode === 'real'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Sparkles className="h-4 w-4 text-violet-300" />
          <span>Real LLM Agent (Live OpenAI & File Upload)</span>
          <span className="text-[9px] bg-violet-950 border border-violet-700 text-violet-300 px-1.5 py-0.5 rounded uppercase font-bold">
            Live
          </span>
        </button>
      </div>

      {mode === 'real' ? (
        <RealAgentTab
          agents={agents}
          profiles={profiles}
          onRunComplete={onSimulationComplete}
        />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Sandbox Controls */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Agent Selection Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Bot className="h-4 w-4 text-blue-400" />
              <span>Step 1: Select AI Agent Fleet Target</span>
            </h3>

            <div className="space-y-2">
              {agents.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setAgentId(a.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    agentId === a.id
                      ? 'bg-blue-600/15 border-blue-500/50 shadow-md shadow-blue-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">{a.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      a.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      a.status === 'BLOCKED' ? 'bg-red-950 text-red-400 border border-red-800' :
                      'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{a.role}</div>
                </div>
              ))}
            </div>

            {/* Active Profile Scope Preview */}
            {selectedProfile && (
              <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-[11px] space-y-1.5">
                <div className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Assigned Profile: {selectedProfile.name}</span>
                  <span className="text-cyan-400 font-mono">Quota: {selectedAgent?.daily_calls_count}/{selectedProfile.max_calls_per_day}</span>
                </div>
                <div className="text-slate-400 flex flex-wrap gap-1 mt-1">
                  <span className="text-slate-500">Allowed Tools:</span>
                  {selectedProfile.allowed_tools.map((t) => (
                    <span key={t} className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scenario Selector Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Step 2: Select Test Scenario</span>
            </h3>

            <div className="space-y-2">
              {scenariosList.map((sc) => (
                <div
                  key={sc.key}
                  onClick={() => setScenarioKey(sc.key)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    scenarioKey === sc.key
                      ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{sc.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      sc.risk === 'SAFE' ? 'bg-emerald-950 text-emerald-400' :
                      sc.risk === 'CRITICAL_RISK' ? 'bg-red-950 text-red-400' :
                      'bg-amber-950 text-amber-400'
                    }`}>
                      {sc.risk}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{sc.desc}</div>
                </div>
              ))}
            </div>

            {/* Custom Prompt Override */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Optional Custom Prompt Override:</label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Execute system log file purge..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Execute Simulation Button */}
            <button
              onClick={handleRun}
              disabled={isRunning || selectedAgent?.status === 'BLOCKED'}
              className={`w-full py-3 rounded-lg font-extrabold text-xs transition-all flex items-center justify-center space-x-2 shadow-lg ${
                selectedAgent?.status === 'BLOCKED'
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-600/25'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Evaluating Runtime Interception...</span>
                </>
              ) : selectedAgent?.status === 'BLOCKED' ? (
                <>
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span>Agent is BLOCKED — Resume via Approvals Queue</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Execute Agent Run in Sandbox</span>
                </>
              )}
            </button>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300">
                {errorMsg}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Real-Time Execution & Interceptor Terminal Output */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-green-400" />
                <span className="font-mono text-xs font-bold text-slate-200">Execution Trace & Interceptor Console</span>
              </div>
              {executionResult && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono ${
                  executionResult.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                  'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                }`}>
                  Status: {executionResult.status}
                </span>
              )}
            </div>

            {!executionResult && !isRunning && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600 text-xs space-y-2">
                <Bot className="h-10 w-10 text-slate-700" />
                <p>Select an agent and scenario on the left, then click "Execute Agent Run".</p>
                <p className="text-[11px] text-slate-500">The console will stream step-by-step tool calls and interceptor evaluation results.</p>
              </div>
            )}

            {isRunning && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs space-y-3">
                <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
                <p className="font-mono text-cyan-400 animate-pulse">Running Interceptor Verification Engine...</p>
              </div>
            )}

            {executionResult && (
              <div className="space-y-4">
                
                {/* Execution Metadata Banner */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Execution ID: <strong className="text-slate-200">{executionResult.id}</strong></span>
                    <span>Started: <strong className="text-slate-200">{new Date(executionResult.started_at).toLocaleTimeString()}</strong></span>
                  </div>
                  <div className="text-slate-300 text-xs pt-1">
                    <span className="text-slate-500">Prompt: </span>"{executionResult.prompt}"
                  </div>
                </div>

                {/* Steps Trace Timeline */}
                <div className="space-y-3">
                  {executionResult.steps.map((step) => {
                    const isAllowed = step.status === 'ALLOWED';
                    return (
                      <div
                        key={step.id}
                        className={`rounded-lg border p-4 font-mono transition-all ${
                          isAllowed
                            ? 'bg-slate-900/60 border-slate-800'
                            : 'bg-red-950/40 border-red-500/50 shadow-lg shadow-red-950/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 text-xs font-bold">
                            <span className="text-slate-500">Step #{step.step_number}:</span>
                            <span className="text-cyan-300">{step.tool_name}</span>
                            <span className="text-slate-600">on</span>
                            <span className="text-amber-300">{step.data_source}</span>
                            <span className="px-1.5 py-0.2 bg-slate-800 text-indigo-300 text-[10px] rounded">
                              {step.action_type}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            {isAllowed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>VERIFIED ALLOWED</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-950 text-red-400 border border-red-800 flex items-center space-x-1 animate-pulse">
                                <ShieldAlert className="h-3 w-3" />
                                <span>GOVERNANCE INTERCEPTED</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Payload Preview */}
                        <div className="bg-slate-950 p-2.5 rounded text-[11px] text-slate-300 mb-2 border border-slate-800/80 overflow-x-auto">
                          <span className="text-slate-500 font-sans">Payload: </span>
                          <code className="text-indigo-300">{JSON.stringify(step.payload)}</code>
                        </div>

                        {/* Result / Violation Details */}
                        <div className={`p-2.5 rounded text-[11px] ${
                          isAllowed ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-900/40' : 'bg-red-900/20 text-red-300 border border-red-900/60'
                        }`}>
                          <div className="font-semibold flex items-center space-x-1 mb-0.5">
                            <CornerDownRight className="h-3.5 w-3.5" />
                            <span>{step.result.message || step.result.decision}</span>
                          </div>
                          {step.result.reasons && (
                            <ul className="list-disc list-inside mt-1 space-y-0.5 pl-2 text-red-200">
                              {step.result.reasons.map((r: string, idx: number) => (
                                <li key={idx}>{r}</li>
                              ))}
                            </ul>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>AgentGuard Interceptor Engine</span>
            <span>Real-time Action Boundary Enforcer</span>
          </div>

        </div>

      </div>
      )}

    </div>
  );
};

