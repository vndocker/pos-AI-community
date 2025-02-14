from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routers import products, inventory, invoices, health, auth
from temporalio.client import Client
from temporalio.worker import Worker
from .routers.auth import SignInWorkflow
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
    client = await Client.connect("localhost:7233")
    worker = Worker(
        client,
        task_queue="auth-queue",
        workflows=[SignInWorkflow],
    )
    await worker.run()

@app.on_event("startup")
async def startup_event():
    await init_db()
    # Start Temporal worker in background
    asyncio.create_task(init_temporal_worker())

@app.get("/")
async def root():
    return {
        "message": "Simple POS API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
