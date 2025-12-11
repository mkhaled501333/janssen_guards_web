"""Patrol record repository for database operations"""

from app.repositories.base_repository import BaseRepository
from app.models.patrol_record import PatrolRecord


class PatrolRepository(BaseRepository[PatrolRecord]):
    """
    Patrol record repository with specialized patrol queries
    
    Inherits all common CRUD operations from BaseRepository
    """
    pass

