"""User database model"""

from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, JSON, func
from app.database import Base


class User(Base):
    """User model for authentication and authorization"""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=True, unique=True, index=True)
    guard_name = Column(String(100), nullable=False, unique=True, index=True)
    password = Column(String(255), nullable=False)
    uid = Column(String(100), unique=True, nullable=False, index=True)
    permissions = Column(JSON, default=list)  # MySQL uses JSON instead of ARRAY
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<User(user_id={self.user_id}, guard_name='{self.guard_name}')>"

