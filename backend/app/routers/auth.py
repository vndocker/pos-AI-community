"""Authentication router endpoints."""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from temporalio.client import Client

from .. import models, schemas
from ..database import get_db
from ..workflows.auth_workflow import SignInWorkflow, VerifyOTPWorkflow

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signin/email", response_model=schemas.AuthResponse)
async def request_otp(
    request: schemas.EmailRequest,
    db: Session = Depends(get_db)
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
        client = await Client.connect("localhost:7233")
        
        # Execute sign-in workflow
        result = await client.execute_workflow(
            SignInWorkflow.run,
            args=[request.email, request.turnstile_token],
            id=f"signin-{request.email}-{datetime.utcnow().timestamp()}",
            task_queue="auth-queue"
        )
        
        if not result.get("otp"):
            return schemas.AuthResponse(message=result["message"])
            
        try:
            # Create or get user
            user = db.query(models.User).filter(models.User.email == request.email).first()
            if not user:
                user = models.User(email=request.email)
                db.add(user)
                db.commit()
                db.refresh(user)
            
            # Create OTP attempt
            otp_attempt = models.OTPAttempt(
                user_id=user.id,
                otp=result["otp"],
                expires_at=datetime.utcnow() + timedelta(minutes=5)
            )
            db.add(otp_attempt)
            db.commit()
            
            return schemas.AuthResponse(
                message="OTP sent successfully",
                user_id=user.id
            )
        except Exception as e:
            db.rollback()
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
    db: Session = Depends(get_db)
) -> schemas.OTPResponse:
    """
    Verify OTP for sign-in completion.
    
    Args:
        request: OTP verification request containing email and OTP
        db: Database session
        
    Returns:
        OTPResponse containing verification status and message
    """
    # Find user by email
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Find latest unused OTP attempt
    otp_attempt = (
        db.query(models.OTPAttempt)
        .filter(
            models.OTPAttempt.user_id == user.id,
            models.OTPAttempt.used == False,
            models.OTPAttempt.expires_at > datetime.utcnow()
        )
        .order_by(models.OTPAttempt.created_at.desc())
        .first()
    )

    if not otp_attempt:
        return schemas.OTPResponse(
            status=schemas.OTPStatus.EXPIRED,
            message="OTP expired or not found"
        )

    try:
        # Initialize Temporal client
        client = await Client.connect("localhost:7233")
        
        # Execute verification workflow
        result = await client.execute_workflow(
            VerifyOTPWorkflow.run,
            args=[request.email, request.otp, otp_attempt.otp],
            id=f"verify-{request.email}-{datetime.utcnow().timestamp()}",
            task_queue="auth-queue"
        )
        
        if result["status"] == "verified":
            # Mark OTP as used and update last login
            otp_attempt.used = True
            user.last_login = datetime.utcnow()
            db.commit()
        
        return schemas.OTPResponse(
            status=getattr(schemas.OTPStatus, result["status"].upper()),
            message=result["message"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Workflow error: {str(e)}"
        )
