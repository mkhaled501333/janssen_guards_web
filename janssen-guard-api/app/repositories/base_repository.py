"""Base repository with common CRUD operations"""

from typing import Generic, TypeVar, Type, Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import DeclarativeMeta

ModelType = TypeVar("ModelType", bound=DeclarativeMeta)


class BaseRepository(Generic[ModelType]):
    """Base repository implementing common database operations"""
    
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        """
        Initialize repository
        
        Args:
            model: SQLAlchemy model class
            db: Async database session
        """
        self.model = model
        self.db = db
    
    async def get_by_id(self, id: Any) -> Optional[ModelType]:
        """
        Get entity by ID
        
        Args:
            id: Entity ID
            
        Returns:
            Optional[ModelType]: Entity or None if not found
        """
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_all(
        self,
        filters: Optional[Dict] = None,
        order_by: Optional[List[str]] = None
    ) -> Tuple[List[ModelType], int]:
        """
        Get all entities with optional filtering
        
        Args:
            filters: Dictionary of filters
            order_by: List of fields to order by
            
        Returns:
            Tuple[List[ModelType], int]: List of entities and total count
        """
        query = select(self.model)
        
        # Apply filters
        if filters:
            query = self._apply_filters(query, filters)
        
        # Apply ordering
        if order_by:
            query = self._apply_ordering(query, order_by)
        
        # Get results
        result = await self.db.execute(query)
        entities = result.scalars().all()
        
        # Get total count
        count_query = select(func.count()).select_from(self.model)
        if filters:
            count_query = self._apply_filters(count_query, filters)
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        return list(entities), total
    
    async def get_paginated(
        self,
        page: int = 1,
        limit: int = 10,
        filters: Optional[Dict] = None,
        order_by: Optional[List[str]] = None
    ) -> Tuple[List[ModelType], int]:
        """
        Get paginated entities
        
        Args:
            page: Page number (1-indexed)
            limit: Number of items per page
            filters: Dictionary of filters
            order_by: List of fields to order by
            
        Returns:
            Tuple[List[ModelType], int]: List of entities and total count
        """
        query = select(self.model)
        
        # Apply filters
        if filters:
            query = self._apply_filters(query, filters)
        
        # Apply ordering
        if order_by:
            query = self._apply_ordering(query, order_by)
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        
        # Get results
        result = await self.db.execute(query)
        entities = result.scalars().all()
        
        # Get total count
        count_query = select(func.count()).select_from(self.model)
        if filters:
            count_query = self._apply_filters(count_query, filters)
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        return list(entities), total
    
    async def create(self, data: Dict) -> ModelType:
        """
        Create new entity
        
        Args:
            data: Dictionary of entity data
            
        Returns:
            ModelType: Created entity
        """
        entity = self.model(**data)
        self.db.add(entity)
        await self.db.commit()
        await self.db.refresh(entity)
        return entity
    
    async def update(self, id: Any, data: Dict) -> Optional[ModelType]:
        """
        Update entity
        
        Args:
            id: Entity ID
            data: Dictionary of fields to update
            
        Returns:
            Optional[ModelType]: Updated entity or None if not found
        """
        entity = await self.get_by_id(id)
        if not entity:
            return None
        
        for key, value in data.items():
            setattr(entity, key, value)
        
        await self.db.commit()
        await self.db.refresh(entity)
        return entity
    
    async def delete(self, id: Any) -> bool:
        """
        Delete entity
        
        Args:
            id: Entity ID
            
        Returns:
            bool: True if deleted, False if not found
        """
        entity = await self.get_by_id(id)
        if not entity:
            return False
        
        await self.db.delete(entity)
        await self.db.commit()
        return True
    
    def _apply_filters(self, query, filters: Dict):
        """
        Apply filters to query
        
        Args:
            query: SQLAlchemy query
            filters: Dictionary of filters
            
        Returns:
            Modified query
        """
        for key, value in filters.items():
            if "__" in key:
                # Handle special filters (e.g., field__gte, field__like)
                field, operator = key.rsplit("__", 1)
                column = getattr(self.model, field)
                
                if operator == "gte":
                    query = query.where(column >= value)
                elif operator == "lte":
                    query = query.where(column <= value)
                elif operator == "like":
                    query = query.where(column.like(value))
                elif operator == "ne":
                    query = query.where(column != value)
            else:
                # Exact match
                column = getattr(self.model, key)
                query = query.where(column == value)
        
        return query
    
    def _apply_ordering(self, query, order_by: List[str]):
        """
        Apply ordering to query
        
        Args:
            query: SQLAlchemy query
            order_by: List of fields to order by (prefix with - for descending)
            
        Returns:
            Modified query
        """
        for field in order_by:
            if field.startswith("-"):
                # Descending
                column = getattr(self.model, field[1:])
                query = query.order_by(column.desc())
            else:
                # Ascending
                column = getattr(self.model, field)
                query = query.order_by(column.asc())
        
        return query

