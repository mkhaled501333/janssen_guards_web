"""Authentication service for user authentication and JWT tokens"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserLogin, UserLoginResponse
from app.config import settings


class AuthService:
    """Service for handling authentication operations"""
    
    def __init__(self, user_repo: UserRepository):
        """
        Initialize auth service
        
        Args:
            user_repo: User repository instance
        """
        self.user_repo = user_repo
    
    async def authenticate_user(self, credentials: UserLogin) -> Optional[UserLoginResponse]:
        """
        Authenticate user with username and password
        
        Args:
            credentials: Login credentials (username and password)
            
        Returns:
            Optional[UserLoginResponse]: User data if successful, None if failed
        """
        # Find user by username
        user = await self.user_repo.get_by_username(credentials.username)
        
        if not user or not user.is_active:
            return None
        
        # Verify plain text password
        if user.password != credentials.password:
            return None
        
        # Ensure permissions is always a list
        # Handle cases where permissions might be stored as integer, None, or other types
        if user.permissions is None:
            permissions = []
        elif isinstance(user.permissions, list):
            permissions = user.permissions
        elif isinstance(user.permissions, (int, str)):
            # If stored as integer or string, convert to list
            permissions = [str(user.permissions)]
        else:
            # For any other type, try to convert to list
            try:
                permissions = list(user.permissions) if user.permissions else []
            except (TypeError, ValueError):
                permissions = []
        
        # Return user data in legacy format
        return UserLoginResponse(
            userId=user.user_id,
            guardName=user.guard_name,
            uid=user.uid,
            permissions=permissions,
            updatedAt=int(user.updated_at.timestamp() * 1000)  # Milliseconds
        )
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Create JWT access token
        
        Args:
            data: Token payload data
            expires_delta: Token expiration time
            
        Returns:
            str: Encoded JWT token
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "iat": datetime.utcnow()})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    def decode_token(self, token: str) -> Optional[dict]:
        """
        Decode and validate JWT token
        
        Args:
            token: JWT token string
            
        Returns:
            Optional[dict]: Token payload if valid, None if invalid
        """
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError:
            return None

