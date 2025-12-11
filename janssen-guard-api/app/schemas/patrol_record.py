"""Patrol record Pydantic schemas"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import uuid as uuid_lib


class PatrolRecordBase(BaseModel):
    """Base patrol record schema"""
    point: str = Field(..., min_length=1, max_length=10)
    guardname: str = Field(..., min_length=1, max_length=100)
    note: str = ""


class PatrolRecordCreate(PatrolRecordBase):
    """Schema for creating a patrol record"""
    id: str
    time: str | int  # Client timestamp
    servertime: str | int  # Server timestamp
    imageid: str
    
    @field_validator('time', 'servertime', mode='before')
    @classmethod
    def parse_timestamp(cls, v):
        """Convert string timestamps to integers"""
        if isinstance(v, str):
            return int(v)
        return v
    
    @field_validator('id')
    @classmethod
    def validate_id(cls, v):
        """Validate UUID format"""
        try:
            uuid_lib.UUID(v)
        except ValueError:
            raise ValueError("Invalid UUID format")
        return v


class PatrolRecordResponse(PatrolRecordBase):
    """Schema for patrol record response"""
    id: str
    time: str  # Return as string for compatibility
    servertime: str
    imageid: str
    
    class Config:
        from_attributes = True


class PatrolRecordFilter(BaseModel):
    """Schema for filtering patrol records"""
    page: int = Field(1, ge=1)
    limit: int = Field(10, ge=1, le=100)
    point: Optional[str] = None
    guardname: Optional[str] = None
    start_date: Optional[int] = None  # Unix timestamp
    end_date: Optional[int] = None
    has_notes: Optional[bool] = None


class PatrolRecordsResponse(BaseModel):
    """Schema for paginated patrol records response"""
    records: List[PatrolRecordResponse]
    total: int
    total_pages: int
    current_page: int
    page_size: int

