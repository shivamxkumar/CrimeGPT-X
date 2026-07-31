from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core.database import get_db
from app.core.auth import hash_password, verify_password, create_access_token, get_current_user
from app.core.config import settings
from app.core.rate_limit import limiter
from app.models.models import User, AuditLog
from app.schemas.schemas import LoginRequest, LoginResponse, UserCreate, UserOut

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
@limiter.limit("10/minute")
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.badge_number == payload.badge_number, User.is_active == True)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        # Log failed attempt
        db.add(AuditLog(
            action="LOGIN_FAILED",
            ip_address=request.client.host,
            success=False,
            extra_data={"badge": payload.badge_number},
        ))
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid badge number or password"
        )

    # Update last login
    user.last_login = datetime.utcnow()

    # Audit log
    db.add(AuditLog(
        user_id=user.id,
        user_badge=user.badge_number,
        user_name=user.name,
        action="LOGIN",
        ip_address=request.client.host,
        success=True,
    ))
    await db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role.value, "badge": user.badge_number})
    return LoginResponse(
        access_token=token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserOut.model_validate(user),
    )


@router.post("/register", response_model=UserOut, status_code=201)
@limiter.limit("10/minute")
async def register(payload: UserCreate, request: Request, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where(
            (User.badge_number == payload.badge_number) | (User.email == payload.email)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Badge number or email already registered")

    user = User(
        badge_number=payload.badge_number,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        police_station=payload.police_station,
        rank=payload.rank,
        is_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.post("/logout")
async def logout(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.add(AuditLog(
        user_id=current_user.id,
        user_badge=current_user.badge_number,
        user_name=current_user.name,
        action="LOGOUT",
        ip_address=request.client.host,
        success=True,
    ))
    await db.commit()
    return {"message": "Logged out successfully"}
