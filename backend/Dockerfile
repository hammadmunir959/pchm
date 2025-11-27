# Multi-stage build for Django backend
FROM python:3.12-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --user -r requirements.txt

# Final stage
FROM python:3.12-slim

WORKDIR /app

# Copy Python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy backend code
COPY backend/ /app/backend/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DJANGO_SETTINGS_MODULE=config.settings.production

# Note: When running this container, ensure the following environment variables are set:
# - DB_HOST (e.g., 'db' when using docker-compose, 'localhost' for local development)
# - DB_NAME, DB_USER, DB_PASSWORD, DB_PORT
# - SECRET_KEY, DEBUG, ALLOWED_HOSTS
# - REDIS_URL (for cache and Celery)
# See docker-compose.yml for example configuration

# Create directories for static files, media, and frontend dist
RUN mkdir -p /app/staticfiles /app/media /app/frontend_dist

# Set working directory to backend for manage.py commands
WORKDIR /app/backend

# Expose port
EXPOSE 8000

# Health check - using /live/ endpoint which doesn't require database access
# This is better for container orchestration as it just verifies the web server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/live/ || exit 1

# Default command - will be overridden in docker-compose
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]

