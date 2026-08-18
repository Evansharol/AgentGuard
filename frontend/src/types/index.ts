export interface Profile {
  id: string;
  name: string;
  description?: string;
  allowed_tools: string[];
  allowed_data_sources: string[];
  allowed_actions: string[];
  max_calls_per_day: number;
  max_tokens_per_run: number;
  max_financial_limit: number;
  warning_threshold_pct: number;
  critical_threshold_pct: number;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'ACTIVE' | 'WARNING' | 'PENDING_APPROVAL' | 'BLOCKED' | 'PAUSED';
  profile_id: string;
  owner_email: string;
  total_runs_count: number;
  daily_calls_count: number;
  last_active_at: string;
  created_at: string;
  profile?: Profile;
}

export interface ExecutionStep {
  id: string;
  execution_id: string;
  step_number: number;
  tool_name: string;
  data_source: string;
  action_type: string;
  payload: Record<string, any>;
  result: Record<string, any>;
  status: 'ALLOWED' | 'WARNING' | 'BLOCKED';
  timestamp: string;
}

export interface Execution {
  id: string;
  agent_id: string;
  status: 'RUNNING' | 'COMPLETED' | 'INTERCEPTED_BLOCKED' | 'FAILED';
  prompt: string;
  scenario_type: string;
  total_steps: number;
  started_at: string;
  completed_at?: string;
  steps: ExecutionStep[];
}

export interface Finding {
  id: string;
  execution_id?: string;
  agent_id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  deviation_type: string;
  title: string;
  description: string;
  expected_scope: Record<string, any>;
  observed_activity: Record<string, any>;
  response_action_triggered: 'NOTIFY' | 'REQUIRE_APPROVAL' | 'AUTO_BLOCK';
  status: 'NEW' | 'PENDING_HUMAN_REVIEW' | 'RESOLVED_APPROVED' | 'RESOLVED_BLOCKED';
  timestamp: string;
}

export interface ApprovalRequest {
  id: string;
  finding_id: string;
  agent_id: string;
  requested_action: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  risk_assessment?: string;
  requested_at: string;
  decided_at?: string;
  decided_by?: string;
  decision_reason?: string;
  finding?: Finding;
}

export interface AuditLog {
  id: string;
  event_type: string;
  agent_id?: string;
  actor: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface SystemAnalytics {
  total_agents: number;
  active_agents: number;
  blocked_agents: number;
  warning_agents: number;
  total_profiles: number;
  total_executions: number;
  total_findings: number;
  findings_by_severity: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  pending_approvals_count: number;
  overall_compliance_score_pct: number;
}
