"""Health check API route"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime
from app.database import get_db
from app.schemas.response import HealthResponse
from app.services.image_service import ImageService

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check endpoint
    Returns system status information
    
    Args:
        db: Database session
        
    Returns:
        HealthResponse: System health status
    """
    # Check database connection
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    
    # Check storage
    try:
        image_service = ImageService()
        storage_status = "available" if image_service.storage_path.exists() else "unavailable"
    except Exception:
        storage_status = "unavailable"
    
    return HealthResponse(
        status="healthy" if db_status == "connected" else "unhealthy",
        timestamp=datetime.utcnow().isoformat(),
        database=db_status,
        storage=storage_status,
        version="1.0.0"
    )

