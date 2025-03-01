"""Authentication router endpoints."""
from datetime import datetime, timedelta
from typing import Optional
import traceback
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from temporalio.client import Client

from .. import models, schemas
from ..database import get_db
from ..workflows.auth_workflow import SignInWorkflow, VerifyOTPWorkflow
from ..utils.r2_storage import R2Storage

r2_storage = R2Storage()

router = APIRouter(prefix="/auth", tags=["auth"])

async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> models.User:
    """Get current authenticated user."""
    # For now, we'll use the email from request headers
    # TODO: Implement proper JWT authentication
    # email = request.headers.get("X-User-Email")
    email = "zeddy502@gmail.com"
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    stmt = select(models.User).where(models.User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.get("/profile", response_model=schemas.UserProfile)
async def get_profile(
    current_user: models.User = Depends(get_current_user)
) -> schemas.UserProfile:
    """Get current user's profile."""
    return schemas.UserProfile(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )

@router.put("/profile", response_model=schemas.UserProfile)
async def update_profile(
    profile: schemas.UserProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> schemas.UserProfile:
    """Update current user's profile."""
    try:
        if profile.username is not None:
            current_user.username = profile.username
        await db.commit()
        await db.refresh(current_user)
        
        return schemas.UserProfile(
            id=current_user.id,
            email=current_user.email,
            username=current_user.username,
            avatar_url=current_user.avatar_url,
            created_at=current_user.created_at,
            last_login=current_user.last_login
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.post("/avatar/presigned", response_model=schemas.AvatarResponse)
async def get_avatar_presigned_url(
    current_user: models.User = Depends(get_current_user)
) -> schemas.AvatarResponse:
    """Get presigned URLs for avatar upload."""
    try:
        object_key = r2_storage.generate_avatar_key(current_user.id)
        urls = r2_storage.generate_presigned_url(object_key)
        return schemas.AvatarResponse(**urls)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate presigned URL: {str(e)}"
        )

@router.post("/avatar/confirm", response_model=schemas.UserProfile)
async def confirm_avatar_upload(
    confirm: schemas.AvatarConfirm,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> schemas.UserProfile:
    """Confirm avatar upload and update user profile."""
    try:
        # Delete old avatar if exists
        if current_user.avatar_url:
            old_key = current_user.avatar_url.split("/")[-2:]
            old_key = f"avatars/{'/'.join(old_key)}"
            try:
                r2_storage.delete_object(old_key)
            except Exception as e:
                print(f"Failed to delete old avatar: {str(e)}")
        
        # Update user's avatar URL
        current_user.avatar_url = f"{r2_storage.endpoint}/{r2_storage.bucket_name}/{confirm.object_key}"
        await db.commit()
        await db.refresh(current_user)
        
        return schemas.UserProfile(
            id=current_user.id,
            email=current_user.email,
            username=current_user.username,
            avatar_url=current_user.avatar_url,
            created_at=current_user.created_at,
            last_login=current_user.last_login
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to confirm avatar upload: {str(e)}"
        )

@router.post("/signin/email", response_model=schemas.AuthResponse)
async def request_otp(
    request: schemas.EmailRequest,
    db: AsyncSession = Depends(get_db)
) -> schemas.AuthResponse:
    """
    Request OTP for sign-in.
    
    Args:
        request: Email request containing email and Turnstile token
        db: Database session
        
    Returns:
        AuthResponse containing status message and user ID if successful
    """
    try:
        # Initialize Temporal client
        client = await Client.connect(
            target_host=os.getenv("ORCHESTRATOR_URL", "localhost:7233"),
            api_key=os.getenv("ORCHESTRATOR_API_KEY", ""),
            tls=True,
            namespace="pos.inedr"
        )
        
        # Execute sign-in workflow
        workflow_result = await client.execute_workflow(
            SignInWorkflow.run,
            args=[request.email, request.turnstile_token],
            id=f"signin-{request.email}-{datetime.utcnow().timestamp()}",
            task_queue="auth-queue"
        )

        print("Call workflow SignInWorkflow result: ", workflow_result)
        
        if not workflow_result.get("otp"):
            return schemas.AuthResponse(message=workflow_result["message"])
            
        try:
            # Create or get user using async syntax
            stmt = select(models.User).where(models.User.email == request.email)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                user = models.User(email=request.email)
                db.add(user)
                await db.commit()
                await db.refresh(user)
            
            # Create OTP attempt
            otp_attempt = models.OTPAttempt(
                user_id=user.id,
                otp=workflow_result["otp"],
                expires_at=datetime.utcnow() + timedelta(minutes=5)
            )
            db.add(otp_attempt)
            await db.commit()
            
            return schemas.AuthResponse(
                message="OTP sent successfully",
                user_id=user.id
            )
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Workflow error: {str(e)}"
        )

@router.post("/verify/otp", response_model=schemas.OTPResponse)
async def verify_otp(
    request: schemas.OTPVerifyRequest,
    db: AsyncSession = Depends(get_db)
) -> schemas.OTPResponse:
    """
    Verify OTP for sign-in completion.
    """
    # Find user by email
    stmt = select(models.User).where(models.User.email == request.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Find latest unused OTP attempt
    stmt = select(models.OTPAttempt).where(
        models.OTPAttempt.user_id == user.id,
        models.OTPAttempt.used == False,
        models.OTPAttempt.expires_at > datetime.utcnow()
    ).order_by(models.OTPAttempt.created_at.desc()).limit(1)
    
    result = await db.execute(stmt)
    otp_attempt = result.scalar_one_or_none()

    if not otp_attempt:
        return schemas.OTPResponse(
            status=schemas.OTPStatus.EXPIRED,
            message="OTP expired or not found"
        )

    try:
        # Initialize Temporal client
        client = await Client.connect(
            target_host=os.getenv("ORCHESTRATOR_URL", "localhost:7233"),
            api_key=os.getenv("ORCHESTRATOR_API_KEY", ""),
            tls=True,
            namespace="pos.inedr"
        )
        
        # Execute verification workflow
        workflow_result = await client.execute_workflow(
            VerifyOTPWorkflow.run,
            args=[request.email, request.otp, otp_attempt.otp],
            id=f"verify-{request.email}-{datetime.utcnow().timestamp()}",
            task_queue="auth-queue"
        )
        
        if workflow_result["status"] == "verified":
            # Mark OTP as used and update last login
            otp_attempt.used = True
            user.last_login = datetime.utcnow()
            await db.commit()
        
        return schemas.OTPResponse(
            status=getattr(schemas.OTPStatus, workflow_result["status"].upper()),
            message=workflow_result["message"]
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Workflow error: {str(e)}"
        )
