from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import time
from datetime import datetime
from ..database import get_db
from typing import Dict

router = APIRouter(tags=["health"])

async def check_database(db: AsyncSession) -> Dict[str, str]:
    """Check database connection and measure response time."""
    start_time = time.perf_counter()
    try:
        # Execute a simple query to check database connectivity
        await db.execute(text("SELECT 1"))
        await db.commit()
        end_time = time.perf_counter()
        response_time = f"{(end_time - start_time) * 1000:.2f}ms"
        return {"status": "ok", "responseTime": response_time}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Database connection error: {str(e)}"
        )

@router.get("/health", 
    response_model=Dict[str, object],
    responses={
        200: {"description": "Health check successful"},
        503: {"description": "Service unavailable"}
    },
    response_headers={
        "Cache-Control": "no-cache"
    }
)
async def health_check(
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Health check endpoint that verifies API and database status.
    Returns database response time and overall health status.
    """
    if response:
        response.headers["Cache-Control"] = "no-cache"
    db_health = await check_database(db)
    
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_health
    }
