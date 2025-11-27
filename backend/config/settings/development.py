import os

from .base import *

# Import query logging middleware conditionally
if os.getenv('ENABLE_QUERY_LOGGING', 'False').lower() == 'true':
    # Add query logging middleware after RequestIDMiddleware
    base_middleware = MIDDLEWARE.copy()
    request_id_index = base_middleware.index('utils.middleware.RequestIDMiddleware')
    base_middleware.insert(request_id_index + 1, 'utils.query_logging.QueryLoggingMiddleware')
    MIDDLEWARE = base_middleware

# Development-specific settings
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Email backend for development
# Prefer the real SMTP backend when credentials are configured so emails can be tested end-to-end.
# Fall back to console when credentials are missing or when explicitly forced via DEV_FORCE_CONSOLE_EMAILS.
EMAIL_CREDENTIALS_CONFIGURED = bool(EMAIL_HOST_USER and EMAIL_HOST_PASSWORD)
FORCE_CONSOLE_EMAILS = os.getenv('DEV_FORCE_CONSOLE_EMAILS', 'false').lower() == 'true'

if FORCE_CONSOLE_EMAILS or not EMAIL_CREDENTIALS_CONFIGURED:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# CORS for development
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',  # Vite dev server
    'http://127.0.0.1:5173',
    'http://localhost:8080',  # Vite dev server (alternative port)
    'http://127.0.0.1:8080',
    'http://192.168.100.231:8080',  # Network access
    'http://172.17.0.1:8080',  # Docker network
]

# Ensure CORS credentials are allowed
CORS_ALLOW_CREDENTIALS = True

# Allow all methods and headers for development
CORS_ALLOW_ALL_ORIGINS = False  # Explicitly set to False for security
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Disable throttling in development
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '1000/hour',
    'user': '10000/hour',
    # Custom throttle rates (more lenient in development)
    'anon_burst': '100/minute',
    'anon_sustained': '1000/hour',
    'user_burst': '200/minute',
    'user_sustained': '10000/hour',
    'chatbot': '50/minute',
    'auth': '20/minute',
    'contact': '10/hour',
    'admin_action': '500/minute',
}

# Development-specific logging
LOGGING['handlers']['console']['level'] = 'DEBUG'
LOGGING['loggers']['django']['level'] = 'DEBUG'
LOGGING['loggers']['utils']['level'] = 'DEBUG'
LOGGING['loggers']['django.db.backends'] = {
    'handlers': ['console'],
    'level': 'INFO',  # Set to DEBUG to see all SQL queries
    'propagate': False,
}
# Suppress verbose StatReloader DEBUG messages
LOGGING['loggers']['django.utils.autoreload'] = {
    'handlers': ['console'],
    'level': 'INFO',  # Only show INFO and above, suppress DEBUG file watching messages
    'propagate': False,
}

# Enable query logging middleware in development
# Add to MIDDLEWARE if you want query logging
ENABLE_QUERY_LOGGING = os.getenv('ENABLE_QUERY_LOGGING', 'False').lower() == 'true'

# Enable compression in development (optional)
ENABLE_COMPRESSION = os.getenv('ENABLE_COMPRESSION', 'False').lower() == 'true'
