"""
Custom middleware for security headers and request tracking.
"""
import uuid
import logging
from typing import Callable
from contextlib import contextmanager

from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

logger = logging.getLogger(__name__)


class SuppressPollingLogsMiddleware(MiddlewareMixin):
    """
    Middleware to suppress verbose logging for polling endpoints.
    Prevents log spam from frequently polled endpoints like chat message polling.
    """
    
    # Endpoints that are polled frequently (log at DEBUG instead of INFO)
    POLLING_PATTERNS = [
        '/api/chatbot/messages/',
    ]
    
    @contextmanager
    def _suppress_django_request_logging(self, request):
        """Temporarily suppress Django's request logging for polling endpoints"""
        # Check if this is a polling endpoint
        is_polling = any(
            pattern in request.path 
            for pattern in self.POLLING_PATTERNS
        )
        
        if is_polling and request.method in ['GET', 'OPTIONS']:
            # Temporarily reduce Django request logger level
            django_request_logger = logging.getLogger('django.server')
            original_level = django_request_logger.level
            django_request_logger.setLevel(logging.DEBUG)
            try:
                yield
            finally:
                django_request_logger.setLevel(original_level)
        else:
            yield
    
    def __call__(self, request):
        with self._suppress_django_request_logging(request):
            return super().__call__(request)


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware to add security headers to all responses.
    """
    
    def process_response(self, request, response):
        """Add security headers to response."""
        # Prevent clickjacking
        response['X-Frame-Options'] = 'DENY'
        
        # Prevent MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Enable XSS protection
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Content Security Policy (can be customized per environment)
        if not settings.DEBUG:
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self'; "
                "frame-ancestors 'none';"
            )
            response['Content-Security-Policy'] = csp
        
        # Strict Transport Security (HTTPS only in production)
        if not settings.DEBUG and request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Permissions Policy
        response['Permissions-Policy'] = (
            'geolocation=(), microphone=(), camera=(), '
            'payment=(), usb=(), magnetometer=(), gyroscope=()'
        )
        
        return response


class SuppressPollingLogsMiddleware(MiddlewareMixin):
    """
    Middleware to suppress verbose logging for polling endpoints.
    Prevents log spam from frequently polled endpoints like chat message polling.
    """
    
    # Endpoints that are polled frequently (suppress INFO logs for successful GET/OPTIONS)
    POLLING_PATTERNS = [
        '/api/chatbot/messages/',
    ]
    
    def process_request(self, request):
        """Mark polling requests to suppress logging"""
        # Check if this is a polling endpoint
        is_polling = any(
            pattern in request.path 
            for pattern in self.POLLING_PATTERNS
        )
        
        if is_polling and request.method in ['GET', 'OPTIONS']:
            # Mark request to suppress logging
            request._suppress_logging = True
        else:
            request._suppress_logging = False
        
        return None
    
    def process_response(self, request, response):
        """Suppress logging for polling endpoints if successful"""
        if getattr(request, '_suppress_logging', False) and response.status_code == 200:
            # Temporarily suppress Django server logging for this request
            import logging
            django_server_logger = logging.getLogger('django.server')
            original_level = django_server_logger.level
            django_server_logger.setLevel(logging.WARNING)  # Only show warnings/errors
            # The log has already been written, but this prevents future ones
        
        return response


class RequestIDMiddleware(MiddlewareMixin):
    """
    Middleware to add a unique request ID to each request for tracing.
    """
    
    def process_request(self, request):
        """Generate and attach request ID to request."""
        request_id = request.META.get('HTTP_X_REQUEST_ID') or str(uuid.uuid4())
        request.request_id = request_id
        return None
    
    def process_response(self, request, response):
        """Add request ID to response headers."""
        if hasattr(request, 'request_id'):
            response['X-Request-ID'] = request.request_id
        return response

