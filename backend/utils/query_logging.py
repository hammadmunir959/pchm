"""
Database query logging utilities for development and debugging.
"""
import logging
import time
from typing import Any, Dict, List
from django.conf import settings
from django.db import connection
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('django.db.backends')


class QueryLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log database queries in development.
    Only active when DEBUG=True.
    """
    
    def process_request(self, request):
        """Reset query count at start of request."""
        if settings.DEBUG:
            connection.queries_log.clear()
            self.start_time = time.time()
        return None
    
    def process_response(self, request, response):
        """Log queries at end of request."""
        if settings.DEBUG and hasattr(connection, 'queries'):
            queries = connection.queries
            query_count = len(queries)
            total_time = sum(float(q['time']) for q in queries)
            
            # Only log if there are queries or if it's an API request
            if query_count > 0 and request.path.startswith('/api/'):
                request_time = time.time() - getattr(self, 'start_time', 0)
                
                # Log warning if too many queries (N+1 problem indicator)
                if query_count > 20:
                    logger.warning(
                        f"High query count ({query_count}) for {request.path}",
                        extra={
                            'query_count': query_count,
                            'total_query_time': total_time,
                            'request_time': request_time,
                            'path': request.path,
                            'method': request.method,
                        }
                    )
                elif query_count > 10:
                    logger.info(
                        f"Query count ({query_count}) for {request.path}",
                        extra={
                            'query_count': query_count,
                            'total_query_time': total_time,
                            'request_time': request_time,
                            'path': request.path,
                            'method': request.method,
                        }
                    )
        
        return response


def get_query_count() -> int:
    """
    Get the number of queries executed so far.
    
    Returns:
        Number of queries
    """
    if settings.DEBUG and hasattr(connection, 'queries'):
        return len(connection.queries)
    return 0


def get_slow_queries(threshold: float = 0.1) -> List[Dict[str, Any]]:
    """
    Get queries that took longer than threshold.
    
    Args:
        threshold: Time threshold in seconds
    
    Returns:
        List of slow queries
    """
    if not settings.DEBUG or not hasattr(connection, 'queries'):
        return []
    
    slow_queries = [
        q for q in connection.queries
        if float(q['time']) > threshold
    ]
    
    return slow_queries


def log_queries_summary():
    """
    Log a summary of all queries executed.
    Useful for debugging in development.
    """
    if not settings.DEBUG or not hasattr(connection, 'queries'):
        return
    
    queries = connection.queries
    if not queries:
        return
    
    query_count = len(queries)
    total_time = sum(float(q['time']) for q in queries)
    slow_queries = get_slow_queries(0.1)
    
    logger.info(
        f"Query Summary: {query_count} queries, {total_time:.3f}s total",
        extra={
            'query_count': query_count,
            'total_time': total_time,
            'slow_queries': len(slow_queries),
            'queries': queries[:10],  # First 10 queries
        }
    )
    
    if slow_queries:
        logger.warning(
            f"Slow queries detected: {len(slow_queries)}",
            extra={'slow_queries': slow_queries}
        )

