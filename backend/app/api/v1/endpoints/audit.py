from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.models import AuditLog
from app.schemas.schemas import AuditLogOut

router = APIRouter()

@router.get("/", response_model=List[AuditLogOut])
async def list_audit_logs(
    agent_id: Optional[str] = None,
    event_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog).order_by(AuditLog.timestamp.desc())
    if agent_id:
        stmt = stmt.where(AuditLog.agent_id == agent_id)
    if event_type:
        stmt = stmt.where(AuditLog.event_type == event_type)
    res = await db.execute(stmt)
    return res.scalars().all()
