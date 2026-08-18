from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.models import Execution
from app.schemas.schemas import ExecutionOut

router = APIRouter()

@router.get("/", response_model=List[ExecutionOut])
async def list_executions(agent_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Execution).options(selectinload(Execution.steps)).order_by(Execution.started_at.desc())
    if agent_id:
        stmt = stmt.where(Execution.agent_id == agent_id)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{execution_id}", response_model=ExecutionOut)
async def get_execution(execution_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Execution).where(Execution.id == execution_id).options(selectinload(Execution.steps))
    res = await db.execute(stmt)
    execution = res.scalar_one_or_none()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution trace not found")
    return execution
