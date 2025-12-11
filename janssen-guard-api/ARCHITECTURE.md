# Janssen Guard API - Architecture Documentation

## System Overview

The Janssen Guard API is a RESTful backend service built with FastAPI, following a clean layered architecture pattern for maintainability and scalability.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Routes)                      │
│  - HTTP Request/Response handling                            │
│  - Route definitions and endpoint documentation              │
│  - Request validation (Pydantic)                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer (Business Logic)             │
│  - Authentication logic                                      │
│  - Patrol record processing                                  │
│  - Image handling                                            │
│  - Report generation                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Repository Layer (Data Access)                  │
│  - CRUD operations                                           │
│  - Query building                                            │
│  - Pagination and filtering                                  │
│  - Transaction management                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Models Layer (ORM)                          │
│  - SQLAlchemy models                                         │
│  - Database schema definition                                │
│  - Relationships                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  - PostgreSQL 14+                                            │
│  - Connection pooling                                        │
│  - Async operations                                          │
└─────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

### Example: Create Patrol Record

```
┌────────┐
│ Client │
└───┬────┘
    │ POST /industerialsecurity
    ▼
┌────────────────────────────────────┐
│ API Route (patrol.py)              │
│ - Validate request body            │
│ - Extract data                     │
└───────────┬────────────────────────┘
            │
            ▼
┌────────────────────────────────────┐
│ Patrol Service                     │
│ - Convert timestamps               │
│ - Business validation              │
└───────────┬────────────────────────┘
            │
            ▼
┌────────────────────────────────────┐
│ Patrol Repository                  │
│ - Create database record           │
│ - Commit transaction               │
└───────────┬────────────────────────┘
            │
            ▼
┌────────────────────────────────────┐
│ Database (PostgreSQL)              │
│ - Insert into patrol_records       │
│ - Return created record            │
└───────────┬────────────────────────┘
            │
            ▼ (Response bubbles back up)
┌────────┐
│ Client │ ← PatrolRecordResponse
└────────┘
```

## Directory Structure Details

### `/app/api/` - API Layer

**Purpose**: Define HTTP endpoints and handle requests/responses

**Files**:
- `v1/auth.py` - Authentication endpoints
  - `POST /api/v1/auth/login` - Modern login
  - `GET /users` - Legacy login
  
- `v1/patrol.py` - Patrol management
  - `POST /industerialsecurity` - Create patrol record
  - `GET /industerialsecurity` - List/filter records or get image
  
- `v1/health.py` - System monitoring
  - `GET /health` - Health check

**Key Features**:
- FastAPI dependency injection for database sessions
- Automatic OpenAPI documentation
- Request/response validation
- Error handling with HTTPException

### `/app/services/` - Service Layer

**Purpose**: Implement business logic independent of HTTP layer

**Files**:
- `auth_service.py` - Authentication operations
  - User authentication
  - Password verification
  - JWT token generation/validation
  
- `patrol_service.py` - Patrol operations
  - Create patrol records
  - Query and filter records
  - Coordinate with image service
  
- `image_service.py` - File storage
  - Save images to filesystem
  - Retrieve images by ID
  - Delete images
  
- `report_service.py` - Analytics
  - Generate statistics
  - Point distribution
  - Guard distribution

**Benefits**:
- Reusable business logic
- Easy to test
- Independent of HTTP layer
- Can be used by background jobs, CLI, etc.

### `/app/repositories/` - Repository Layer

**Purpose**: Abstract database operations

**Files**:
- `base_repository.py` - Generic CRUD operations
  - `get_by_id()` - Get single record
  - `get_all()` - Get all with filters
  - `get_paginated()` - Paginated queries
  - `create()` - Insert record
  - `update()` - Update record
  - `delete()` - Delete record
  
- `user_repository.py` - User-specific queries
  - `get_by_email()`
  - `get_by_guard_name()`
  - `get_by_uid()`
  
- `patrol_repository.py` - Patrol-specific queries
  - Inherits from BaseRepository

