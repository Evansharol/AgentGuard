from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field

# Profile Schemas
class ProfileBase(BaseModel):
    name: str
    description: Optional[str] = None
    allowed_tools: List[str] = []
    allowed_data_sources: List[str] = []
    allowed_actions: List[str] = []
    max_calls_per_day: int = 100
    max_tokens_per_run: int = 4000
    max_financial_limit: float = 100.0
    warning_threshold_pct: float = 80.0
    critical_threshold_pct: float = 90.0

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    allowed_tools: Optional[List[str]] = None
    allowed_data_sources: Optional[List[str]] = None
    allowed_actions: Optional[List[str]] = None
    max_calls_per_day: Optional[int] = None
    max_tokens_per_run: Optional[int] = None
    max_financial_limit: Optional[float] = None
    warning_threshold_pct: Optional[float] = None
    critical_threshold_pct: Optional[float] = None

class ProfileOut(ProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Agent Schemas
class AgentBase(BaseModel):
    name: str
    role: str
    profile_id: str
    owner_email: Optional[str] = "governance-admin@agentguard.dev"

class AgentCreate(AgentBase):
    pass

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    profile_id: Optional[str] = None
    status: Optional[str] = None
    owner_email: Optional[str] = None

class AgentOut(AgentBase):
    id: str
    status: str
    total_runs_count: int
    daily_calls_count: int
    last_active_at: datetime
    created_at: datetime
    profile: Optional[ProfileOut] = None

    model_config = ConfigDict(from_attributes=True)


# Step & Execution Schemas
class StepCreate(BaseModel):
    tool_name: str
    data_source: str
    action_type: str
    payload: Dict[str, Any] = {}

class ExecutionStepOut(BaseModel):
    id: str
    execution_id: str
    step_number: int
    tool_name: str
    data_source: str
    action_type: str
    payload: Dict[str, Any]
    result: Dict[str, Any]
    status: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class ExecutionOut(BaseModel):
    id: str
    agent_id: str
    status: str
    prompt: str
    scenario_type: str
    total_steps: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    steps: List[ExecutionStepOut] = []

    model_config = ConfigDict(from_attributes=True)


# Finding Schemas
class FindingOut(BaseModel):
    id: str
    execution_id: Optional[str] = None
    agent_id: str
    severity: str
    deviation_type: str
    title: str
    description: str
    expected_scope: Dict[str, Any]
    observed_activity: Dict[str, Any]
    response_action_triggered: str
    status: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# Approval Request Schemas
class ApprovalDecision(BaseModel):
    decision: str # APPROVED or REJECTED
    decided_by: str = "Admin Governance Officer"
    reason: str

class ApprovalRequestOut(BaseModel):
    id: str
    finding_id: str
    agent_id: str
    requested_action: str
    status: str
    risk_assessment: Optional[str] = None
    requested_at: datetime
    decided_at: Optional[datetime] = None
    decided_by: Optional[str] = None
    decision_reason: Optional[str] = None
    finding: Optional[FindingOut] = None

    model_config = ConfigDict(from_attributes=True)


# Audit Log Schemas
class AuditLogOut(BaseModel):
    id: str
    event_type: str
    agent_id: Optional[str] = None
    actor: str
    details: Dict[str, Any]
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# Simulator Execution Request
class SimulatorRunRequest(BaseModel):
    agent_id: str
    scenario: str # NORMAL, UNAUTHORIZED_TOOL, UNAUTHORIZED_DB, THRESHOLD_WARN, CATASTROPHIC
    custom_prompt: Optional[str] = None


# Analytics / Metrics Output
class SystemAnalyticsOut(BaseModel):
    total_agents: int
    active_agents: int
    blocked_agents: int
    warning_agents: int
    total_profiles: int
    total_executions: int
    total_findings: int
    findings_by_severity: Dict[str, int]
    pending_approvals_count: int
    overall_compliance_score_pct: float


# ── Real Agent Run Schemas ──────────────────────────────────────────────────

class RealAgentRunRequest(BaseModel):
    agent_id: str
    task: str
    openai_api_key: str
    file_content_b64: Optional[str] = None   # base64-encoded CSV or Excel
    file_name: Optional[str] = None           # original filename (used to detect xlsx vs csv)


class ToolCallTraceStep(BaseModel):
    step: int
    tool_name: str
    tool_args: Dict[str, Any]
    decision: str                             # "ALLOWED" or "BLOCKED"
    result: Optional[str] = None             # JSON string of tool output (if allowed)
    error: Optional[str] = None              # reason string (if blocked)
    finding_id: Optional[str] = None


class RealAgentRunResult(BaseModel):
    execution_id: str
    agent_id: str
    agent_name: str
    profile_name: str
    task: str
    file_name: Optional[str] = None
    final_response: Optional[str] = None
    tool_call_trace: List[ToolCallTraceStep] = []
    total_steps: int
    blocked_steps: int
    status: str                               # COMPLETED | INTERCEPTED | LIMIT_EXCEEDED | ERROR
