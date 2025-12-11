"""Patrol Record database model"""

from sqlalchemy import Column, String, Integer, BigInteger, Text, TIMESTAMP, ForeignKey, func
import uuid
from app.database import Base


class PatrolRecord(Base):
    """Patrol record model for storing patrol scan data"""
    
    __tablename__ = "patrol_records"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))  # MySQL uses CHAR(36) for UUID
    point = Column(String(10), nullable=False, index=True)
    guard_name = Column(String(100), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=True)
    time = Column(BigInteger, nullable=False, index=True)  # Client timestamp
    server_time = Column(BigInteger, nullable=False, index=True)  # Server timestamp
    image_id = Column(String(100), nullable=False, index=True)
    note = Column(Text, default='')
    created_at = Column(TIMESTAMP, server_default=func.now(), index=True)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<PatrolRecord(point='{self.point}', guard='{self.guard_name}')>"

