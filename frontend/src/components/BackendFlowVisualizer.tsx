import React, { useState } from 'react';
import {
  Globe,
  Server,
  Database,
  ShieldAlert,
  Cpu,
  ArrowDown,
  ArrowRight,
  FileCode,
  Lock,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileCheck2,
  FileSpreadsheet
} from 'lucide-react';

export const BackendFlowVisualizer: React.FC = () => {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  return (
    <div className="w-full bg-slate-950 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <Cpu className="h-5 w-5" />
            <h3 className="text-base font-extrabold text-white">System Architecture & Backend Pipeline</h3>
          </div>
          <p className="text-xs text-slate-400">
            Real-time in-line interception layer connecting agents, security policies, the response engine, and immutable audit persistence.
          </p>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 rounded-md">
          FastAPI + Async SQLAlchemy
        </span>
      </div>

      {/* Layer 1: Client & External Entrypoint */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Globe className="h-3.5 w-3.5 text-blue-400" />
          <span>Layer 1: Clients & Agent Entrypoints</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            onMouseEnter={() => setHoveredModule('react_dashboard')}
            onMouseLeave={() => setHoveredModule(null)}
            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
              hoveredModule === 'react_dashboard'
                ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.01]'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-blue-300">React Admin Dashboard</span>
              <span className="text-[9px] font-mono bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800">UI / SPA</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Overview KPIs, Test Lab sandbox, approval queue, and incident forensics.
            </p>
          </div>

          <div
            onMouseEnter={() => setHoveredModule('openai_gpt4o')}
            onMouseLeave={() => setHoveredModule(null)}
            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
              hoveredModule === 'openai_gpt4o'
                ? 'bg-violet-950/40 border-violet-500 shadow-lg shadow-violet-500/10 scale-[1.01]'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-violet-300">Autonomous LLM (GPT-4o)</span>
              <span className="text-[9px] font-mono bg-violet-950 text-violet-400 px-1.5 py-0.5 rounded border border-violet-800">Agent</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Generates autonomous tool call intents dynamically based on user prompt and uploaded data.
            </p>
          </div>

          <div
            onMouseEnter={() => setHoveredModule('api_clients')}
            onMouseLeave={() => setHoveredModule(null)}
            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
              hoveredModule === 'api_clients'
                ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/10 scale-[1.01]'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-cyan-300">REST API & SDK Clients</span>
              <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800">Endpoints</span>
            </div>
            <p className="text-[11px] text-slate-400">
              External services and microservices interacting via <code className="text-cyan-300">/api/v1/</code> endpoints.
            </p>
          </div>
        </div>
      </div>

      {/* Animated Flow Connector Arrow */}
      <div className="flex justify-center my-1">
        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800 text-[10px] font-mono text-slate-400">
          <span>HTTP POST / Payload Transmission</span>
          <ArrowDown className="h-3 w-3 text-cyan-400 animate-bounce" />
        </div>
      </div>

      {/* Layer 2: FastAPI Backend & Interception Core */}
      <div className="space-y-3 p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Server className="h-4 w-4 text-cyan-400" />
            <span>Layer 2: FastAPI Governance & Enforcement Core</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">In-Line Proxy Pipeline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Module 1: Execution Runner */}
          <div
            onMouseEnter={() => setHoveredModule('runner')}
            onMouseLeave={() => setHoveredModule(null)}
            className={`md:col-span-4 p-4 rounded-xl border transition-all ${
              hoveredModule === 'runner'
                ? 'bg-slate-950 border-cyan-400 shadow-md scale-[1.01]'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2 text-cyan-400 mb-1.5">
              <FileCode className="h-4 w-4" />
              <h4 className="text-xs font-extrabold text-white">1. Execution Orchestrator</h4>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Receives tasks, parses uploaded CSV/Excel files, and dispatches turns.
            </p>
            <div className="text-[10px] font-mono text-cyan-300 bg-slate-900 p-1.5 rounded border border-slate-800">
              real_agent.py · simulator.py
            </div>
          </div>

          {/* Module 2: The Security Interceptor (Highlighted) */}
          <div
            onMouseEnter={() => setHoveredModule('interceptor')}
            onMouseLeave={() => setHoveredModule(null)}
            className={`md:col-span-4 p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
              hoveredModule === 'interceptor'
                ? 'bg-violet-950/40 border-violet-400 shadow-lg shadow-violet-500/20 scale-[1.02]'
                : 'bg-violet-950/20 border-violet-600/60'
            }`}
          >
            <div className="absolute top-1.5 right-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            </div>
            <div className="flex items-center space-x-2 text-violet-300 mb-1.5">
              <ShieldAlert className="h-4 w-4" />
              <h4 className="text-xs font-extrabold text-white">2. Runtime Interceptor</h4>
            </div>
            <p className="text-[11px] text-slate-300 mb-2">
              <strong>The Security Gatekeeper:</strong> Halts every action before execution to compare against policy.
            </p>
            <div className="text-[10px] font-mono text-violet-300 bg-slate-950 p-1.5 rounded border border-violet-800/60">
              interceptor.py → evaluate_step()
            </div>
          </div>

          {/* Module 3: Deviation Detector */}
          <div
            onMouseEnter={() => setHoveredModule('detector')}
            onMouseLeave={() => setHoveredModule(null)}
            className={`md:col-span-4 p-4 rounded-xl border transition-all ${
              hoveredModule === 'detector'
                ? 'bg-slate-950 border-amber-400 shadow-md scale-[1.01]'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2 text-amber-400 mb-1.5">
              <AlertTriangle className="h-4 w-4" />
              <h4 className="text-xs font-extrabold text-white">3. Deviation Detector</h4>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Validates whitelist rules, database access rights, financial limits, and quota warning zones.
            </p>
            <div className="text-[10px] font-mono text-amber-300 bg-slate-900 p-1.5 rounded border border-slate-800">
              detector.py → 80% / 90% / 100%
            </div>
          </div>

        </div>

        {/* Sub-row: Response Engine & Real Tool Executor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div className="flex items-center space-x-2 text-pink-400 mb-1 font-bold">
              <Flame className="h-3.5 w-3.5" />
              <span>4. Response & Escalation Engine (response_engine.py)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-center">
              <div className="bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 p-1.5 rounded">
                <strong>ALLOWED</strong><br/>Execute Tool
              </div>
              <div className="bg-amber-950/50 border border-amber-800/60 text-amber-300 p-1.5 rounded">
                <strong>APPROVAL</strong><br/>Freeze Agent
              </div>
              <div className="bg-red-950/50 border border-red-800/60 text-red-300 p-1.5 rounded">
                <strong>AUTO-BLOCK</strong><br/>Revoke Execution
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div className="flex items-center space-x-2 text-emerald-400 mb-1 font-bold">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>5. Tool Execution Sandbox (tool_registry.py)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Executes approved tools: <code className="text-emerald-300">read_excel_column</code>, <code className="text-emerald-300">calculate_sum</code>, <code className="text-emerald-300">calculate_avg</code>, simulated emails/DB queries.
            </p>
          </div>

        </div>
      </div>

      {/* Animated Flow Connector Arrow */}
      <div className="flex justify-center my-1">
        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800 text-[10px] font-mono text-slate-400">
          <span>SQLAlchemy Async Transactions & Forensic Log</span>
          <ArrowDown className="h-3 w-3 text-purple-400 animate-bounce" />
        </div>
      </div>

      {/* Layer 3: Persistence & Database Layer */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Database className="h-3.5 w-3.5 text-purple-400" />
          <span>Layer 3: Relational Persistence & Immutable Audit Trail (SQLite / PostgreSQL)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-[10px]">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <strong className="text-slate-200 block">Agents</strong>
            <span className="text-slate-500">Fleet & Status</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <strong className="text-slate-200 block">Profiles</strong>
            <span className="text-slate-500">Policy Rules</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <strong className="text-slate-200 block">Executions</strong>
            <span className="text-slate-500">Run Sessions</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <strong className="text-slate-200 block">ExecutionSteps</strong>
            <span className="text-slate-500">Tool Payloads</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-red-900/60 bg-red-950/10">
            <strong className="text-red-300 block">Findings</strong>
            <span className="text-slate-500">Forensic Evidence</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-900/60 bg-amber-950/10">
            <strong className="text-amber-300 block">Approvals</strong>
            <span className="text-slate-500">HITL Decisions</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-purple-900/60 bg-purple-950/10">
            <strong className="text-purple-300 block">AuditLogs</strong>
            <span className="text-slate-500">Immutable Ledger</span>
          </div>
        </div>
      </div>

    </div>
  );
};
