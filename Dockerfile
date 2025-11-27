# Multi-stage build for complete application (Frontend + Backend)
# Stage 1: Build Frontend
FROM node:20-slim as frontend-builder

WORKDIR /app/frontend

# Install system dependencies for node-gyp and native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY frontend/package.json frontend/package-lock.json* frontend/bun.lockb* ./

# Install dependencies
RUN if [ -f package-lock.json ]; then \
        npm ci --legacy-peer-deps; \
    elif [ -f bun.lockb ]; then \
        npm install -g bun && bun install; \
    else \
        npm install --legacy-peer-deps; \
    fi

# Copy frontend source
COPY frontend/ ./

# Create the backend directory structure that vite.config.ts expects
# vite.config.ts outputs to ../backend/frontend_dist relative to frontend dir
RUN mkdir -p ../backend

# Build arguments for environment variables
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:8000}

# Build frontend (will output to ../backend/frontend_dist as configured in vite.config.ts)
RUN npm run build

# Verify build output and copy to staging location
RUN if [ -d "../backend/frontend_dist" ]; then \
        mkdir -p /app/frontend_dist && \
        cp -r ../backend/frontend_dist/* /app/frontend_dist/; \
        echo "Frontend built successfully"; \
    elif [ -d "dist" ]; then \
        mkdir -p /app/frontend_dist && \
        cp -r dist/* /app/frontend_dist/; \
        echo "Frontend built to dist, copied to staging"; \
    else \
        echo "ERROR: Frontend build output not found!" && \
        ls -la && \
        ls -la .. && \
        exit 1; \
    fi

# Stage 2: Python Dependencies Builder
FROM python:3.12-slim as python-builder

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

# Stage 3: Final Production Image
FROM python:3.12-slim

WORKDIR /app

# Copy Python dependencies from builder
COPY --from=python-builder /root/.local /root/.local

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy backend code
COPY backend/ /app/backend/

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /app/frontend_dist /app/backend/frontend_dist

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DJANGO_SETTINGS_MODULE=config.settings.production

# Create directories for static files, media, and logs
RUN mkdir -p /app/staticfiles /app/media /app/logs

# Set working directory to backend for manage.py commands
WORKDIR /app/backend

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Waiting for database..."\n\
until python manage.py check --database default 2>/dev/null; do\n\
  echo "Database is unavailable - sleeping"\n\
  sleep 2\n\
done\n\
echo "Running migrations..."\n\
python manage.py migrate --noinput\n\
echo "Collecting static files..."\n\
python manage.py collectstatic --noinput\n\
echo "Starting Gunicorn..."\n\
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120 --access-logfile - --error-logfile -\n\
' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/admin/ || exit 1

# Default command
CMD ["/app/start.sh"]

