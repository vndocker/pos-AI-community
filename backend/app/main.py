from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routers import products, inventory, invoices, health, auth
from temporalio.client import Client
from temporalio.worker import Worker
# from .routers.auth import SignInWorkflow
from .activities import BankingActivities
from .tworkflows import MoneyTransfer
import asyncio
import os

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
    try:
        client = await Client.connect("localhost:7233")
        activities = BankingActivities()
        worker = Worker(
            client,
            task_queue="auth-queue",
            # workflows=[SignInWorkflow],
             workflows=[MoneyTransfer],
            activities=[activities.withdraw, activities.deposit, activities.refund],
            # activities=[auth.generate_otp_activity, auth.validate_email_activity, auth.send_email_activity]
        )
        print("Temporal worker initialized successfully")
        # Run worker in non-blocking way
        asyncio.create_task(worker.run())
    except Exception as e:
        print(f"Failed to initialize Temporal worker: {e}")
        # Continue without Temporal for now
        pass

@app.on_event("startup")
async def startup_event():
    try:
        await init_db()
        print("Database initialized successfully")
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
