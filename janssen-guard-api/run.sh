#!/bin/bash
# Quick start script for development

echo "🚀 Starting Janssen Guard API..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Check if database exists
echo "🔍 Checking database..."
if ! psql -lqt | cut -d \| -f 1 | grep -qw janssen_guard 2>/dev/null; then
    echo "⚠️  Database 'janssen_guard' not found. Please create it first:"
    echo "   createdb janssen_guard"
    echo "   or: psql -U postgres -c 'CREATE DATABASE janssen_guard;'"
    exit 1
fi

# Run migrations
echo "🔄 Running database migrations..."
alembic upgrade head

# Create test user if needed
echo "👤 Creating test user..."
python create_test_user.py

# Create storage directory
mkdir -p storage/images

# Start server
echo "✅ Starting server at http://localhost:8000"
echo "📚 API docs available at http://localhost:8000/docs"
echo ""
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

