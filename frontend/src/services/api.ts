import axios from 'axios';
import {
  Agent,
  Profile,
  Execution,
  Finding,
  ApprovalRequest,
  AuditLog,
  SystemAnalytics
} from '../types';

const API_BASE = '/api/v1';

export const api = {
  // Analytics
  getAnalytics: async (): Promise<SystemAnalytics> => {
    const res = await axios.get(`${API_BASE}/analytics/`);
    return res.data;
  },

  // Agents
  getAgents: async (): Promise<Agent[]> => {
    const res = await axios.get(`${API_BASE}/agents/`);
    return res.data;
  },
  getAgent: async (id: string): Promise<Agent> => {
    const res = await axios.get(`${API_BASE}/agents/${id}`);
    return res.data;
  },
  createAgent: async (data: Partial<Agent>): Promise<Agent> => {
    const res = await axios.post(`${API_BASE}/agents/`, data);
    return res.data;
  },
  updateAgent: async (id: string, data: Partial<Agent>): Promise<Agent> => {
    const res = await axios.put(`${API_BASE}/agents/${id}`, data);
    return res.data;
  },
  overrideAgentStatus: async (id: string, new_status: string, reason: string): Promise<Agent> => {
    const res = await axios.post(`${API_BASE}/agents/${id}/override-status`, { new_status, reason });
    return res.data;
  },

  // Profiles
  getProfiles: async (): Promise<Profile[]> => {
    const res = await axios.get(`${API_BASE}/profiles/`);
    return res.data;
  },
  createProfile: async (data: Partial<Profile>): Promise<Profile> => {
    const res = await axios.post(`${API_BASE}/profiles/`, data);
    return res.data;
  },
  updateProfile: async (id: string, data: Partial<Profile>): Promise<Profile> => {
    const res = await axios.put(`${API_BASE}/profiles/${id}`, data);
    return res.data;
  },
  deleteProfile: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/profiles/${id}`);
  },

  // Executions
  getExecutions: async (agentId?: string): Promise<Execution[]> => {
    const params = agentId ? { agent_id: agentId } : {};
    const res = await axios.get(`${API_BASE}/executions/`, { params });
    return res.data;
  },
  getExecution: async (id: string): Promise<Execution> => {
    const res = await axios.get(`${API_BASE}/executions/${id}`);
    return res.data;
  },

  // Findings
  getFindings: async (filters?: { agent_id?: string; severity?: string; status?: string }): Promise<Finding[]> => {
    const res = await axios.get(`${API_BASE}/findings/`, { params: filters });
    return res.data;
  },

  // Approvals
  getApprovals: async (status?: string): Promise<ApprovalRequest[]> => {
    const params = status ? { status } : {};
    const res = await axios.get(`${API_BASE}/approvals/`, { params });
    return res.data;
  },
  decideApproval: async (id: string, decision: 'APPROVED' | 'REJECTED', reason: string, decided_by = 'Governance Officer'): Promise<ApprovalRequest> => {
    const res = await axios.post(`${API_BASE}/approvals/${id}/decide`, {
      decision,
      reason,
      decided_by
    });
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async (agentId?: string): Promise<AuditLog[]> => {
    const params = agentId ? { agent_id: agentId } : {};
    const res = await axios.get(`${API_BASE}/audit/`, { params });
    return res.data;
  },

  // Simulator
  getScenarios: async (): Promise<Record<string, any>> => {
    const res = await axios.get(`${API_BASE}/simulator/scenarios`);
    return res.data;
  },
  runSimulator: async (agent_id: string, scenario: string, custom_prompt?: string): Promise<Execution> => {
    const res = await axios.post(`${API_BASE}/simulator/run`, {
      agent_id,
      scenario,
      custom_prompt
    });
    return res.data;
  },

  runRealAgent: async (payload: {
    agent_id: string;
    task: string;
    openai_api_key: string;
    file_content_b64?: string;
    file_name?: string;
  }): Promise<any> => {
    const res = await axios.post(`${API_BASE}/simulator/real-run`, payload, {
      // Real agent runs can take a while (multiple LLM turns)
      timeout: 120_000,
    });
    return res.data;
  }
};
