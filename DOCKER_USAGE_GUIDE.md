# Docker Image Usage Guide

This guide explains how to pull and use the PCHM Docker image from Docker Hub.

## Prerequisites

- Docker installed and running (version 20.10 or later)
- Docker Compose installed (version 2.0 or later, or use `docker-compose` v1)
- At least 2GB of free disk space
- Port 8000 available on your host machine

## Quick Start (Recommended - Using Docker Compose)

### Step 1: Create a Project Directory

```bash
mkdir pchm-project
cd pchm-project
```

### Step 2: Create Docker Compose File

Create a file named `docker-compose.yml`:

```yaml
services:
  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    container_name: pchm_db
    environment:
      POSTGRES_DB: ${DB_NAME:-pchm_db}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pchm_network
    restart: unless-stopped

  # Redis for Celery
  redis:
    image: redis:7-alpine
    container_name: pchm_redis
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pchm_network
    restart: unless-stopped

  # Main Application
  app:
    image: hammadmunir959/pchm:latest
    container_name: pchm_app
    volumes:
      - ./media:/app/media
      - ./staticfiles:/app/staticfiles
    ports:
      - "8000:8000"
    env_file:
      - .env
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
      - SECURE_SSL_REDIRECT=False
      - SESSION_COOKIE_SECURE=False
      - CSRF_COOKIE_SECURE=False
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - pchm_network
    restart: unless-stopped

  # Celery Worker
  celery_worker:
    image: hammadmunir959/pchm:latest
    container_name: pchm_celery_worker
    command: celery -A config.celery worker --loglevel=info --concurrency=4
    volumes:
      - ./media:/app/media
    env_file:
      - .env
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      - db
      - redis
      - app
    networks:
      - pchm_network
    restart: unless-stopped

  # Celery Beat (Scheduler)
  celery_beat:
    image: hammadmunir959/pchm:latest
    container_name: pchm_celery_beat
    command: celery -A config.celery beat --loglevel=info
    env_file:
      - .env
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      - db
      - redis
      - app
    networks:
      - pchm_network
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  pchm_network:
    driver: bridge
```

### Step 3: Create Environment File

Create a `.env` file in the same directory:

```bash
# Database Configuration
DB_NAME=pchm_db
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_HOST=db
DB_PORT=5432

# Django Settings
SECRET_KEY=your-secret-key-here-change-this-in-production
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Redis Configuration
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Security Settings
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
```

**Important:** Replace `your_secure_password_here` and `your-secret-key-here-change-this-in-production` with secure values.

### Step 4: Pull and Start Services

```bash
# Pull the latest image
docker pull hammadmunir959/pchm:latest

# Start all services
docker compose up -d
```

### Step 5: Wait for Services to Initialize

The application will automatically:
- Wait for the database to be ready
- Run database migrations
- Collect static files
- Start the web server

You can monitor the logs:

```bash
docker compose logs -f app
```

### Step 6: Access the Application

Once all services are healthy, access:

- **Frontend/Application**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

### Step 7: Create a Superuser (Optional)

To access the admin panel, create a superuser:

```bash
docker compose exec app python manage.py createsuperuser
```

Follow the prompts to create your admin account.

---

## Alternative: Using Docker Run (Manual Setup)

If you prefer to run containers manually without Docker Compose:

### Step 1: Pull the Image

```bash
docker pull hammadmunir959/pchm:latest
```

### Step 2: Create a Docker Network

```bash
docker network create pchm_network
```

### Step 3: Start PostgreSQL Database

```bash
docker run -d \
  --name pchm_db \
  --network pchm_network \
  -e POSTGRES_DB=pchm_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

### Step 4: Start Redis

```bash
docker run -d \
  --name pchm_redis \
  --network pchm_network \
  -v redis_data:/data \
  redis:7-alpine
```

### Step 5: Start the Application

```bash
docker run -d \
  --name pchm_app \
  --network pchm_network \
  -p 8000:8000 \
  -e DB_HOST=pchm_db \
  -e DB_PORT=5432 \
  -e DB_NAME=pchm_db \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  -e REDIS_URL=redis://pchm_redis:6379/0 \
  -e CELERY_BROKER_URL=redis://pchm_redis:6379/0 \
  -e CELERY_RESULT_BACKEND=redis://pchm_redis:6379/0 \
  -e SECRET_KEY=your-secret-key \
  -e DEBUG=False \
  -e ALLOWED_HOSTS=localhost,127.0.0.1 \
  -v $(pwd)/media:/app/media \
  -v $(pwd)/staticfiles:/app/staticfiles \
  hammadmunir959/pchm:latest
