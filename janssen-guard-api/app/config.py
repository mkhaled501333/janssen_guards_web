"""Application configuration settings"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "Janssen Guard API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Server
    HOST: str = "0.0.0.0"  # 0.0.0.0 allows connections from any network interface
    PORT: int = 8000
    # CORS: Allow all origins for development (supports HTTPS from other machines)
    # For production, set specific origins like: ["https://yourdomain.com", "https://192.168.1.87:443"]
    # Can be set as JSON array: ["http://localhost:3000","https://localhost:443"]
    # Or as comma-separated string: http://localhost:3000,https://localhost:443
    # Store as string to avoid JSON parsing issues in Pydantic Settings
    allowed_origins_str: str = Field(default="*", alias="ALLOWED_ORIGINS")
    
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        """Parse ALLOWED_ORIGINS from JSON array or comma-separated string"""
        value = self.allowed_origins_str.strip()
        # Handle empty string
        if not value:
            return ["*"]
        # Try to parse as JSON first
        if value.startswith('['):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError):
                pass
        # Otherwise, treat as comma-separated string
        origins = [origin.strip() for origin in value.split(',') if origin.strip()]
        return origins if origins else ["*"]
    
    # Database
    # Note: If password contains special characters like @, #, %, etc., they must be URL-encoded
    # @ = %40, # = %23, % = %25, etc.
    DATABASE_URL: str = "mysql+aiomysql://root:Admin%401234@localhost:3306/janssen_guard"
    DATABASE_ECHO: bool = False
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Storage
    IMAGE_STORAGE_PATH: str = "./storage/images"
    MAX_IMAGE_SIZE_MB: int = 10
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 10
    MAX_PAGE_SIZE: int = 100
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

