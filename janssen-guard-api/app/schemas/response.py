"""Generic response schemas"""

from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar('T')


class SuccessResponse(BaseModel, Generic[T]):
    """Generic success response schema"""
    success: bool = True
    message: str
    data: Optional[T] = None


class ErrorResponse(BaseModel):
    """Error response schema"""
    success: bool = False
    error: str
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response schema"""
    status: str
    timestamp: str
    database: str
    storage: str
    version: str