```

### Step 6: Start Celery Worker

```bash
docker run -d \
  --name pchm_celery_worker \
  --network pchm_network \
  -e DB_HOST=pchm_db \
  -e DB_PORT=5432 \
  -e DB_NAME=pchm_db \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  -e REDIS_URL=redis://pchm_redis:6379/0 \
  -e CELERY_BROKER_URL=redis://pchm_redis:6379/0 \
  -e CELERY_RESULT_BACKEND=redis://pchm_redis:6379/0 \
  -v $(pwd)/media:/app/media \
  hammadmunir959/pchm:latest \
  celery -A config.celery worker --loglevel=info --concurrency=4
```

### Step 7: Start Celery Beat

```bash
docker run -d \
  --name pchm_celery_beat \
  --network pchm_network \
  -e DB_HOST=pchm_db \
  -e DB_PORT=5432 \
  -e DB_NAME=pchm_db \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  -e REDIS_URL=redis://pchm_redis:6379/0 \
  -e CELERY_BROKER_URL=redis://pchm_redis:6379/0 \
  -e CELERY_RESULT_BACKEND=redis://pchm_redis:6379/0 \
  hammadmunir959/pchm:latest \
  celery -A config.celery beat --loglevel=info
```

---

## Common Commands

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f celery_worker
docker compose logs -f celery_beat
```

### Check Service Status

```bash
docker compose ps
```

### Stop Services

```bash
docker compose down
```

### Stop and Remove Volumes (⚠️ This deletes data)

```bash
docker compose down -v
```

### Restart Services

```bash
docker compose restart
```

### Update to Latest Image

```bash
docker pull hammadmunir959/pchm:latest
docker compose up -d
```

### Run Django Management Commands

```bash
# Create superuser
docker compose exec app python manage.py createsuperuser

# Run migrations
docker compose exec app python manage.py migrate

# Collect static files
docker compose exec app python manage.py collectstatic

# Django shell
docker compose exec app python manage.py shell
```

### Access Container Shell

```bash
docker compose exec app bash
```

---

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | PostgreSQL hostname | `db` | Yes |
| `DB_PORT` | PostgreSQL port | `5432` | Yes |
| `DB_NAME` | Database name | `pchm_db` | Yes |
| `DB_USER` | Database user | `postgres` | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `SECRET_KEY` | Django secret key | - | Yes |
| `DEBUG` | Enable debug mode | `False` | No |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hosts | - | Yes |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379/0` | Yes |
| `CELERY_BROKER_URL` | Celery broker URL | `redis://redis:6379/0` | Yes |
| `CELERY_RESULT_BACKEND` | Celery result backend | `redis://redis:6379/0` | Yes |
| `SECURE_SSL_REDIRECT` | Force HTTPS redirects | `False` | No |
| `SESSION_COOKIE_SECURE` | Secure session cookies | `False` | No |
| `CSRF_COOKIE_SECURE` | Secure CSRF cookies | `False` | No |

---

## Troubleshooting

### Container Won't Start

1. Check logs: `docker compose logs app`
2. Verify database is running: `docker compose ps db`
3. Check environment variables in `.env` file

### Database Connection Errors

1. Ensure database container is healthy: `docker compose ps db`
2. Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` in `.env`
3. Wait a few seconds for database to initialize

### Port Already in Use

If port 8000 is already in use, change it in `docker-compose.yml`:

```yaml
ports:
  - "8001:8000"  # Use port 8001 on host instead
```

### Permission Errors

If you encounter permission errors with volumes:

```bash
sudo chown -R $USER:$USER ./media ./staticfiles
```

### View Container Health

```bash
docker compose ps
```

Look for `(healthy)` status next to container names.

---

## Production Considerations

1. **Change Default Passwords**: Always use strong, unique passwords
2. **Set SECRET_KEY**: Generate a secure secret key for production
3. **Set DEBUG=False**: Disable debug mode in production
4. **Configure ALLOWED_HOSTS**: Set to your actual domain
5. **Use HTTPS**: Set `SECURE_SSL_REDIRECT=True` and configure SSL certificates
6. **Backup Database**: Regularly backup the `postgres_data` volume
7. **Monitor Logs**: Set up log aggregation and monitoring
8. **Resource Limits**: Add resource limits to containers in production

---

## Support

For issues or questions:
- Check container logs: `docker compose logs`
- Verify all services are running: `docker compose ps`
- Ensure all environment variables are set correctly

---

**Image Location**: `docker.io/hammadmunir959/pchm:latest`

**Last Updated**: 2025-11-27

