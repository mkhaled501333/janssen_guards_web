# Installation Guide

Complete installation instructions for the Janssen Guard API backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Installation (Recommended)](#docker-installation)
3. [Local Installation](#local-installation)
4. [Database Setup](#database-setup)
5. [Configuration](#configuration)
6. [Running the Application](#running-the-application)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### For Docker Installation
- Docker 20.10+
- Docker Compose 2.0+

### For Local Installation
- Python 3.11 or higher
- PostgreSQL 14 or higher
- pip (Python package manager)
- git

## Docker Installation

Docker is the **recommended** way to run the application as it handles all dependencies automatically.

### Step 1: Clone or Navigate to Project

```bash
cd janssen-guard-api
```

### Step 2: Start Services

```bash
docker-compose up -d
```

This command will:
- Pull PostgreSQL 14 image
- Build the FastAPI application
- Create necessary volumes
- Start both services
- Expose API on port 8000

### Step 3: Verify

```bash
# Check if services are running
docker-compose ps

# Check logs
docker-compose logs -f api
```

### Step 4: Access the API

- API: http://localhost:8000
- Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### Useful Docker Commands

```bash
# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up -d --build

# Access database
docker-compose exec db psql -U janssen -d janssen_guard
```

## Local Installation

### Step 1: Install Python

**Windows:**
- Download from https://www.python.org/downloads/
- Run installer and check "Add Python to PATH"

**macOS:**
```bash
brew install python@3.11
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip
```

### Step 2: Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Run installer and note the password you set

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 3: Create Virtual Environment

```bash
cd janssen-guard-api
python -m venv venv
```

**Activate virtual environment:**

Windows:
```bash
venv\Scripts\activate
```

macOS/Linux:
```bash
source venv/bin/activate
```

### Step 4: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## Database Setup

### Create Database

**Using psql:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE janssen_guard;

# Create user (optional)
CREATE USER janssen WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE janssen_guard TO janssen;

# Exit
\q
```

**Using command line:**
```bash
# PostgreSQL 14+
createdb -U postgres janssen_guard
```

### Verify Database

```bash
psql -U postgres -l | grep janssen_guard
```

## Configuration

### Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### Edit Configuration

Edit `.env` file with your settings:

```env
# Database - Update with your credentials
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/janssen_guard

# Security - Generate a strong secret key
SECRET_KEY=your-super-secret-key-change-this

# Server
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.225:3000

# Storage
IMAGE_STORAGE_PATH=./storage/images
```

### Generate Secret Key

Python:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Or online: https://www.uuidgenerator.net/

## Running the Application

### Apply Database Migrations

```bash
alembic upgrade head
```

This creates all necessary database tables.

### Create Test User (Optional)

```bash
python create_test_user.py
```

Creates a user with:
- Email: john@janssen.com
- Password: password123

### Start the Server

**Development mode (with auto-reload):**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Production mode:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Using scripts:**

Linux/macOS:
```bash
chmod +x run.sh
./run.sh
```

Windows:
```bash
run.bat
```

## Verification

### 1. Check Health Endpoint

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

### 2. Access API Documentation

Open in browser:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3. Test Authentication

```bash
curl "http://localhost:8000/users?username=john@janssen.com&password=password123"
```

### 4. Test Patrol Record Creation

```bash
curl -X POST "http://localhost:8000/industerialsecurity" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "point": "5",
    "guardname": "John Doe",
    "time": "1705320000",
    "servertime": "1705320005",
    "imageid": "IMG_TEST_001",
    "note": "Test patrol record"
  }'
```

## Troubleshooting

### Database Connection Error

**Error:** `could not connect to server`

**Solutions:**
1. Check if PostgreSQL is running:
   ```bash
   # Linux/macOS
   sudo systemctl status postgresql
   
   # macOS (Homebrew)
   brew services list
   
   # Windows
   # Check Services app for "postgresql" service
   ```

2. Verify DATABASE_URL in `.env`
3. Test connection:
   ```bash
   psql -U postgres -d janssen_guard
   ```

### Port Already in Use

**Error:** `Address already in use`

**Solutions:**
1. Change port in `.env`:
   ```env
   PORT=8081
   ```

2. Or specify when running:
   ```bash
   uvicorn app.main:app --port 8081
   ```

3. Find and kill process using port:
   ```bash
   # Linux/macOS
   lsof -ti:8000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   ```

### Import Errors

**Error:** `ModuleNotFoundError`

**Solutions:**
1. Ensure virtual environment is activated:
   ```bash
   # You should see (venv) in your prompt
   source venv/bin/activate  # Linux/macOS
   venv\Scripts\activate     # Windows
   ```

2. Reinstall dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Migration Errors

**Error:** `alembic.util.exc.CommandError`

**Solutions:**
1. Check database exists
2. Verify DATABASE_URL in `.env`
3. Reset migrations:
   ```bash
   alembic downgrade base
   alembic upgrade head
   ```

### Permission Denied (Linux/macOS)

**Error:** `Permission denied: './run.sh'`

**Solution:**
```bash
chmod +x run.sh
```

### Storage Directory Error

**Error:** `FileNotFoundError: storage/images`

**Solution:**
```bash
mkdir -p storage/images
```

## Production Deployment

For production deployment, see:
- Use strong SECRET_KEY
- Set DEBUG=False
- Use production database
- Enable HTTPS
- Configure proper CORS origins
- Set up monitoring
- Use process manager (Gunicorn)

Example production command:
```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

## Next Steps

1. Read [README.md](README.md) for API usage
2. Check [QUICKSTART.md](QUICKSTART.md) for quick commands
3. Review API documentation at http://localhost:8000/docs
4. Start integrating with your frontend application

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the logs: `docker-compose logs` or console output
3. Contact the development team

