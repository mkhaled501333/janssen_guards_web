"""Script to create the MySQL database"""

import pymysql
import sys

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'Admin@1234',  # Your MySQL root password
    'charset': 'utf8mb4'
}

DB_NAME = 'janssen_guard'

def create_database():
    """Create the database if it doesn't exist"""
    try:
        # Connect to MySQL server (without specifying database)
        connection = pymysql.connect(**DB_CONFIG)
        
        with connection.cursor() as cursor:
            # Create database
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            connection.commit()
            
            print(f"✅ Database '{DB_NAME}' created successfully!")
            
            # Verify database exists
            cursor.execute("SHOW DATABASES LIKE %s", (DB_NAME,))
            result = cursor.fetchone()
            
            if result:
                print(f"✅ Verified: Database '{DB_NAME}' exists")
            else:
                print(f"❌ Warning: Could not verify database creation")
                
    except pymysql.Error as e:
        print(f"❌ Error creating database: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    print(f"Creating database '{DB_NAME}'...")
    create_database()
    print("\n✅ Done! You can now run migrations:")
    print("   alembic upgrade head")

