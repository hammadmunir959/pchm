"""
Logging filters for structured logging.
"""
import logging
from typing import Any


class RequestIDFilter(logging.Filter):
    """
    Filter to add request ID to log records.
    """
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Add request_id to log record if available."""
        # Try to get request_id from various sources
        request_id = getattr(record, 'request_id', None)
        
        if not request_id:
            # Try to get from thread local or context
            try:
                import threading
                thread_local = getattr(threading.current_thread(), 'request_id', None)
                if thread_local:
                    request_id = thread_local
            except Exception:
                pass
        
        # Set request_id on record
        record.request_id = request_id or 'no-request-id'
        
        return True


class CorrelationIDFilter(logging.Filter):
    """
    Filter to add correlation ID for distributed tracing.
    """
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Add correlation_id to log record."""
        correlation_id = getattr(record, 'correlation_id', None)
        
        if not correlation_id:
            # Try to get from context
            try:
                import threading
                thread_local = getattr(threading.current_thread(), 'correlation_id', None)
                if thread_local:
                    correlation_id = thread_local
            except Exception:
                pass
        
        record.correlation_id = correlation_id or 'no-correlation-id'
        
        return True


class ReducePollingVerbosityFilter(logging.Filter):
    """
    Filter that reduces polling endpoint requests from INFO/WARNING to DEBUG level.
    This reduces log noise from frequently polled endpoints like chat message polling.
    """
    
    POLLING_ENDPOINTS = [
        '/api/chatbot/messages/',
    ]
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Convert INFO/WARNING level logs for polling endpoints to DEBUG"""
        if record.levelno in (logging.INFO, logging.WARNING):
            message = str(record.getMessage())
            # Check if this is a GET/OPTIONS request to polling endpoint
            # Include both 200 (success) and 404 (not found) responses for polling
            if any(
                endpoint in message and 
                ('"GET' in message or '"OPTIONS' in message) and
                ('200' in message or '404' in message or '"200' in message or '"404' in message)
                for endpoint in self.POLLING_ENDPOINTS
            ):
                # Convert INFO/WARNING to DEBUG for polling requests
                record.levelno = logging.DEBUG
                record.levelname = 'DEBUG'
        return True
