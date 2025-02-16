from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from temporalio.client import Client
from temporalio.worker import Worker
import asyncio
import os
from .database import init_db
from .routers import products, inventory, invoices, health, auth
from .workflows.auth_workflow import SignInWorkflow, VerifyOTPWorkflow
from .activities.auth_activities import (
    validate_email_activity,
    generate_otp_activity,
    send_email_activity,
    verify_turnstile_activity
)


load_dotenv()
app = FastAPI(title="Simple POS API")


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(invoices.router)
app.include_router(health.router)
app.include_router(auth.router)

# Initialize Temporal worker
async def init_temporal_worker():    
    """Initialize and run the Temporal worker with authentication workflows."""
    try:
        client = await Client.connect(os.getenv("ORCHESTRATOR_URL", "localhost:7233"))
        worker = Worker(
                client,
                task_queue="auth-queue",
                workflows=[SignInWorkflow, VerifyOTPWorkflow],
                activities=[
                    validate_email_activity,
                    generate_otp_activity,
                    send_email_activity,
                    verify_turnstile_activity
                ]
            )
        print("Temporal worker initialized successfully")
        # Run worker in non-blocking way
        asyncio.create_task(worker.run())
    except Exception as e:
        print(f"Failed to initialize Temporal worker: {e}")
        # Raise the error since authentication requires Temporal
        raise


@app.on_event("startup")
async def startup_event():
    try:
        await init_db()
        print("Database initialized successfully")
        if os.getenv("ENV", "DEV") == "DEV":
            # Initialize Temporal worker
            await init_temporal_worker()
    except Exception as e:
        print(f"Startup error: {e}")
        raise

@app.get("/")
async def root():
    return {
        "message": "Simple POS API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
