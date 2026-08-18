import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, JSON, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, default=lambda: f"prof-{uuid.uuid4().hex[:8]}")
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    allowed_tools = Column(JSON, default=list)        # e.g. ["faq_search", "email_sender"]
    allowed_data_sources = Column(JSON, default=list) # e.g. ["faq_db", "kb_articles"]
    allowed_actions = Column(JSON, default=list)      # e.g. ["READ", "SEND_EMAIL"]
    max_calls_per_day = Column(Integer, default=100)
    max_tokens_per_run = Column(Integer, default=4000)
    max_financial_limit = Column(Float, default=100.0)
    warning_threshold_pct = Column(Float, default=80.0)   # Warning zone
    critical_threshold_pct = Column(Float, default=90.0)  # Critical warning
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    agents = relationship("Agent", back_populates="profile")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, default=lambda: f"agent-{uuid.uuid4().hex[:8]}")
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    status = Column(String, default="ACTIVE") # ACTIVE, WARNING, PENDING_APPROVAL, BLOCKED, PAUSED
    profile_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    owner_email = Column(String, default="governance-admin@flyyai.com")
    total_runs_count = Column(Integer, default=0)
    daily_calls_count = Column(Integer, default=0)
    last_active_at = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    profile = relationship("Profile", back_populates="agents")
    executions = relationship("Execution", back_populates="agent", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="agent", cascade="all, delete-orphan")
    approvals = relationship("ApprovalRequest", back_populates="agent", cascade="all, delete-orphan")


class Execution(Base):
    __tablename__ = "executions"

    id = Column(String, primary_key=True, default=lambda: f"exec-{uuid.uuid4().hex[:8]}")
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    status = Column(String, default="RUNNING") # RUNNING, COMPLETED, INTERCEPTED_BLOCKED, FAILED
    prompt = Column(Text, nullable=False)
    scenario_type = Column(String, default="CUSTOM") # NORMAL, UNAUTHORIZED_TOOL, UNAUTHORIZED_DB, GUARDRAIL_OVERRUN, CATASTROPHIC
    total_steps = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    agent = relationship("Agent", back_populates="executions")
    steps = relationship("ExecutionStep", back_populates="execution", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="execution", cascade="all, delete-orphan")


class ExecutionStep(Base):
    __tablename__ = "execution_steps"

    id = Column(String, primary_key=True, default=lambda: f"step-{uuid.uuid4().hex[:8]}")
    execution_id = Column(String, ForeignKey("executions.id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    tool_name = Column(String, nullable=False)
    data_source = Column(String, nullable=False)
    action_type = Column(String, nullable=False) # READ, WRITE, EXECUTE, DELETE, SEND_EMAIL, REFUND
    payload = Column(JSON, default=dict)
    result = Column(JSON, default=dict)
    status = Column(String, default="ALLOWED") # ALLOWED, WARNING, BLOCKED
    timestamp = Column(DateTime(timezone=True), default=utc_now)

    execution = relationship("Execution", back_populates="steps")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True, default=lambda: f"find-{uuid.uuid4().hex[:8]}")
    execution_id = Column(String, ForeignKey("executions.id"), nullable=True)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    severity = Column(String, nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    deviation_type = Column(String, nullable=False) # UNAUTHORIZED_TOOL, UNAUTHORIZED_DATA_SOURCE, UNAUTHORIZED_ACTION, GUARDRAIL_WARN_80, GUARDRAIL_WARN_90, GUARDRAIL_LIMIT_EXCEEDED, PARAMETER_VIOLATION
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    expected_scope = Column(JSON, default=dict)
    observed_activity = Column(JSON, default=dict)
    response_action_triggered = Column(String, nullable=False) # NOTIFY, REQUIRE_APPROVAL, AUTO_BLOCK
    status = Column(String, default="NEW") # NEW, PENDING_HUMAN_REVIEW, RESOLVED_APPROVED, RESOLVED_BLOCKED
    timestamp = Column(DateTime(timezone=True), default=utc_now)

    agent = relationship("Agent", back_populates="findings")
    execution = relationship("Execution", back_populates="findings")
    approval_requests = relationship("ApprovalRequest", back_populates="finding", cascade="all, delete-orphan")


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(String, primary_key=True, default=lambda: f"appr-{uuid.uuid4().hex[:8]}")
    finding_id = Column(String, ForeignKey("findings.id"), nullable=False)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    requested_action = Column(String, nullable=False) # BLOCK, RESUME, IGNORE
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    risk_assessment = Column(Text, nullable=True)
    requested_at = Column(DateTime(timezone=True), default=utc_now)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    decided_by = Column(String, nullable=True)
    decision_reason = Column(Text, nullable=True)

    agent = relationship("Agent", back_populates="approvals")
    finding = relationship("Finding", back_populates="approval_requests")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: f"audit-{uuid.uuid4().hex[:8]}")
    event_type = Column(String, nullable=False) # PROFILE_CREATED, PROFILE_UPDATED, AGENT_STATUS_CHANGED, DEVIATION_DETECTED, GUARDRAIL_WARNING, APPROVAL_REQUESTED, HUMAN_DECISION_EXECUTED, AGENT_BLOCKED, AGENT_RESUMED
    agent_id = Column(String, nullable=True)
    actor = Column(String, default="SYSTEM_GOVERNANCE_ENGINE")
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime(timezone=True), default=utc_now)
