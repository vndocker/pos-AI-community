from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
import random
import string
import httpx
from typing import Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from temporalio import workflow, activity
from temporalio.client import Client
from temporalio.worker import Worker
import asyncio
import os

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

# Email configuration
email_conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "5ba47113c06e1a"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "384f0582383c70"),
    MAIL_FROM=os.getenv("MAIL_FROM", "pos@lifeapp.ai"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", "2525")),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "sandbox.smtp.mailtrap.io"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

# Cloudflare Turnstile configuration
TURNSTILE_SECRET = os.getenv("TURNSTILE_SECRET")
TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

# Temporal activities
@activity.defn
async def validate_email_activity(email: str) -> bool:
    # Basic email validation (additional checks can be added)
    return "@" in email and "." in email.split("@")[1]

@activity.defn
async def generate_otp_activity() -> str:
    # Generate 6-digit OTP
    return ''.join(random.choices(string.digits, k=6))

@activity.defn
async def send_email_activity(email: str, otp: str) -> bool:
    try:
        message = MessageSchema(
            subject="Your OTP for POS System",
            recipients=[email],
            body=f"Your OTP is: {otp}\nValid for 5 minutes.",
            subtype="html"
        )
        
        fm = FastMail(email_conf)
        await fm.send_message(message)
        return True
    except Exception as e:
        print(f"Email sending failed: {str(e)}")
        return False

# Temporal workflow
@workflow.defn
class SignInWorkflow:
    @workflow.run
    async def run(self, email: str) -> dict:
        # Step 1: Validate email
        is_valid = await workflow.execute_activity(
            validate_email_activity,
            email,
            start_to_close_timeout=timedelta(seconds=5)
        )
        if not is_valid:
            return {"message": "Invalid email format"}

        # Step 2: Generate OTP
        otp = await workflow.execute_activity(
            generate_otp_activity,
            start_to_close_timeout=timedelta(seconds=5)
        )

        # Step 3: Send email
        email_sent = await workflow.execute_activity(
            send_email_activity,
            email,
            otp,
            start_to_close_timeout=timedelta(seconds=30)
        )
        if not email_sent:
            return {"message": "Failed to send OTP email"}

        return {
            "message": "OTP sent successfully",
            "otp": otp
        }

# FastAPI endpoints
@router.post("/signin/email", response_model=schemas.AuthResponse)
async def request_otp(
    request: schemas.EmailRequest,
    db: Session = Depends(get_db)
):
    # Verify Turnstile token
    async with httpx.AsyncClient() as client:
        response = await client.post(
            TURNSTILE_VERIFY_URL,
            data={
                "secret": TURNSTILE_SECRET,
                "response": request.turnstile_token
            }
        )
        result = response.json()
        if not result.get("success"):
            raise HTTPException(status_code=400, message="Invalid Turnstile token")

    try:
        # Initialize Temporal client
        client = await Client.connect("localhost:7233")
        
        # Execute workflow
        result = await client.execute_workflow(
            SignInWorkflow.run,
            args=[request.email],
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
            return schemas.AuthResponse(message="Failed to create OTP record")
    except Exception as e:
        print(f"Workflow error: {str(e)}")
        return schemas.AuthResponse(message="Failed to process sign-in request")

@router.post("/verify/otp", response_model=schemas.OTPResponse)
async def verify_otp(
    request: schemas.OTPVerifyRequest,
    db: Session = Depends(get_db)
):
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

    if otp_attempt.otp != request.otp:
        return schemas.OTPResponse(
            status=schemas.OTPStatus.INVALID,
            message="Invalid OTP"
        )

    # Mark OTP as used and update last login
    otp_attempt.used = True
    user.last_login = datetime.utcnow()
    db.commit()

    return schemas.OTPResponse(
        status=schemas.OTPStatus.VERIFIED,
        message="OTP verified successfully"
    )
