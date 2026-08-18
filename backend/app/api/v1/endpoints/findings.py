from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.models import Finding
from app.schemas.schemas import FindingOut

router = APIRouter()

@router.get("/", response_model=List[FindingOut])
async def list_findings(
    agent_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Finding).order_by(Finding.timestamp.desc())
    if agent_id:
        stmt = stmt.where(Finding.agent_id == agent_id)
    if severity:
        stmt = stmt.where(Finding.severity == severity.upper())
    if status:
        stmt = stmt.where(Finding.status == status.upper())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{finding_id}", response_model=FindingOut)
async def get_finding(finding_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Finding).where(Finding.id == finding_id)
    res = await db.execute(stmt)
    finding = res.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding evidence not found")
    return finding
