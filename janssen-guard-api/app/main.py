"""Main FastAPI application"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging
from app.api.v1 import auth, patrol, health
from app.config import settings
from app.database import engine, Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Janssen Guard API",
    description="Security patrol management system API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Global exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Log validation errors for debugging"""
    # Try to get request body if available (may already be consumed)
    body_str = None
    try:
        if hasattr(request, '_body'):
            body_str = request._body.decode('utf-8') if request._body else None
    except:
        pass
    
    logger.error(f"Validation error on {request.method} {request.url}")
    logger.error(f"Request body: {body_str or 'Unable to read (may be consumed)'}")
    logger.error(f"Validation errors: {exc.errors()}")
    
    # Format validation errors for better readability
    error_details = []
    for error in exc.errors():
        field = '.'.join(str(loc) for loc in error.get('loc', []))
        msg = error.get('msg', 'Unknown error')
        error_details.append(f"{field}: {msg}")
    
    logger.error(f"Formatted errors: {'; '.join(error_details)}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()}
    )

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(patrol.router, tags=["Patrol"])
app.include_router(health.router, tags=["Health"])

# Legacy auth endpoint
app.include_router(auth.legacy_router, tags=["Legacy Authentication"])


@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "Janssen Guard API",
        "version": "1.0.0",
        "docs": "/docs"
    }

