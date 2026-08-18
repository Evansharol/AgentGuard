from fastapi import APIRouter
from app.api.v1.endpoints import (
    agents,
    profiles,
    executions,
    findings,
    approvals,
    audit,
    simulator,
    analytics
)

api_router = APIRouter()
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(agents.router, prefix="/agents", tags=["Agents Fleet"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["Behavior Profiles"])
api_router.include_router(executions.router, prefix="/executions", tags=["Execution Traces"])
api_router.include_router(findings.router, prefix="/findings", tags=["Forensic Findings"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["Human Approval Queue"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Trail"])
api_router.include_router(simulator.router, prefix="/simulator", tags=["Agent Simulator"])
