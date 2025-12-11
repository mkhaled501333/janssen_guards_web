"""Report service for generating statistics and reports"""

from typing import Dict, List, Optional
from collections import defaultdict
from app.repositories.patrol_repository import PatrolRepository


class ReportService:
    """Service for generating patrol reports and statistics"""
    
    def __init__(self, patrol_repo: PatrolRepository):
        """
        Initialize report service
        
        Args:
            patrol_repo: Patrol repository instance
        """
        self.patrol_repo = patrol_repo
    
    async def get_summary_statistics(
        self,
        start_date: Optional[int] = None,
        end_date: Optional[int] = None
    ) -> Dict:
        """
        Get summary statistics for reports
        
        Args:
            start_date: Start date (Unix timestamp)
            end_date: End date (Unix timestamp)
            
        Returns:
            Dict: Summary statistics
        """
        # Get all records in date range
        filters = {}
        if start_date:
            filters["time__gte"] = start_date
        if end_date:
            filters["time__lte"] = end_date
        
        records, _ = await self.patrol_repo.get_all(filters=filters)
        
        # Calculate statistics
        unique_points = set(record.point for record in records)
        unique_guards = set(record.guard_name for record in records)
        
        return {
            "total_scans": len(records),
            "unique_points": len(unique_points),
            "unique_guards": len(unique_guards)
        }
    
    async def get_point_distribution(
        self,
        start_date: Optional[int] = None,
        end_date: Optional[int] = None
    ) -> List[Dict]:
        """
        Get patrol point distribution
        
        Args:
            start_date: Start date (Unix timestamp)
            end_date: End date (Unix timestamp)
            
        Returns:
            List[Dict]: Point distribution data
        """
        filters = {}
        if start_date:
            filters["time__gte"] = start_date
        if end_date:
            filters["time__lte"] = end_date
        
        records, _ = await self.patrol_repo.get_all(filters=filters)
        
        # Count by point
        point_counts = defaultdict(int)
        for record in records:
            point_counts[record.point] += 1
        
        total = len(records)
        
        # Format response
        distribution = [
            {
                "point": point,
                "count": count,
                "percentage": round((count / total * 100), 1) if total > 0 else 0
            }
            for point, count in sorted(point_counts.items())
        ]
        
        return distribution
    
    async def get_guard_distribution(
        self,
        start_date: Optional[int] = None,
        end_date: Optional[int] = None
    ) -> List[Dict]:
        """
        Get guard distribution
        
        Args:
            start_date: Start date (Unix timestamp)
            end_date: End date (Unix timestamp)
            
        Returns:
            List[Dict]: Guard distribution data
        """
        filters = {}
        if start_date:
            filters["time__gte"] = start_date
        if end_date:
            filters["time__lte"] = end_date
        
        records, _ = await self.patrol_repo.get_all(filters=filters)
        
        # Count by guard
        guard_counts = defaultdict(int)
        for record in records:
            guard_counts[record.guard_name] += 1
        
        total = len(records)
        
        # Format response
        distribution = [
            {
                "guard": guard,
                "count": count,
                "percentage": round((count / total * 100), 1) if total > 0 else 0
            }
            for guard, count in sorted(
                guard_counts.items(),
                key=lambda x: x[1],
                reverse=True
            )
        ]
        
        return distribution

