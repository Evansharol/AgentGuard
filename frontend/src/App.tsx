import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { AgentSimulator } from './components/AgentSimulator';
import { ApprovalQueue } from './components/ApprovalQueue';
import { FindingsHub } from './components/FindingsHub';
import { ProfileManager } from './components/ProfileManager';
import { AgentFleet } from './components/AgentFleet';
import { AuditTrail } from './components/AuditTrail';
import { ArchitectureModal } from './components/ArchitectureModal';
import { api } from './services/api';
import {
  Agent,
  Profile,
  Finding,
  ApprovalRequest,
  AuditLog,
  SystemAnalytics
} from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Quick launch state for simulator
  const [simulatorAgentId, setSimulatorAgentId] = useState<string | undefined>();
  const [simulatorScenarioKey, setSimulatorScenarioKey] = useState<string | undefined>();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [anData, agData, prData, fnData, apData, auData] = await Promise.all([
        api.getAnalytics(),
        api.getAgents(),
        api.getProfiles(),
        api.getFindings(),
        api.getApprovals(),
        api.getAuditLogs()
      ]);

      setAnalytics(anData);
      setAgents(agData);
      setProfiles(prData);
      setFindings(fnData);
      setApprovals(apData);
      setAuditLogs(auData);
    } catch (err) {
      console.error('Error fetching governance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunQuickScenario = (agentId: string, scenarioKey: string) => {
    setSimulatorAgentId(agentId);
    setSimulatorScenarioKey(scenarioKey);
    setActiveTab('simulator');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalsCount={analytics?.pending_approvals_count || 0}
        complianceScore={analytics?.overall_compliance_score_pct || 100}
        onRefresh={loadData}
        isLoading={isLoading}
      />

      {/* Main App Workspace View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            analytics={analytics}
            findings={findings}
            agents={agents}
            setActiveTab={setActiveTab}
            onRunScenario={handleRunQuickScenario}
          />
        )}

        {activeTab === 'simulator' && (
          <AgentSimulator
            agents={agents}
            profiles={profiles}
            onSimulationComplete={loadData}
            selectedAgentId={simulatorAgentId}
            selectedScenarioKey={simulatorScenarioKey}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalQueue
            approvals={approvals}
            onDecisionMade={loadData}
          />
        )}

        {activeTab === 'findings' && (
          <FindingsHub
            findings={findings}
          />
        )}

        {activeTab === 'profiles' && (
          <ProfileManager
            profiles={profiles}
            onProfilesUpdated={loadData}
          />
        )}

        {activeTab === 'agents' && (
          <AgentFleet
            agents={agents}
            profiles={profiles}
            onAgentsUpdated={loadData}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTrail
            auditLogs={auditLogs}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureModal />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AgentGuard — built as part of an AI governance internship challenge</span>
          <span className="text-[11px] font-mono text-slate-500">interceptor engine · policy engine · audit trail</span>
        </div>
      </footer>

    </div>
  );
};

export default App;
