"""Authentication router endpoints."""
from datetime import datetime, timedelta
from typing import Optional
import traceback
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from temporalio.client import Client

from .. import models, schemas
from ..database import get_db
from ..workflows.auth_workflow import SignInWorkflow, VerifyOTPWorkflow

router = APIRouter(prefix="/auth", tags=["auth"])

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
        client = await Client.connect(os.getenv("ORCHESTRATOR_URL", "localhost:7233"))
        
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
        client = await Client.connect("localhost:7233")
        
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
