from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.models import ApprovalRequest, Agent, Finding, AuditLog
from app.schemas.schemas import ApprovalRequestOut, ApprovalDecision

def utc_now():
    return datetime.now(timezone.utc)

router = APIRouter()

@router.get("/", response_model=List[ApprovalRequestOut])
async def list_approval_requests(
    status: Optional[str] = None,
    agent_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ApprovalRequest).options(
        selectinload(ApprovalRequest.finding),
        selectinload(ApprovalRequest.agent)
    ).order_by(ApprovalRequest.requested_at.desc())

    if status:
        stmt = stmt.where(ApprovalRequest.status == status.upper())
    if agent_id:
        stmt = stmt.where(ApprovalRequest.agent_id == agent_id)

    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/{approval_id}/decide", response_model=ApprovalRequestOut)
async def make_approval_decision(
    approval_id: str,
    decision_in: ApprovalDecision,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ApprovalRequest).where(ApprovalRequest.id == approval_id).options(
        selectinload(ApprovalRequest.finding),
        selectinload(ApprovalRequest.agent)
    )
    res = await db.execute(stmt)
    approval = res.scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    if approval.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Approval request already resolved as {approval.status}")

    decision_upper = decision_in.decision.upper()
    if decision_upper not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Decision must be APPROVED or REJECTED")

    approval.status = decision_upper
    approval.decided_at = utc_now()
    approval.decided_by = decision_in.decided_by
    approval.decision_reason = decision_in.reason

    agent = approval.agent
    finding = approval.finding

    if decision_upper == "APPROVED":
        # Resume Agent Execution Capability
        agent.status = "ACTIVE"
        if finding:
            finding.status = "RESOLVED_APPROVED"

        audit = AuditLog(
            event_type="HUMAN_APPROVAL_GRANTED",
            agent_id=agent.id,
            actor=decision_in.decided_by,
            details={
                "approval_id": approval.id,
                "finding_id": finding.id if finding else None,
                "decision": "APPROVED",
                "reason": decision_in.reason,
                "resulting_agent_status": "ACTIVE"
            }
        )
        db.add(audit)
    else: # REJECTED
        # Block Agent Execution Permanently
        agent.status = "BLOCKED"
        if finding:
            finding.status = "RESOLVED_BLOCKED"

        audit = AuditLog(
            event_type="HUMAN_APPROVAL_REJECTED",
            agent_id=agent.id,
            actor=decision_in.decided_by,
            details={
                "approval_id": approval.id,
                "finding_id": finding.id if finding else None,
                "decision": "REJECTED",
                "reason": decision_in.reason,
                "resulting_agent_status": "BLOCKED"
            }
        )
        db.add(audit)

    await db.commit()
    await db.refresh(approval)
    return approval
