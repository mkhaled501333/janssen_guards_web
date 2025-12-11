"""Image storage service for handling patrol images"""

import os
import aiofiles
import httpx
import logging
from typing import Optional, Dict
from pathlib import Path
from app.config import settings

logger = logging.getLogger(__name__)


class ImageService:
    """Service for handling image storage and retrieval"""
    
    # Camera configuration: Map patrol points to camera URLs
    # Format: http://username:password@ip_address/ISAPI/Streaming/channels/{channel}/picture
    # Note: Special characters in password must be URL-encoded (@ -> %40)
    CAMERA_MAPPINGS: Dict[str, str] = {
        "1": "http://admin:Admin%40123@192.168.1.231/ISAPI/Streaming/channels/2001/picture",

        "2": "http://admin:Admin%40123@192.168.1.235/ISAPI/Streaming/channels/101/picture",

        "3": "http://admin:Admin%40123@192.168.1.231/ISAPI/Streaming/channels/2401/picture",

        "4": "http://admin:Admin%40123@192.168.1.232/ISAPI/Streaming/channels/301/picture",

        "5": "http://admin:Admin%40123@192.168.1.233/ISAPI/Streaming/channels/2301/picture",

        "6": "http://admin:Admin%40123@192.168.1.233/ISAPI/Streaming/channels/701/picture",

        "7": "http://admin:Admin%40123@192.168.1.233/ISAPI/Streaming/channels/1501/picture",

        "8": "http://admin:Admin%40123@192.168.1.232/ISAPI/Streaming/channels/2801/picture",

        "9": "http://admin:Admin%40123@192.168.1.234/ISAPI/Streaming/channels/1001/picture",

        "10": "http://admin:Admin%40123@192.168.1.235/ISAPI/Streaming/channels/2501/picture",

        "11": "http://admin:Admin%40123@192.168.1.235/ISAPI/Streaming/channels/1501/picture",

        "12": "http://admin:Admin%40123@192.168.1.232/ISAPI/Streaming/channels/2601/picture",
    }
    
    def __init__(self):
        """Initialize image service and create storage directory"""
        self.storage_path = Path(settings.IMAGE_STORAGE_PATH)
        self.storage_path.mkdir(parents=True, exist_ok=True)
    
    def get_camera_url(self, point: str) -> Optional[str]:
        """
        Get camera URL for a specific patrol point
        
        Args:
            point: Patrol point identifier
            
        Returns:
            Optional[str]: Camera URL if configured, None otherwise
        """
        return self.CAMERA_MAPPINGS.get(point)
    
    async def save_image(self, image_id: str, image_data: bytes) -> str:
        """
        Save image to storage
        
        Args:
            image_id: Unique image identifier
            image_data: Binary image data
            
        Returns:
            str: Image file path
        """
        # Determine file extension (default to .jpg)
        extension = ".jpg"
        
        # Create file path
        file_path = self.storage_path / f"{image_id}{extension}"
        
        # Save image
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(image_data)
        
        return str(file_path)
    
    async def get_image(self, image_id: str) -> Optional[bytes]:
        """
        Get image from storage by ID
        
        Args:
            image_id: Image identifier
            
        Returns:
            Optional[bytes]: Image data or None if not found
        """
        # Try common extensions
        for ext in ['.jpg', '.jpeg', '.png']:
            file_path = self.storage_path / f"{image_id}{ext}"
            if file_path.exists():
                async with aiofiles.open(file_path, 'rb') as f:
                    return await f.read()
        
        return None
    
    async def delete_image(self, image_id: str) -> bool:
        """
        Delete image from storage
        
        Args:
            image_id: Image identifier
            
        Returns:
            bool: True if deleted, False if not found
        """
        for ext in ['.jpg', '.jpeg', '.png']:
            file_path = self.storage_path / f"{image_id}{ext}"
            if file_path.exists():
                os.remove(file_path)
                return True
        return False
    
    def get_image_path(self, image_id: str) -> Optional[Path]:
        """
        Get image file path if exists
        
        Args:
            image_id: Image identifier
            
        Returns:
            Optional[Path]: File path or None if not found
        """
        for ext in ['.jpg', '.jpeg', '.png']:
            file_path = self.storage_path / f"{image_id}{ext}"
            if file_path.exists():
                return file_path
        return None
    
    async def fetch_image_from_camera(self, camera_url: str, timeout: int = 10) -> Optional[bytes]:
        """
        Fetch image from IP camera URL
        
        Args:
            camera_url: Camera URL (e.g., http://admin:password@192.168.1.235/ISAPI/Streaming/channels/101/picture)
            timeout: Request timeout in seconds
            
        Returns:
            Optional[bytes]: Image data or None if fetch fails
        """
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(camera_url)
                response.raise_for_status()
                
                # Check if response is actually an image
                content_type = response.headers.get("content-type", "")
                if not content_type.startswith("image/"):
                    logger.warning(f"Camera response is not an image. Content-Type: {content_type}")
                    # Still try to return the data as it might be an image without proper headers
                
                logger.info(f"Successfully fetched image from camera: {camera_url}, size: {len(response.content)} bytes")
                return response.content
                
        except httpx.TimeoutException:
            logger.error(f"Timeout while fetching image from camera: {camera_url}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error while fetching image from camera: {camera_url}, status: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Error fetching image from camera: {camera_url}, error: {str(e)}", exc_info=True)
            return None
    
    async def fetch_and_save_camera_image(self, image_id: str, camera_url: str) -> Optional[str]:
        """
        Fetch image from camera and save it to storage
        
        Args:
            image_id: Unique image identifier
            camera_url: Camera URL to fetch from
            
        Returns:
            Optional[str]: Saved image file path or None if fetch/save fails
        """
        # Fetch image from camera
        image_data = await self.fetch_image_from_camera(camera_url)
        
        if not image_data:
            logger.error(f"Failed to fetch image from camera: {camera_url}")
            return None
        
        # Save image
        try:
            file_path = await self.save_image(image_id, image_data)
            logger.info(f"Successfully saved camera image: {file_path}")
            return file_path
        except Exception as e:
            logger.error(f"Error saving camera image: {str(e)}", exc_info=True)
            return None
    
    async def fetch_and_save_image_for_point(self, image_id: str, point: str) -> Optional[str]:
        """
        Fetch image from camera for a specific patrol point and save it to storage
        
        Args:
            image_id: Unique image identifier
            point: Patrol point identifier
            
        Returns:
            Optional[str]: Saved image file path or None if fetch/save fails or no camera configured
        """
        camera_url = self.get_camera_url(point)
        if not camera_url:
            logger.debug(f"No camera URL configured for point {point}")
            return None
        
        return await self.fetch_and_save_camera_image(image_id, camera_url)

