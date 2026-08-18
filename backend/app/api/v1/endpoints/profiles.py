from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.models import Profile, AuditLog
from app.schemas.schemas import ProfileCreate, ProfileUpdate, ProfileOut

router = APIRouter()

@router.get("/", response_model=List[ProfileOut])
async def list_profiles(db: AsyncSession = Depends(get_db)):
    stmt = select(Profile).order_by(Profile.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/", response_model=ProfileOut, status_code=status.HTTP_201_CREATED)
async def create_profile(profile_in: ProfileCreate, db: AsyncSession = Depends(get_db)):
    profile = Profile(**profile_in.model_dump())
    db.add(profile)
    await db.flush()

    audit = AuditLog(
        event_type="PROFILE_CREATED",
        actor="GOVERNANCE_ADMIN",
        details={"profile_id": profile.id, "profile_name": profile.name}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(profile)
    return profile

@router.get("/{profile_id}", response_model=ProfileOut)
async def get_profile(profile_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Profile).where(Profile.id == profile_id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/{profile_id}", response_model=ProfileOut)
async def update_profile(profile_id: str, profile_in: ProfileUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Profile).where(Profile.id == profile_id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    audit = AuditLog(
        event_type="PROFILE_UPDATED",
        actor="GOVERNANCE_ADMIN",
        details={"profile_id": profile.id, "updated_fields": list(update_data.keys())}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(profile)
    return profile

@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(profile_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Profile).where(Profile.id == profile_id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    await db.delete(profile)
    audit = AuditLog(
        event_type="PROFILE_DELETED",
        actor="GOVERNANCE_ADMIN",
        details={"profile_id": profile_id, "profile_name": profile.name}
    )
    db.add(audit)
    await db.commit()
