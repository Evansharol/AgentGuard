from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.models import Agent, Profile, AuditLog
from app.schemas.schemas import AgentCreate, AgentUpdate, AgentOut

router = APIRouter()

@router.get("/", response_model=List[AgentOut])
async def list_agents(db: AsyncSession = Depends(get_db)):
    stmt = select(Agent).options(selectinload(Agent.profile)).order_by(Agent.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/", response_model=AgentOut, status_code=status.HTTP_201_CREATED)
async def create_agent(agent_in: AgentCreate, db: AsyncSession = Depends(get_db)):
    # Verify profile exists
    prof_stmt = select(Profile).where(Profile.id == agent_in.profile_id)
    prof_res = await db.execute(prof_stmt)
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail=f"Profile '{agent_in.profile_id}' does not exist.")

    agent = Agent(**agent_in.model_dump())
    db.add(agent)
    await db.flush()

    audit = AuditLog(
        event_type="AGENT_CREATED",
        agent_id=agent.id,
        actor="GOVERNANCE_ADMIN",
        details={"agent_name": agent.name, "role": agent.role, "profile_id": agent.profile_id}
    )
    db.add(audit)
    await db.commit()

    # Re-fetch with loaded profile
    stmt = select(Agent).where(Agent.id == agent.id).options(selectinload(Agent.profile))
    res = await db.execute(stmt)
    return res.scalar_one()

@router.get("/{agent_id}", response_model=AgentOut)
async def get_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Agent).where(Agent.id == agent_id).options(selectinload(Agent.profile))
    res = await db.execute(stmt)
    agent = res.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.put("/{agent_id}", response_model=AgentOut)
async def update_agent(agent_id: str, agent_in: AgentUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Agent).where(Agent.id == agent_id).options(selectinload(Agent.profile))
    res = await db.execute(stmt)
    agent = res.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    update_data = agent_in.model_dump(exclude_unset=True)
    old_status = agent.status

    for field, value in update_data.items():
        setattr(agent, field, value)

    if "status" in update_data and update_data["status"] != old_status:
        audit = AuditLog(
            event_type="AGENT_STATUS_CHANGED",
            agent_id=agent.id,
            actor="GOVERNANCE_ADMIN",
            details={"old_status": old_status, "new_status": update_data["status"]}
        )
        db.add(audit)

    await db.commit()
    await db.refresh(agent)
    return agent

@router.post("/{agent_id}/override-status", response_model=AgentOut)
async def override_agent_status(
    agent_id: str,
    new_status: str = Body(..., embed=True),
    reason: str = Body("Manual administrative override", embed=True),
    db: AsyncSession = Depends(get_db)
):
    valid_statuses = ["ACTIVE", "PAUSED", "BLOCKED", "PENDING_APPROVAL", "WARNING"]
    if new_status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    stmt = select(Agent).where(Agent.id == agent_id).options(selectinload(Agent.profile))
    res = await db.execute(stmt)
    agent = res.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    old_status = agent.status
    agent.status = new_status.upper()

    audit = AuditLog(
        event_type="AGENT_STATUS_OVERRIDDEN",
        agent_id=agent.id,
        actor="GOVERNANCE_OFFICER",
        details={"old_status": old_status, "new_status": agent.status, "reason": reason}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(agent)
    return agent
