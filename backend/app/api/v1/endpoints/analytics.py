from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_db
from app.models.models import Agent, Profile, Execution, Finding, ApprovalRequest
from app.schemas.schemas import SystemAnalyticsOut

router = APIRouter()

@router.get("/", response_model=SystemAnalyticsOut)
async def get_system_analytics(db: AsyncSession = Depends(get_db)):
    # Agents counts
    agents_res = await db.execute(select(Agent))
    agents = agents_res.scalars().all()
    
    total_agents = len(agents)
    active_agents = sum(1 for a in agents if a.status == "ACTIVE")
    blocked_agents = sum(1 for a in agents if a.status == "BLOCKED")
    warning_agents = sum(1 for a in agents if a.status in ["WARNING", "PENDING_APPROVAL"])

    # Profiles count
    profiles_res = await db.execute(select(func.count(Profile.id)))
    total_profiles = profiles_res.scalar() or 0

    # Executions count
    execs_res = await db.execute(select(func.count(Execution.id)))
    total_executions = execs_res.scalar() or 0

    # Findings counts & breakdown
    findings_res = await db.execute(select(Finding))
    findings = findings_res.scalars().all()
    total_findings = len(findings)

    severity_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for f in findings:
        sev = f.severity.upper() if f.severity else "LOW"
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    # Pending Approvals count
    appr_res = await db.execute(select(func.count(ApprovalRequest.id)).where(ApprovalRequest.status == "PENDING"))
    pending_approvals = appr_res.scalar() or 0

    # Compliance score computation
    if total_agents == 0:
        compliance_pct = 100.0
    else:
        uncompliant = blocked_agents + (0.5 * warning_agents)
        compliance_pct = max(0.0, round(100.0 - (uncompliant / total_agents * 100.0), 1))

    return SystemAnalyticsOut(
        total_agents=total_agents,
        active_agents=active_agents,
        blocked_agents=blocked_agents,
        warning_agents=warning_agents,
        total_profiles=total_profiles,
        total_executions=total_executions,
        total_findings=total_findings,
        findings_by_severity=severity_counts,
        pending_approvals_count=pending_approvals,
        overall_compliance_score_pct=compliance_pct
    )
