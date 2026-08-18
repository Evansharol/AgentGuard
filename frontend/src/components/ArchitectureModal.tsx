import React from 'react';
import { Cpu, ShieldCheck, CheckSquare, Layers, AlertTriangle, Lock, FileCode } from 'lucide-react';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { BackendFlowVisualizer } from './BackendFlowVisualizer';

export const ArchitectureModal: React.FC = () => {
  return (
    <div className="space-y-6 text-xs text-slate-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-950/80 via-slate-900 to-purple-950/60 border border-violet-800/40 rounded-xl p-5 shadow-lg">
        <div className="flex items-center space-x-3 text-violet-400 mb-2">
          <Cpu className="h-6 w-6" />
          <h2 className="text-base font-extrabold text-white">AgentGuard — How It Works</h2>
        </div>
        <p className="text-xs text-slate-300">
          Technical overview of the interceptor engine, deviation detection, warning zones, escalation logic, and design decisions.
        </p>
      </div>

      {/* Native Interactive Workflow Visualizer */}
      <WorkflowVisualizer />

      {/* Native Interactive Backend Flow Visualizer */}
      <BackendFlowVisualizer />

      {/* Core Technical Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Design & Governance Model */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Behavior Profile Design</span>
          </h3>
          <p className="text-slate-300 text-xs">
            Every approved agent is linked to a structured baseline profile containing explicit whitelists for:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
            <li><strong className="text-slate-200">Allowed Tools:</strong> Hard whitelisted list of tool identifiers (e.g. <code className="text-blue-300">faq_search</code>).</li>
            <li><strong className="text-slate-200">Allowed Data Sources:</strong> Approved databases or APIs (e.g. <code className="text-emerald-300">faq_db</code>).</li>
            <li><strong className="text-slate-200">Allowed Action Verbs:</strong> Permitted action verbs (e.g. <code className="text-indigo-300">READ</code>, <code className="text-indigo-300">SEND_EMAIL</code>).</li>
            <li><strong className="text-slate-200">Guardrails & Budgets:</strong> Max daily call quota, token limit per run, and financial transaction boundaries.</li>
          </ul>
        </div>

        {/* Dynamic Warning Zone Thresholds */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>Warning Zones & Threshold Math</span>
          </h3>
          <p className="text-slate-300 text-xs">
            Rather than waiting for hard violations, the engine computes usage percentages dynamically:
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
            <div className="text-blue-400">&lt; 80%: Normal Operation (ALLOWED)</div>
            <div className="text-amber-400">80% - 89%: Warning Zone (NOTIFY & Emit Finding)</div>
            <div className="text-orange-400">90% - 99%: Critical Zone (REQUIRE HUMAN APPROVAL)</div>
            <div className="text-red-400 font-extrabold">&gt;= 100%: Limit Exceeded (AUTO-BLOCK AGENT)</div>
          </div>
        </div>

      </div>

      {/* Response Progression & Trade-offs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
          <CheckSquare className="h-4 w-4 text-cyan-400" />
          <span>Response Progression & Governance Trade-offs</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <h4 className="font-bold text-blue-400 mb-1">1. Notify</h4>
            <p className="text-[11px] text-slate-400">For low-risk anomalies (e.g. 80% quota zone). Execution continues while alert is logged in audit trail.</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <h4 className="font-bold text-amber-400 mb-1">2. Require Approval</h4>
            <p className="text-[11px] text-slate-400">For high-risk deviations (e.g. unauthorized tool invocation). Agent is frozen until human supervisor reviews evidence.</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <h4 className="font-bold text-red-400 mb-1">3. Auto-Block</h4>
            <p className="text-[11px] text-slate-400">For catastrophic actions (file deletion, DROP TABLE, 100% quota overrun). Agent execution is immediately revoked.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
