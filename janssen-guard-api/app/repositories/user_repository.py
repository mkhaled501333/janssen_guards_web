"""User repository for database operations"""

from typing import Optional
from sqlalchemy import select
from app.repositories.base_repository import BaseRepository
from app.models.user import User


class UserRepository(BaseRepository[User]):
    """User repository with specialized user queries"""
    
    async def get_by_username(self, username: str) -> Optional[User]:
        """
        Get user by username
        
        Args:
            username: Username
            
        Returns:
            Optional[User]: User or None if not found
        """
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()
    
    async def get_by_guard_name(self, guard_name: str) -> Optional[User]:
        """
        Get user by guard name
        
        Args:
            guard_name: Guard name
            
        Returns:
            Optional[User]: User or None if not found
        """
        result = await self.db.execute(
            select(User).where(User.guard_name == guard_name)
        )
        return result.scalar_one_or_none()
    
    async def get_by_uid(self, uid: str) -> Optional[User]:
        """
        Get user by UID
        
        Args:
            uid: User UID
            
        Returns:
            Optional[User]: User or None if not found
        """
        result = await self.db.execute(
            select(User).where(User.uid == uid)
        )
        return result.scalar_one_or_none()
    
    async def get_by_user_id(self, user_id: int) -> Optional[User]:
        """
        Get user by user_id
        
        Args:
            user_id: User ID
            
        Returns:
            Optional[User]: User or None if not found
        """
        result = await self.db.execute(
            select(User).where(User.user_id == user_id)
        )
        return result.scalar_one_or_none()

