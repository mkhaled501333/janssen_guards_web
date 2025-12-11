"""Patrol service for managing patrol records"""

import logging
from typing import List, Optional
from app.repositories.patrol_repository import PatrolRepository
from app.schemas.patrol_record import (
    PatrolRecordCreate,
    PatrolRecordResponse,
    PatrolRecordFilter,
    PatrolRecordsResponse
)
from app.services.image_service import ImageService

logger = logging.getLogger(__name__)


class PatrolService:
    """Service for handling patrol record operations"""
    
    def __init__(
        self,
        patrol_repo: PatrolRepository,
        image_service: ImageService
    ):
        """
        Initialize patrol service
        
        Args:
            patrol_repo: Patrol repository instance
            image_service: Image service instance
        """
        self.patrol_repo = patrol_repo
        self.image_service = image_service
    
    async def create_patrol_record(
        self,
        record_data: PatrolRecordCreate
    ) -> PatrolRecordResponse:
        """
        Create a new patrol record and fetch image from camera if configured
        
        Args:
            record_data: Patrol record data
            
        Returns:
            PatrolRecordResponse: Created patrol record
        """
        # Convert timestamps to integers if needed
        time_int = int(record_data.time) if isinstance(record_data.time, str) else record_data.time
        servertime_int = int(record_data.servertime) if isinstance(record_data.servertime, str) else record_data.servertime
        
        # Fetch image from camera if camera URL is configured for this point
        image_path = await self.image_service.fetch_and_save_image_for_point(
            record_data.imageid,
            record_data.point
        )
        if image_path:
            logger.info(f"Successfully saved camera image for patrol record {record_data.id} from point {record_data.point}")
        else:
            logger.debug(f"No camera configured or failed to fetch image for point {record_data.point}, continuing without image")
        
        # Create record in database
        record = await self.patrol_repo.create({
            "id": record_data.id,
            "point": record_data.point,
            "guard_name": record_data.guardname,
            "time": time_int,
            "server_time": servertime_int,
            "image_id": record_data.imageid,
            "note": record_data.note
        })
        
        # Return response
        return PatrolRecordResponse(
            id=str(record.id),
            point=record.point,
            guardname=record.guard_name,
            time=str(record.time),
            servertime=str(record.server_time),
            imageid=record.image_id,
            note=record.note
        )
    
    async def get_patrol_records(
        self,
        filters: PatrolRecordFilter
    ) -> PatrolRecordsResponse:
        """
        Get paginated and filtered patrol records
        
        Args:
            filters: Filter parameters
            
        Returns:
            PatrolRecordsResponse: Paginated patrol records
        """
        # Build query filters
        query_filters = {}
        
        if filters.point:
            query_filters["point"] = filters.point
        
        if filters.guardname:
            query_filters["guard_name__like"] = f"%{filters.guardname}%"
        
        if filters.start_date:
            query_filters["time__gte"] = filters.start_date
        
        if filters.end_date:
            query_filters["time__lte"] = filters.end_date
        
        if filters.has_notes:
            query_filters["note__ne"] = ""
        
        # Get paginated records
        records, total = await self.patrol_repo.get_paginated(
            page=filters.page,
            limit=filters.limit,
            filters=query_filters,
            order_by=["-time"]  # Order by time descending
        )
        
        # Calculate total pages
        total_pages = (total + filters.limit - 1) // filters.limit
        
        # Convert to response format
        record_responses = [
            PatrolRecordResponse(
                id=str(record.id),
                point=record.point,
                guardname=record.guard_name,
                time=str(record.time),
                servertime=str(record.server_time),
                imageid=record.image_id,
                note=record.note
            )
            for record in records
        ]
        
        return PatrolRecordsResponse(
            records=record_responses,
            total=total,
            total_pages=total_pages,
            current_page=filters.page,
            page_size=len(record_responses)
        )
    
    async def get_image(self, image_id: str) -> Optional[bytes]:
        """
        Get patrol image by ID
        
        Args:
            image_id: Image identifier
            
        Returns:
            Optional[bytes]: Image data or None if not found
        """
        return await self.image_service.get_image(image_id)

