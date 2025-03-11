"""Authentication workflow definitions."""
from datetime import timedelta
from typing import Dict, Optional

from temporalio import workflow
from temporalio.common import RetryPolicy

@workflow.defn
class SignInWorkflow:
    """
    Workflow for handling the sign-in process.
    
    This workflow orchestrates the sign-in process including:
    - Email validation
    - Turnstile verification
    - OTP generation and delivery
    """

    @workflow.run
    async def run(self, email: str, turnstile_token: str, use_smtp: bool = False, smtp_provider: str = "default") -> dict:
        """
        Execute the sign-in workflow.

        Args:
            email: User's email address
            turnstile_token: Cloudflare Turnstile token for verification
            use_smtp: Whether to use SMTP for sending email (True) or FastMail (False)
            smtp_provider: SMTP provider to use ('default', 'mailtrap', or 'bizflycloud')

        Returns:
            Dict containing workflow result message and OTP if successful
        """
        # Step 1: Verify Turnstile token
        is_verified = await workflow.execute_activity(
            "verify_turnstile_activity",
            turnstile_token,
            start_to_close_timeout=timedelta(seconds=10)
        )
        if not is_verified:
            return {"message": "Invalid Turnstile token"}

        # Step 2: Validate email
        is_valid = await workflow.execute_activity(
            "validate_email_activity",
            email,
            start_to_close_timeout=timedelta(seconds=5)
        )
        if not is_valid:
            return {"message": "Invalid email format"}

        # Step 3: Generate OTP
        otp = await workflow.execute_activity(
            "generate_otp_activity",
            start_to_close_timeout=timedelta(seconds=5)
        )

        # Step 4: Send email (using either SMTP or FastMail)
        if use_smtp:
            email_sent = await workflow.execute_activity(
                "send_email_smtp_activity",
                args=[email, otp, smtp_provider],
                start_to_close_timeout=timedelta(seconds=30)
            )
        else:
            email_sent = await workflow.execute_activity(
                "send_email_activity",
                args=[email, otp],
                start_to_close_timeout=timedelta(seconds=30)
            )
            
        if not email_sent:
            return {"message": "Failed to send OTP email"}

        workflow.logger.info(f"Sign-in workflow completed successfully for {email}")
        return {
            "message": "OTP sent successfully",
            "otp": otp
        }

@workflow.defn
class VerifyOTPWorkflow:
    """
    Workflow for OTP verification process.
    
    This workflow handles the verification of OTP including:
    - OTP validation
    - User status updates
    - Session management
    """

    @workflow.run
    async def run(self, email: str, otp: str, stored_otp: str) -> Dict[str, str]:
        """
        Execute the OTP verification workflow.

        Args:
            email: User's email address
            otp: OTP provided by user
            stored_otp: Previously stored OTP to verify against

        Returns:
            Dict containing verification status and message
        """
        if not otp or not stored_otp:
            return {
                "status": "invalid",
                "message": "Invalid OTP data"
            }

        if otp != stored_otp:
            workflow.logger.warning(f"Invalid OTP attempt for {email}")
            return {
                "status": "invalid",
                "message": "Invalid OTP"
            }

        workflow.logger.info(f"OTP verified successfully for {email}")
        return {
            "status": "verified",
            "message": "OTP verified successfully"
        }
