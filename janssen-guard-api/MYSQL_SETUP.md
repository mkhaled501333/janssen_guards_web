# MySQL Database Configuration

The Janssen Guard API is configured to use **MySQL 8.0** on port **3306**.

## Database Connection

The application uses the following connection format:
```
mysql+aiomysql://username:password@host:3306/database_name
```

## Configuration Changes from PostgreSQL

### 1. Database Driver
- **Changed from**: `asyncpg` (PostgreSQL)
- **Changed to**: `aiomysql` (MySQL)

### 2. Connection String Format
- **PostgreSQL**: `postgresql+asyncpg://user:pass@host:5432/db`
- **MySQL**: `mysql+aiomysql://user:pass@host:3306/db`

### 3. Data Type Changes

#### User Model - Permissions Field
- **PostgreSQL**: `ARRAY(String)` - Native array type
- **MySQL**: `JSON` - JSON column type (stores array as JSON)

#### Patrol Record Model - ID Field
- **PostgreSQL**: `UUID` - Native UUID type
- **MySQL**: `CHAR(36)` - String representation of UUID

## Environment Variables

Update your `.env` file:

```env
DATABASE_URL=mysql+aiomysql://janssen:password@localhost:3306/janssen_guard
```

## Docker Setup

The `docker-compose.yml` is configured for MySQL:

```yaml
db:
  image: mysql:8.0
  environment:
    - MYSQL_ROOT_PASSWORD=rootpassword
    - MYSQL_USER=janssen
    - MYSQL_PASSWORD=password
    - MYSQL_DATABASE=janssen_guard
  ports:
    - "3306:3306"
```

## Local MySQL Setup

### 1. Install MySQL

**Windows:**
- Download from https://dev.mysql.com/downloads/installer/

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 2. Create Database

```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE janssen_guard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'janssen'@'localhost' IDENTIFIED BY 'password';

-- Grant privileges
GRANT ALL PRIVILEGES ON janssen_guard.* TO 'janssen'@'localhost';
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

### 3. Verify Connection

```bash
mysql -u janssen -p -h localhost -P 3306 janssen_guard
```

## Running Migrations

After setting up MySQL, run migrations:

```bash
alembic upgrade head
```

## Testing Connection

You can test the database connection using the health endpoint:

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

## Common Issues

### 1. Authentication Plugin Error

**Error**: `Authentication plugin 'caching_sha2_password' cannot be loaded`

**Solution**: Use `mysql_native_password` authentication:

```sql
ALTER USER 'janssen'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```

Or in docker-compose.yml, add:
```yaml
command: --default-authentication-plugin=mysql_native_password
```

### 2. Connection Refused

**Error**: `Can't connect to MySQL server`

**Solutions**:
- Check if MySQL is running: `sudo systemctl status mysql`
- Verify port 3306 is open
- Check firewall settings
- Verify host in DATABASE_URL (use `localhost` or `127.0.0.1`)

### 3. Character Set Issues

**Error**: `Incorrect string value`

**Solution**: Ensure database uses utf8mb4:

```sql
ALTER DATABASE janssen_guard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Permission Denied

**Error**: `Access denied for user`

**Solutions**:
- Verify username and password
- Check user privileges: `SHOW GRANTS FOR 'janssen'@'localhost';`
- Grant privileges: `GRANT ALL PRIVILEGES ON janssen_guard.* TO 'janssen'@'localhost';`

## MySQL-Specific Features

### JSON Column (Permissions)

The `permissions` field in the `users` table uses JSON type:

```python
# Stored as JSON array
permissions = ["scan", "view_logs"]

# Query example
SELECT permissions FROM users WHERE user_id = 1;
# Returns: ["scan", "view_logs"]
```

### UUID as String

The `id` field in `patrol_records` is stored as CHAR(36):

```python
# Generated as string UUID
id = "550e8400-e29b-41d4-a716-446655440000"

# Query example
SELECT * FROM patrol_records WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

## Performance Tips

1. **Indexes**: All frequently queried fields are indexed
2. **Connection Pooling**: Configured in `database.py` (pool_size=10, max_overflow=20)
3. **Character Set**: Use utf8mb4 for full Unicode support
4. **InnoDB**: Default storage engine (supports transactions)

## Backup and Restore

### Backup
```bash
mysqldump -u janssen -p janssen_guard > backup.sql
```

### Restore
```bash
mysql -u janssen -p janssen_guard < backup.sql
```

## Migration from PostgreSQL

If migrating from PostgreSQL:

1. Export data from PostgreSQL
2. Convert data types:
   - ARRAY → JSON array
   - UUID → CHAR(36) string
3. Import to MySQL
4. Update application configuration
5. Run migrations

---

**Database**: MySQL 8.0  
**Port**: 3306  
**Driver**: aiomysql  
**Connection**: Async with connection pooling

