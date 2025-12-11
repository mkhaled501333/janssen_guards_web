"""User-related Pydantic schemas"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema"""
    guard_name: str = Field(..., min_length=1, max_length=100)


class UserCreate(UserBase):
    """Schema for creating a new user"""
    username: Optional[str] = Field(None, min_length=1, max_length=100)
    password: str = Field(..., min_length=1)
    user_id: int
    uid: str
    permissions: List[str] = ["scan", "view_logs"]


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    username: Optional[str] = Field(None, min_length=1, max_length=100)
    guard_name: Optional[str] = None
    password: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response"""
    user_id: int
    uid: str
    permissions: List[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for login request"""
    username: str  # Username for login
    password: str


class UserLoginResponse(BaseModel):
    """Schema for login response (legacy format)"""
    userId: int
    guardName: str
    uid: str
    permissions: List[str]
    updatedAt: int  # Unix timestamp in milliseconds

