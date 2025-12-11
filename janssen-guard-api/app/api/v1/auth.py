"""Authentication API routes"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserLogin, UserLoginResponse
from app.services.auth_service import AuthService
from app.repositories.user_repository import UserRepository

router = APIRouter()
legacy_router = APIRouter()


# Modern login endpoint
@router.post("/login", response_model=UserLoginResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user with username and password
    Returns user data if successful
    
    Args:
        credentials: Login credentials (username and password)
        db: Database session
        
    Returns:
        UserLoginResponse: User data
        
    Raises:
        HTTPException: 401 if credentials are invalid
    """
    user_repo = UserRepository(User, db)
    auth_service = AuthService(user_repo)
    
    user = await auth_service.authenticate_user(credentials)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )
    
    return user


# Legacy login endpoint (query parameters)
@legacy_router.get("/users")
async def legacy_login(
    username: str = Query(..., description="User username"),
    password: str = Query(..., description="User password"),
    db: AsyncSession = Depends(get_db)
):
    """
    Legacy authentication endpoint using query parameters
    Supports both JSON and string response formats
    
    Args:
        username: User username
        password: User password
        db: Database session
        
    Returns:
        UserLoginResponse: User data
        
    Raises:
        HTTPException: 401 if credentials are invalid
    """
    user_repo = UserRepository(User, db)
    auth_service = AuthService(user_repo)
    
    credentials = UserLogin(username=username, password=password)
    user = await auth_service.authenticate_user(credentials)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )
    
    # Return in legacy format (can also return string representation)
    return user

