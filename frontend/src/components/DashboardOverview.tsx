import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Bot, 
  AlertTriangle, 
  Sliders, 
  CheckSquare, 
  Play, 
  ArrowRight,
  TrendingUp,
  Activity,
  UserCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SystemAnalytics, Finding, Agent } from '../types';

interface DashboardOverviewProps {
  analytics: SystemAnalytics | null;
  findings: Finding[];
  agents: Agent[];
  setActiveTab: (tab: string) => void;
  onRunScenario: (agentId: string, scenario: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  analytics,
  findings,
  agents,
  setActiveTab,
  onRunScenario
}) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const chartData = [
    { name: 'Low (Notify)', count: analytics.findings_by_severity.LOW || 0, color: '#3b82f6' },
    { name: 'Medium (Warn)', count: analytics.findings_by_severity.MEDIUM || 0, color: '#f59e0b' },
    { name: 'High (Approval)', count: analytics.findings_by_severity.HIGH || 0, color: '#f97316' },
    { name: 'Critical (Block)', count: analytics.findings_by_severity.CRITICAL || 0, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner Alert for Pending Approvals */}
      {analytics.pending_approvals_count > 0 && (
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/40 to-slate-900 border border-amber-500/40 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-amber-950/30 animate-pulse-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                {analytics.pending_approvals_count} Human Approval Request{analytics.pending_approvals_count > 1 ? 's' : ''} Pending Review
              </h4>
              <p className="text-xs text-amber-300/80">
                An agent execution has been frozen due to high-risk profile deviation. Human intervention required.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('approvals')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center space-x-2 shadow-md shadow-amber-500/20"
          >
            <span>Review Approvals Queue</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Analytics KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Compliance Score Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Safety Score</span>
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl font-extrabold tracking-tight ${
              analytics.overall_compliance_score_pct >= 80 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {analytics.overall_compliance_score_pct.toFixed(1)}%
            </span>
            <span className="text-xs text-emerald-400 font-medium flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5" /> Healthy
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Based on current agent status & how many have violated policies</p>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${analytics.overall_compliance_score_pct}%` }} 
            />
          </div>
        </div>

        {/* Total Agents Fleet Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Agents</span>
            <Bot className="h-5 w-5 text-violet-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-3">
            <span className="text-3xl font-extrabold text-white">{analytics.total_agents}</span>
            <div className="flex items-center space-x-1 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-semibold">
                {analytics.active_agents} Running
              </span>
              {analytics.blocked_agents > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-950 border border-red-800 text-red-400 font-semibold">
                  {analytics.blocked_agents} Blocked
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">All agents are monitored with runtime policy checks</p>
        </div>

        {/* Deviations & Findings Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Policy Violations</span>
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-400">{analytics.total_findings}</span>
            <span className="text-xs text-slate-400 font-medium">incidents caught</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {analytics.findings_by_severity.CRITICAL} Critical &nbsp;·&nbsp; {analytics.findings_by_severity.HIGH} High
          </p>
        </div>

        {/* Policy Profiles count */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Policies</span>
            <Sliders className="h-5 w-5 text-violet-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{analytics.total_profiles}</span>
            <span className="text-xs text-violet-400 font-medium">rule sets loaded</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Tools, data sources, action verbs, budget limits</p>
        </div>

      </div>

      {/* Main Charts & Quick Sandbox Launch Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Findings Severity Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Incidents by Severity</h3>
              <p className="text-xs text-slate-400">How many incidents hit each risk level</p>
            </div>
            <button 
              onClick={() => setActiveTab('findings')} 
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center space-x-1"
            >
              <span>See all incidents</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Agent Scenario Launcher */}        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-violet-400 mb-2">
              <Play className="h-5 w-5" />
              <h3 className="text-sm font-bold text-slate-100">Quick Test Scenarios</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Try these to see the interceptor in action — safe ones pass, dangerous ones get blocked or flagged.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveTab('simulator');
                  onRunScenario('agent-support-01', 'NORMAL_SUPPORT');
                }}
                className="w-full text-left p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
                    <span>✓ FAQ lookup + email — should pass</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Normal support run, no violations</div>
                </div>
                <Play className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('simulator');
                  onRunScenario('agent-support-01', 'UNAUTHORIZED_TOOL');
                }}
                className="w-full text-left p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-red-400 flex items-center space-x-1">
                    <span>✗ Tries to delete a file — gets blocked</span>
                  </div>
                  <div className="text-[11px] text-slate-400">file_delete is not in the approved toolset</div>
                </div>
                <Play className="h-4 w-4 text-slate-500 group-hover:text-red-400 transition-colors" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('simulator');
                  onRunScenario('agent-payment-01', 'PARAMETER_LIMIT_BREACH');
                }}
                className="w-full text-left p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-amber-400 flex items-center space-x-1">
                    <span>⚠ $15,000 refund — needs human approval</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Way over the $100 limit, goes to approval queue</div>
                </div>
                <Play className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('simulator')}
            className="w-full mt-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2 shadow-md shadow-violet-600/20"
          >
            <span>Open Test Lab</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div> 

      </div>

      {/* Recent Forensic Findings Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Recent Incidents</h3>
            <p className="text-xs text-slate-400">Latest catches from the interceptor engine</p>
          </div>
          <button
            onClick={() => setActiveTab('findings')}
            className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center space-x-1"
          >
            <span>View all ({findings.length})</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {findings.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Nothing caught yet. Run a test in the Test Lab to trigger some incidents.
          </div>
        ) : (
          <div className="space-y-3">
            {findings.slice(0, 4).map((f) => (
              <div
                key={f.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                    f.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                    f.severity === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                    f.severity === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-blue-950 text-blue-400 border border-blue-800'
                  }`}>
                    {f.severity}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{f.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{f.description}</p>
                    <div className="flex items-center space-x-3 mt-1 text-[10px] text-slate-500">
                      <span>Agent: <strong className="text-slate-300">{f.agent_id}</strong></span>
                      <span>Type: <strong className="text-slate-300">{f.deviation_type}</strong></span>
                      <span>Action Triggered: <strong className="text-cyan-400">{f.response_action_triggered}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    f.status === 'RESOLVED_APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    f.status === 'PENDING_HUMAN_REVIEW' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {f.status}
                  </span>
                  <button
                    onClick={() => setActiveTab('findings')}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Inspect Forensic Evidence"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
