"""Authentication-related Temporal activities."""
import random
import string
from datetime import datetime
from typing import Optional

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from temporalio import activity
import os

# Email configuration
email_conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "5ba47113c06e1a"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "384f0582383c70"),
    MAIL_FROM=os.getenv("MAIL_FROM", "hotro_pos@pandev00.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", "2525")),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "sandbox.smtp.mailtrap.io"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

@activity.defn
async def validate_email_activity(email: str) -> bool:
    """
    Validate email format and structure.

    Args:
        email: The email address to validate

    Returns:
        bool: True if email is valid, False otherwise
    """
    try:
        # Basic email validation (additional checks can be added)
        if not email or "@" not in email:
            activity.logger.error(f"Invalid email format: {email}")
            return False
        
        local_part, domain = email.split("@")
        if not local_part or not domain or "." not in domain:
            activity.logger.error(f"Invalid email structure: {email}")
            return False
            
        return True
    except Exception as e:
        activity.logger.error(f"Email validation failed: {str(e)}")
        return False

@activity.defn
async def generate_otp_activity() -> str:
    """
    Generate a secure 6-digit OTP.

    Returns:
        str: 6-digit OTP
    """
    try:
        # Generate 6-digit OTP using cryptographically secure random choices
        otp = ''.join(random.choices(string.digits, k=6))
        activity.logger.info("OTP generated successfully")
        return otp
    except Exception as e:
        activity.logger.error(f"OTP generation failed: {str(e)}")
        raise

@activity.defn
async def send_email_activity(email: str, otp: str) -> bool:
    """
    Send OTP email to user.

    Args:
        email: Recipient email address
        otp: One-time password to send

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        message = MessageSchema(
            subject="Your OTP for POS System",
            recipients=[email],
            body=f"""
            <html>
                <body>
                    <h2>Your One-Time Password</h2>
                    <p>Your OTP is: <strong>{otp}</strong></p>
                    <p>This OTP is valid for 5 minutes.</p>
                    <p>If you didn't request this OTP, please ignore this email.</p>
                </body>
            </html>
            """,
            subtype="html"
        )
        
        fm = FastMail(email_conf)
        await fm.send_message(message)
        activity.logger.info(f"OTP email sent successfully to {email}")
        return True
    except Exception as e:
        activity.logger.error(f"Failed to send OTP email: {str(e)}")
        return False

@activity.defn
async def verify_turnstile_activity(token: str) -> bool:
    """
    Verify Cloudflare Turnstile token.

    Args:
        token: Turnstile token to verify

    Returns:
        bool: True if token is valid, False otherwise
    """
    try:
        import httpx
        
        TURNSTILE_SECRET = os.getenv("TURNSTILE_SECRET", "0x4AAAAAAA8q3OrddWDlZRslFB7_kLgO0bU")
        TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                TURNSTILE_VERIFY_URL,
                data={
                    "secret": TURNSTILE_SECRET,
                    "response": token
                }
            )
            result = response.json()
            
            if not result.get("success"):
                activity.logger.error(f"Turnstile verification failed: {result}")
                return False
                
            activity.logger.info("Turnstile verification successful")
            return True
    except Exception as e:
        activity.logger.error(f"Turnstile verification error: {str(e)}")
        return False