**Benefits**:
- DRY (Don't Repeat Yourself)
- Consistent query patterns
- Easy to add caching
- Testable in isolation

### `/app/models/` - Model Layer

**Purpose**: Define database schema using SQLAlchemy ORM

**Files**:
- `user.py` - User model
  - Authentication data
  - Permissions
  - Profile information
  
- `patrol_record.py` - Patrol record model
  - Patrol point data
  - Timestamps
  - Image references
  - Notes

**Features**:
- Automatic table creation
- Relationship management
- Type safety
- Migration support via Alembic

### `/app/schemas/` - Schema Layer

**Purpose**: Validate and serialize data using Pydantic

**Files**:
- `user.py` - User schemas
  - UserCreate, UserUpdate, UserResponse
  - UserLogin, UserLoginResponse
  
- `patrol_record.py` - Patrol schemas
  - PatrolRecordCreate, PatrolRecordResponse
  - PatrolRecordFilter, PatrolRecordsResponse
  
- `response.py` - Generic responses
  - SuccessResponse, ErrorResponse
  - HealthResponse

**Benefits**:
- Automatic validation
- Type conversion
- API documentation
- Serialization/deserialization

## Data Flow Diagrams

### Authentication Flow

```
┌────────┐                                           ┌──────────┐
│ Client │                                           │ Database │
└───┬────┘                                           └─────┬────┘
    │                                                      │
    │ 1. POST /api/v1/auth/login                          │
    │    {username, password}                              │
    ├────────────────────────────────────────────────►    │
    │                                                      │
    │                 2. Query user by email/name          │
    │                 ◄────────────────────────────────────┤
    │                                                      │
    │                 3. Return user record                │
    │                 ├──────────────────────────────────► │
    │                                                      │
    │ 4. Verify password (bcrypt)                         │
    │    ├────────────────────►                           │
    │                                                      │
    │ 5. Return UserLoginResponse                          │
    │ ◄────────────────────────────────────────────────   │
    │                                                      │
```

### Patrol Record Creation Flow

```
┌────────┐          ┌─────────┐          ┌──────────┐          ┌──────────┐
│ Client │          │ Service │          │Repository│          │ Database │
└───┬────┘          └────┬────┘          └────┬─────┘          └────┬─────┘
    │                    │                     │                     │
    │ POST /industerialsecurity                │                     │
    ├───────────────────►│                     │                     │
    │                    │                     │                     │
    │                    │ Validate & convert  │                     │
    │                    │ timestamps          │                     │
    │                    ├──────►              │                     │
    │                    │                     │                     │
    │                    │ create()            │                     │
    │                    ├────────────────────►│                     │
    │                    │                     │                     │
    │                    │                     │ INSERT INTO         │
    │                    │                     │ patrol_records      │
    │                    │                     ├────────────────────►│
    │                    │                     │                     │
    │                    │                     │ Return record       │
    │                    │                     │◄────────────────────┤
    │                    │                     │                     │
    │                    │ PatrolRecord        │                     │
    │                    │◄────────────────────┤                     │
    │                    │                     │                     │
    │ PatrolRecordResponse                     │                     │
    │◄───────────────────┤                     │                     │
    │                    │                     │                     │
```

### Image Retrieval Flow

```
┌────────┐          ┌──────────────┐          ┌────────────┐
│ Client │          │Image Service │          │ Filesystem │
└───┬────┘          └──────┬───────┘          └─────┬──────┘
    │                      │                        │
    │ GET /industerialsecurity?imageid=IMG_001      │
    ├─────────────────────►│                        │
    │                      │                        │
    │                      │ get_image(IMG_001)     │
    │                      ├───────────────────────►│
    │                      │                        │
    │                      │ Try .jpg, .jpeg, .png  │
    │                      │◄───────────────────────┤
    │                      │                        │
    │                      │ Read file content      │
    │                      │◄───────────────────────┤
    │                      │                        │
    │ Return image bytes   │                        │
    │◄─────────────────────┤                        │
    │ Content-Type: image/jpeg                      │
    │                      │                        │
```

## Database Schema

### Users Table

```
┌─────────────────────────────────────────────┐
│                   users                      │
├──────────────┬──────────────────────────────┤
│ id           │ SERIAL PRIMARY KEY           │
│ user_id      │ INTEGER UNIQUE NOT NULL      │
│ guard_name   │ VARCHAR(100) NOT NULL        │
│ email        │ VARCHAR(255) UNIQUE NOT NULL │
│ password_hash│ VARCHAR(255) NOT NULL        │
│ uid          │ VARCHAR(100) UNIQUE NOT NULL │
│ permissions  │ TEXT[]                       │
│ is_active    │ BOOLEAN DEFAULT TRUE         │
│ created_at   │ TIMESTAMP                    │
│ updated_at   │ TIMESTAMP                    │
└──────────────┴──────────────────────────────┘
      │
      │ Indexes:
      ├─ idx_users_email (email)
      ├─ idx_users_guard_name (guard_name)
      └─ idx_users_uid (uid)
```

### Patrol Records Table

```
┌─────────────────────────────────────────────┐
│              patrol_records                  │
├──────────────┬──────────────────────────────┤
│ id           │ UUID PRIMARY KEY             │
│ point        │ VARCHAR(10) NOT NULL         │
│ guard_name   │ VARCHAR(100) NOT NULL        │
│ user_id      │ INTEGER FK → users.user_id   │
│ time         │ BIGINT NOT NULL              │
│ server_time  │ BIGINT NOT NULL              │
│ image_id     │ VARCHAR(100) NOT NULL        │
│ note         │ TEXT                         │
│ created_at   │ TIMESTAMP                    │
│ updated_at   │ TIMESTAMP                    │
└──────────────┴──────────────────────────────┘
      │
      │ Indexes:
      ├─ idx_patrol_point (point)
      ├─ idx_patrol_guard_name (guard_name)
      ├─ idx_patrol_time (time)
      ├─ idx_patrol_server_time (server_time)
      ├─ idx_patrol_image_id (image_id)
      ├─ idx_patrol_created_at (created_at)
      ├─ idx_patrol_point_time (point, time)
      └─ idx_patrol_guard_time (guard_name, time)
```

## Technology Stack

```
┌─────────────────────────────────────────────────┐
│              Application Layer                   │
│  FastAPI 0.104 + Uvicorn 0.24                   │
│  - Async request handling                        │
│  - Automatic API documentation                   │
│  - Request/response validation                   │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│           Validation Layer                       │
│  Pydantic 2.5                                    │
│  - Type validation                               │
│  - Data serialization                            │
│  - Schema generation                             │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│              ORM Layer                           │
│  SQLAlchemy 2.0 (Async)                         │
│  - Object-relational mapping                     │
│  - Query building                                │
│  - Connection pooling                            │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│           Database Driver                        │
│  asyncpg 0.29                                    │
│  - Async PostgreSQL driver                       │
│  - High performance                              │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│             Database                             │
│  PostgreSQL 14+                                  │
│  - ACID compliance                               │
│  - Advanced indexing                             │
│  - JSON support                                  │
└──────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────┐
│           Security Layers                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. Input Validation                             │
│     └─ Pydantic schemas                          │
│     └─ Type checking                             │
│     └─ Field constraints                         │
│                                                  │
│  2. Authentication                               │
│     └─ Password hashing (bcrypt)                 │
│     └─ JWT tokens (python-jose)                  │
│     └─ Session management                        │
│                                                  │
│  3. Authorization                                │
│     └─ User permissions array                    │
│     └─ Role-based access (future)                │
│                                                  │
│  4. Database Security                            │
│     └─ Parameterized queries (SQLAlchemy)        │
│     └─ SQL injection prevention                  │
│     └─ Connection pooling                        │
│                                                  │
│  5. Network Security                             │
│     └─ CORS configuration                        │
│     └─ HTTPS support                             │
│     └─ Rate limiting (optional)                  │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Deployment Architecture

### Docker Deployment

```
┌──────────────────────────────────────────────────────┐
│                    Docker Host                        │
│                                                       │
│  ┌────────────────────┐    ┌───────────────────┐   │
│  │   API Container    │    │  DB Container     │   │
│  │                    │    │                   │   │
│  │  FastAPI App       │◄───┤  PostgreSQL 14    │   │
│  │  Port: 8000        │    │  Port: 5432       │   │
│  │  Storage: /app/storage  │  Volume: postgres_data│
│  └────────────────────┘    └───────────────────┘   │
│           │                                          │
│           └──────────────► Volume: ./storage        │
│                                                      │
└─────────────┬────────────────────────────────────────┘
              │
              │ Port 8000
              ▼
         ┌─────────┐
         │ Client  │
         └─────────┘
```

### Production Deployment (Recommended)

```
                    ┌──────────────┐
                    │   Load       │
                    │   Balancer   │
                    │   (Nginx)    │
                    └───────┬──────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
     ┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
     │  Uvicorn    │ │  Uvicorn   │ │  Uvicorn   │
     │  Worker 1   │ │  Worker 2  │ │  Worker 3  │
     └──────┬──────┘ └─────┬──────┘ └─────┬──────┘
            │               │               │
            └───────────────┼───────────────┘
                            │
                     ┌──────▼──────┐
                     │  PostgreSQL  │
                     │   (Primary)  │
                     └──────┬──────┘
                            │
                     ┌──────▼──────┐
                     │  PostgreSQL  │
                     │  (Replica)   │
                     └─────────────┘
```

## Performance Considerations

1. **Connection Pooling**
   - Pool size: 10
   - Max overflow: 20
   - Pre-ping enabled

2. **Database Indexing**
   - Primary keys (id)
   - Frequently queried fields (point, guard_name, time)
   - Composite indexes for common queries

3. **Async Operations**
   - Async database queries
   - Async file I/O
   - Non-blocking request handling

4. **Caching Strategy** (Optional)
   - Redis for session data
   - In-memory caching for static data
   - CDN for images

## Scalability

The architecture supports horizontal scaling:

1. **Stateless API**: Each request is independent
2. **Database Pooling**: Handles multiple workers
3. **Shared Storage**: Can use S3 instead of local filesystem
4. **Docker Ready**: Easy to replicate containers
5. **Load Balancing**: Nginx/HAProxy support

## Monitoring Points

1. **Health Endpoint**: `/health`
   - Database connectivity
   - Storage availability
   - System timestamp

2. **Logging**
   - Request/response logging
   - Error tracking
   - Performance metrics

3. **Metrics** (Future)
   - Request rate
   - Response time
   - Database query performance
   - Error rates

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Architecture Style**: Layered / Clean Architecture  
**Pattern**: Repository Pattern + Service Layer

