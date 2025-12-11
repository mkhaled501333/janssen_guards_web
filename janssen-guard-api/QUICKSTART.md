# Quick Start Guide

## Option 1: Docker (Recommended)

The fastest way to get started:

```bash
cd janssen-guard-api
docker-compose up -d
```

This will:
- Start PostgreSQL database
- Build and run the FastAPI application
- Expose the API at http://localhost:8000

## Option 2: Local Development

### Prerequisites
- Python 3.11+
- PostgreSQL 14+

### Steps

1. **Install dependencies**
```bash
cd janssen-guard-api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Setup database**
```bash
# Create PostgreSQL database
createdb janssen_guard

# Or using psql:
# psql -U postgres -c "CREATE DATABASE janssen_guard;"
```

3. **Configure environment**
```bash
# Create .env file (or set environment variables)
echo "DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/janssen_guard" > .env
echo "SECRET_KEY=your-secret-key-change-in-production" >> .env
echo "IMAGE_STORAGE_PATH=./storage/images" >> .env
```

4. **Run migrations**
```bash
alembic upgrade head
```

5. **Create test user**
```bash
python create_test_user.py
```

6. **Start the server**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Verify Installation

1. **Check health endpoint**
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T14:30:00",
  "database": "connected",
  "storage": "available",
  "version": "1.0.0"
}
```

2. **View API documentation**

Open in browser:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

3. **Test login**
```bash
curl "http://localhost:8000/users?username=john@janssen.com&password=password123"
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check the [BACKEND_FASTAPI_REQUIREMENTS.md](../BACKEND_FASTAPI_REQUIREMENTS.md) for API specifications
- Explore the API at http://localhost:8000/docs

## Troubleshooting

### Database connection error
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Verify database exists: `psql -l`

### Port already in use
Change the port in docker-compose.yml or when running uvicorn:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8081
```

### Import errors
Make sure you're in the virtual environment:
```bash
source venv/bin/activate  # Windows: venv\Scripts\activate
```

## Default Credentials

After running `create_test_user.py`:
- **Email**: john@janssen.com
- **Password**: password123
- **Guard Name**: John Doe

