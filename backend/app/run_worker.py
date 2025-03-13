# @@@SNIPSTART python-money-transfer-project-template-run-worker
import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
import os

from app.workflows.auth_workflow import SignInWorkflow, VerifyOTPWorkflow
from app.activities.auth_activities import (
    validate_email_activity,
    generate_otp_activity,
    send_email_activity,
    verify_turnstile_activity,
    send_email_smtp_activity
)

async def main() -> None:
    client: Client = await Client.connect(
        target_host=os.getenv("ORCHESTRATOR_URL", "localhost:7233"),
        api_key=os.getenv("ORCHESTRATOR_API_KEY", ""),
        tls=True,
        namespace="pos.inedr"
    )
    # Run the worker
    worker = Worker(
            client,
            task_queue="auth-queue",
            workflows=[SignInWorkflow, VerifyOTPWorkflow],
            activities=[
                validate_email_activity,
                generate_otp_activity,
                send_email_activity,
                verify_turnstile_activity,
                send_email_smtp_activity
            ]
        )
    print("Temporal worker initialized successfully")
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
# @@@SNIPEND
