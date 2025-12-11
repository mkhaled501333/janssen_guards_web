# MySQL Configuration - Changes Summary

## ✅ All Files Updated for MySQL

The application has been successfully configured to use **MySQL 8.0** on port **3306** instead of PostgreSQL.

## Files Modified

### 1. **requirements.txt**
- ❌ Removed: `asyncpg==0.29.0` (PostgreSQL driver)
- ✅ Added: `aiomysql==0.2.0` (MySQL async driver)
- ✅ Added: `pymysql==1.1.0` (MySQL connector)

### 2. **app/config.py**
- Changed default `DATABASE_URL`:
  - From: `postgresql+asyncpg://user:password@localhost:5432/janssen_guard`
  - To: `mysql+aiomysql://user:password@localhost:3306/janssen_guard`

### 3. **app/models/user.py**
- Changed `permissions` field:
  - From: `Column(ARRAY(String), default=list)` (PostgreSQL array)
  - To: `Column(JSON, default=list)` (MySQL JSON)

### 4. **app/models/patrol_record.py**
- Changed `id` field:
  - From: `Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)` (PostgreSQL UUID)
  - To: `Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))` (MySQL CHAR(36))
- Removed PostgreSQL-specific import: `from sqlalchemy.dialects.postgresql import UUID`

### 5. **docker-compose.yml**
- Changed database service:
  - From: `postgres:14` image
  - To: `mysql:8.0` image
- Updated environment variables:
  - From: `POSTGRES_*` variables
  - To: `MYSQL_*` variables
- Changed port mapping:
  - From: `5432:5432` (PostgreSQL)
  - To: `3306:3306` (MySQL)
- Updated DATABASE_URL in API service
- Added MySQL authentication plugin command

### 6. **alembic.ini**
- Changed default connection string:
  - From: `postgresql+asyncpg://janssen:password@localhost:5432/janssen_guard`
  - To: `mysql+aiomysql://janssen:password@localhost:3306/janssen_guard`

### 7. **Dockerfile**
- Changed system dependencies:
  - From: `postgresql-client`
  - To: `default-libmysqlclient-dev` and `pkg-config`

### 8. **README.md**
- Updated database references:
  - From: "PostgreSQL 14+"
  - To: "MySQL 8.0+ (port 3306)"
- Updated setup instructions
- Added reference to MYSQL_SETUP.md

## New Files Created

### 9. **MYSQL_SETUP.md**
- Comprehensive MySQL setup guide
- Connection instructions
- Troubleshooting guide
- Migration notes

## Connection String Format

**MySQL Format:**
```
mysql+aiomysql://username:password@host:3306/database_name
```

**Example:**
```
mysql+aiomysql://janssen:password@localhost:3306/janssen_guard
```

## Data Type Mappings

| PostgreSQL | MySQL | Notes |
|------------|-------|-------|
| `UUID` | `CHAR(36)` | Stored as string |
| `ARRAY(String)` | `JSON` | Stored as JSON array |
| `SERIAL` | `INT AUTO_INCREMENT` | Same behavior |
| `TIMESTAMP` | `TIMESTAMP` | Same behavior |
| `TEXT` | `TEXT` | Same behavior |

## Quick Start with MySQL

### 1. Update .env file:
```env
DATABASE_URL=mysql+aiomysql://janssen:password@localhost:3306/janssen_guard
```

### 2. Create MySQL database:
```sql
CREATE DATABASE janssen_guard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'janssen'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON janssen_guard.* TO 'janssen'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Run migrations:
```bash
alembic upgrade head
```

### 4. Start application:
```bash
uvicorn app.main:app --reload
```

## Docker Quick Start

```bash
docker-compose up -d
```

This will:
- Start MySQL 8.0 on port 3306
- Create database `janssen_guard`
- Create user `janssen` with password `password`
- Start API on port 8000

## Verification

Test the connection:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  ...
}
```

## Important Notes

1. **Character Set**: Database uses `utf8mb4` for full Unicode support
2. **Authentication**: Uses `mysql_native_password` plugin (configured in docker-compose)
3. **UUID Storage**: UUIDs are stored as CHAR(36) strings, not native UUID type
4. **JSON Permissions**: Permissions array is stored as JSON in MySQL
5. **Port**: MySQL uses port 3306 (not 5432 like PostgreSQL)

## No Code Changes Required

✅ All application code remains the same  
✅ Business logic unchanged  
✅ API endpoints unchanged  
✅ Only database layer configuration changed

---

**Status**: ✅ MySQL configuration complete  
**Port**: 3306  
**Driver**: aiomysql  
**Version**: MySQL 8.0+

