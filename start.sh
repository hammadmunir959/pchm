#!/bin/bash

# One-command startup script for PCHM Docker setup

set -e

echo "🚀 Starting PCHM Application..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your values before continuing."
    echo ""
    read -p "Press Enter to continue after editing .env, or Ctrl+C to exit..."
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Detect docker compose command (v2 uses 'docker compose', v1 uses 'docker-compose')
if docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Build and start all services
echo "📦 Building Docker images (this may take a few minutes)..."
$DOCKER_COMPOSE build

echo ""
echo "🚀 Starting all services..."
$DOCKER_COMPOSE up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Wait for database to be ready
echo "⏳ Waiting for database..."
until $DOCKER_COMPOSE exec -T db pg_isready -U postgres > /dev/null 2>&1; do
    echo "   Database not ready yet, waiting..."
    sleep 2
done

echo "✅ Database is ready!"

# Run migrations
echo "📊 Running database migrations..."
$DOCKER_COMPOSE exec -T app python manage.py migrate --noinput

# Collect static files
echo "📁 Collecting static files..."
$DOCKER_COMPOSE exec -T app python manage.py collectstatic --noinput

echo ""
echo "✅ All services are running!"
echo ""
echo "📋 Service Status:"
$DOCKER_COMPOSE ps
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost:8000"
echo "   Admin:    http://localhost:8000/admin"
echo ""
echo "📝 Useful commands:"
echo "   View logs:        $DOCKER_COMPOSE logs -f"
echo "   Stop services:    $DOCKER_COMPOSE down"
echo "   Restart:          $DOCKER_COMPOSE restart"
echo "   Create superuser: $DOCKER_COMPOSE exec app python manage.py createsuperuser"
echo ""

