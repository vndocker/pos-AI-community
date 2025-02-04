from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routers import products, inventory, invoices

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

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/")
async def root():
    return {
        "message": "Simple POS API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
