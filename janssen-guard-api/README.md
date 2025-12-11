# Janssen Guard API

A robust FastAPI backend service for the Janssen Guard security patrol management system.

## Features

- 🔐 **Authentication**: User authentication with JWT support
- 📝 **Patrol Records**: Create and retrieve patrol scan records
- 🖼️ **Image Storage**: Store and retrieve patrol images
- 📊 **Reporting**: Generate statistics and reports
- 🔍 **Filtering & Pagination**: Advanced query capabilities
- 🏥 **Health Monitoring**: System health check endpoints
- 📚 **Auto Documentation**: OpenAPI/Swagger documentation

## Tech Stack

- **Framework**: FastAPI 0.104+
- **Language**: Python 3.11+
- **Database**: MySQL 8.0+ (port 3306)
- **ORM**: SQLAlchemy 2.0+ (async)
- **Validation**: Pydantic v2
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt (passlib)
- **Migrations**: Alembic

## Project Structure

```
janssen-guard-api/
├── app/
│   ├── api/v1/              # API routes
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── patrol.py        # Patrol records endpoints
│   │   └── health.py        # Health check endpoint
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py
│   │   └── patrol_record.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── user.py
│   │   ├── patrol_record.py
│   │   └── response.py
│   ├── services/            # Business logic
│   │   ├── auth_service.py
│   │   ├── patrol_service.py
│   │   ├── image_service.py
│   │   └── report_service.py
│   ├── repositories/        # Data access layer
│   │   ├── base_repository.py
│   │   ├── user_repository.py
│   │   └── patrol_repository.py
│   ├── utils/               # Utilities
│   │   └── security.py
│   ├── config.py            # Configuration
│   ├── database.py          # Database setup
│   └── main.py              # FastAPI app
├── alembic/                 # Database migrations
├── storage/                 # File storage
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Installation

### Option 1: Local Development

1. **Clone the repository**
```bash
cd janssen-guard-api
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

5. **Setup database**
```bash
# Make sure MySQL is running
# Create database: janssen_guard
# See MYSQL_SETUP.md for detailed instructions

# Run migrations
alembic upgrade head
```

6. **Run the application**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Option 2: Docker

1. **Build and run with Docker Compose**
```bash
docker-compose up -d
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication

- `GET /users?username={username}&password={password}` - Legacy login
- `POST /api/v1/auth/login` - Modern login endpoint

### Patrol Records

- `POST /industerialsecurity` - Create patrol record
- `GET /industerialsecurity` - Get patrol records (with pagination & filters)
- `GET /industerialsecurity?imageid={imageid}` - Get patrol image

### Health Check

- `GET /health` - System health status

### Documentation

- `GET /docs` - Swagger UI
- `GET /redoc` - ReDoc documentation

## Usage Examples

### Login (Legacy)
```bash
curl "http://localhost:8000/users?username=john@janssen.com&password=password123"
```

### Login (Modern)
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "john@janssen.com", "password": "password123"}'
```

### Create Patrol Record
```bash
curl -X POST "http://localhost:8000/industerialsecurity" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "point": "5",
    "guardname": "John Doe",
    "time": "1705320000",
    "servertime": "1705320005",
    "imageid": "IMG_1705320000_1234",
    "note": "Routine patrol check"
  }'
```

### Get Patrol Records
```bash
curl "http://localhost:8000/industerialsecurity?page=1&limit=20&point=5"
```

### Health Check
```bash
curl "http://localhost:8000/health"
```

## Configuration

Configuration is managed through environment variables. See `.env.example` for all available options.

Key settings:
- `DATABASE_URL`: MySQL connection string (format: `mysql+aiomysql://user:pass@host:3306/db`)
- `SECRET_KEY`: JWT secret key (change in production!)
- `IMAGE_STORAGE_PATH`: Path for storing images
- `ALLOWED_ORIGINS`: CORS allowed origins

See [MYSQL_SETUP.md](MYSQL_SETUP.md) for detailed MySQL configuration.

## Database Migrations

Create a new migration:
```bash
alembic revision --autogenerate -m "Description"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback migration:
```bash
alembic downgrade -1
```

## Creating a Test User

You can create a test user using Python:

```python
from app.database import AsyncSessionLocal
from app.models.user import User
from app.utils.security import get_password_hash
import asyncio

async def create_user():
    async with AsyncSessionLocal() as session:
        user = User(
            user_id=1,
            guard_name="John Doe",
            email="john@janssen.com",
            password_hash=get_password_hash("password123"),
            uid="uid_john_doe",
            permissions=["scan", "view_logs"],
            is_active=True
        )
        session.add(user)
        await session.commit()
        print("User created successfully!")

asyncio.run(create_user())
```

## Testing

Run tests:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=app tests/
```

## Development

The API includes:
- Automatic request/response validation
- Comprehensive error handling
- CORS middleware for frontend integration
- GZip compression
- Health monitoring
- Auto-generated OpenAPI documentation

## Production Deployment

1. Set strong `SECRET_KEY` in production
2. Use production database credentials
3. Enable HTTPS
4. Configure proper CORS origins
5. Set up proper logging
6. Use process manager (Gunicorn/Uvicorn workers)
7. Set up monitoring and alerting

Example production run:
```bash
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## License

Copyright © 2025 Janssen

## Support

For issues and questions, please contact the development team.

