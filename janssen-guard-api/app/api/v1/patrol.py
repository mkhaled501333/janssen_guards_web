"""Patrol record API routes"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging
from app.database import get_db
from app.schemas.patrol_record import (
    PatrolRecordCreate,
    PatrolRecordResponse,
    PatrolRecordsResponse,
    PatrolRecordFilter
)
from app.services.patrol_service import PatrolService
from app.services.image_service import ImageService
from app.repositories.patrol_repository import PatrolRepository
from app.models.patrol_record import PatrolRecord

router = APIRouter()
logger = logging.getLogger(__name__)


# Create patrol record
@router.post("/industerialsecurity", response_model=PatrolRecordResponse, status_code=201)
async def create_patrol_record(
    record: PatrolRecordCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new patrol record
    
    Args:
        record: Patrol record data
        db: Database session
        
    Returns:
        PatrolRecordResponse: Created patrol record
        
    Raises:
        HTTPException: 500 if creation fails
    """
    try:
        # Log the received data for debugging
        logger.info(f"Received patrol record: id={record.id}, point={record.point}, guardname={record.guardname}, time={record.time}, servertime={record.servertime}, imageid={record.imageid}")
        
        patrol_repo = PatrolRepository(PatrolRecord, db)
        image_service = ImageService()
        patrol_service = PatrolService(patrol_repo, image_service)
        
        result = await patrol_service.create_patrol_record(record)
        logger.info(f"Successfully created patrol record: {result.id}")
        return result
    except Exception as e:
        logger.error(f"Error creating patrol record: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Get patrol records (with optional filters) or get image
@router.get("/industerialsecurity")
async def get_patrol_records(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    point: Optional[str] = Query(None, description="Filter by patrol point"),
    guardname: Optional[str] = Query(None, description="Filter by guard name"),
    start_date: Optional[int] = Query(None, description="Start date (Unix timestamp)"),
    end_date: Optional[int] = Query(None, description="End date (Unix timestamp)"),
    has_notes: Optional[bool] = Query(None, description="Filter records with notes"),
    imageid: Optional[str] = Query(None, description="Image ID to retrieve"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get patrol records with pagination and filtering
    OR get patrol image if imageid is provided
    
    Args:
        page: Page number
        limit: Items per page
        point: Filter by patrol point
        guardname: Filter by guard name (partial match)
        start_date: Start date filter (Unix timestamp)
        end_date: End date filter (Unix timestamp)
        has_notes: Filter records with notes
        imageid: Image ID (if provided, returns image instead of records)
        db: Database session
        
    Returns:
        PatrolRecordsResponse or Image: Patrol records or image binary
        
    Raises:
        HTTPException: 404 if image not found, 500 if query fails
    """
    # If imageid is provided, return image
    if imageid:
        image_service = ImageService()
        image_data = await image_service.get_image(imageid)
        
        if not image_data:
            raise HTTPException(status_code=404, detail="Image not found")
        
        return Response(
            content=image_data,
            media_type="image/jpeg",
            headers={
                "Content-Disposition": f"inline; filename={imageid}.jpg"
            }
        )
    
    # Otherwise, return patrol records
    patrol_repo = PatrolRepository(PatrolRecord, db)
    image_service = ImageService()
    patrol_service = PatrolService(patrol_repo, image_service)
    
    filters = PatrolRecordFilter(
        page=page,
        limit=limit,
        point=point,
        guardname=guardname,
        start_date=start_date,
        end_date=end_date,
        has_notes=has_notes
    )
    
    try:
        result = await patrol_service.get_patrol_records(filters)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

