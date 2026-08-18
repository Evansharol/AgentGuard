from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Agent, Finding, ApprovalRequest, AuditLog

def utc_now():
    return datetime.now(timezone.utc)

class ResponseEngine:
    """
    Executes response actions based on deviation findings:
    Notify -> Require Approval -> Block Agent
    Records all actions into findings, approval requests, and the immutable audit trail.
    """

    @staticmethod
    async def process_deviations(
        session: AsyncSession,
        agent: Agent,
        execution_id: str,
        deviations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        if not deviations:
            return {"status": "ALLOWED", "findings": []}

        highest_action = "NOTIFY"
        action_hierarchy = {"NOTIFY": 1, "REQUIRE_APPROVAL": 2, "AUTO_BLOCK": 3}
        created_findings = []
        requires_approval = False
        is_blocked = False

        for dev in deviations:
            resp_action = dev.get("response_action", "NOTIFY")
            if action_hierarchy.get(resp_action, 1) > action_hierarchy.get(highest_action, 1):
                highest_action = resp_action

            # 1. Create Finding Record
            finding = Finding(
                execution_id=execution_id,
                agent_id=agent.id,
                severity=dev["severity"],
                deviation_type=dev["deviation_type"],
                title=dev["title"],
                description=dev["description"],
                expected_scope=dev["expected"],
                observed_activity=dev["observed"],
                response_action_triggered=resp_action,
                status="NEW"
            )
            session.add(finding)
            await session.flush() # get finding.id
            created_findings.append(finding)

            # 2. Handle Response Action Logic
            if resp_action == "AUTO_BLOCK":
                is_blocked = True
                agent.status = "BLOCKED"
                finding.status = "RESOLVED_BLOCKED"

                # Create Approval request for potential manual unblock
                approval = ApprovalRequest(
                    finding_id=finding.id,
                    agent_id=agent.id,
                    requested_action="UNBLOCK_AGENT",
                    status="PENDING",
                    risk_assessment=f"Automated Governance Emergency Block triggered by {dev['deviation_type']}: {dev['title']}"
                )
                session.add(approval)

                # Audit Log
                audit = AuditLog(
                    event_type="AGENT_AUTOMATED_BLOCK",
                    agent_id=agent.id,
                    actor="GOVERNANCE_INTERCEPTOR",
                    details={
                        "finding_id": finding.id,
                        "deviation_type": dev["deviation_type"],
                        "severity": dev["severity"],
                        "title": dev["title"]
                    }
                )
                session.add(audit)

            elif resp_action == "REQUIRE_APPROVAL":
                requires_approval = True
                if agent.status != "BLOCKED":
                    agent.status = "PENDING_APPROVAL"
                finding.status = "PENDING_HUMAN_REVIEW"

                approval = ApprovalRequest(
                    finding_id=finding.id,
                    agent_id=agent.id,
                    requested_action="RESUME_AGENT",
                    status="PENDING",
                    risk_assessment=f"Human review required for deviation {dev['deviation_type']}: {dev['title']}"
                )
                session.add(approval)

                audit = AuditLog(
                    event_type="HUMAN_APPROVAL_REQUIRED",
                    agent_id=agent.id,
                    actor="GOVERNANCE_INTERCEPTOR",
                    details={
                        "finding_id": finding.id,
                        "deviation_type": dev["deviation_type"],
                        "severity": dev["severity"]
                    }
                )
                session.add(audit)

            elif resp_action == "NOTIFY":
                if agent.status not in ["BLOCKED", "PENDING_APPROVAL"]:
                    agent.status = "WARNING"
                
                audit = AuditLog(
                    event_type="GUARDRAIL_WARNING_NOTIFIED",
                    agent_id=agent.id,
                    actor="GOVERNANCE_INTERCEPTOR",
                    details={
                        "finding_id": finding.id,
                        "deviation_type": dev["deviation_type"],
                        "title": dev["title"]
                    }
                )
                session.add(audit)

        overall_status = "BLOCKED" if is_blocked else ("PENDING_APPROVAL" if requires_approval else "WARNING")
        return {
            "status": overall_status,
            "findings": created_findings,
            "highest_action": highest_action
        }
