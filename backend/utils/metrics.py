"""
Metrics collection utilities for monitoring.
"""
from typing import Dict, Any, Optional
from django.core.cache import cache
from django.db import connection
from django.conf import settings
import time
from datetime import datetime, timedelta


class MetricsCollector:
    """Collector for application metrics."""
    
    @staticmethod
    def get_request_metrics() -> Dict[str, Any]:
        """
        Get request-related metrics.
        
        Returns:
            Dictionary with request metrics
        """
        # This would typically be populated by middleware
        # For now, return basic structure
        return {
            'total_requests': cache.get('metrics:total_requests', 0),
            'requests_per_minute': cache.get('metrics:requests_per_minute', 0),
            'average_response_time_ms': cache.get('metrics:avg_response_time', 0),
        }
    
    @staticmethod
    def get_database_metrics() -> Dict[str, Any]:
        """
        Get database-related metrics.
        
        Returns:
            Dictionary with database metrics
        """
        try:
            with connection.cursor() as cursor:
                # Get connection count
                cursor.execute("""
                    SELECT count(*) 
                    FROM pg_stat_activity 
                    WHERE datname = current_database()
                """)
                active_connections = cursor.fetchone()[0]
                
                # Get database size
                cursor.execute("""
                    SELECT pg_size_pretty(pg_database_size(current_database()))
                """)
                db_size = cursor.fetchone()[0]
                
                return {
                    'active_connections': active_connections,
                    'database_size': db_size,
                    'status': 'healthy',
                }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
            }
    
    @staticmethod
    def get_cache_metrics() -> Dict[str, Any]:
        """
        Get cache-related metrics.
        
        Returns:
            Dictionary with cache metrics
        """
        try:
            # Test cache performance
            start_time = time.time()
            test_key = 'metrics_test'
            cache.set(test_key, 'test', 10)
            cache.get(test_key)
            cache.delete(test_key)
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': 'healthy',
                'response_time_ms': round(response_time, 2),
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
            }
    
    @staticmethod
    def get_system_metrics() -> Dict[str, Any]:
        """
        Get system-level metrics.
        
        Returns:
            Dictionary with system metrics
        """
        try:
            import psutil
            import os
            
            process = psutil.Process(os.getpid())
            
            return {
                'cpu_percent': process.cpu_percent(interval=0.1),
                'memory_mb': round(process.memory_info().rss / 1024 / 1024, 2),
                'threads': process.num_threads(),
            }
        except ImportError:
            # psutil not installed
            return {
                'status': 'unavailable',
                'message': 'psutil not installed',
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
            }
    
    @staticmethod
    def get_all_metrics() -> Dict[str, Any]:
        """
        Get all available metrics.
        
        Returns:
            Dictionary with all metrics
        """
        return {
            'timestamp': datetime.now().isoformat(),
            'request': MetricsCollector.get_request_metrics(),
            'database': MetricsCollector.get_database_metrics(),
            'cache': MetricsCollector.get_cache_metrics(),
            'system': MetricsCollector.get_system_metrics(),
        }
    
    @staticmethod
    def increment_request_count():
        """Increment request counter."""
        try:
            cache.incr('metrics:total_requests', 1)
        except (ValueError, AttributeError, Exception) as e:
            # Key doesn't exist yet, initialize it
            # Also handle any other cache-related errors silently
            try:
                cache.set('metrics:total_requests', 1, timeout=None)
            except Exception:
                # If cache is completely unavailable, just skip metrics
                pass
    
    @staticmethod
    def record_response_time(response_time_ms: float):
        """Record response time."""
        # Update average response time
        current_avg = cache.get('metrics:avg_response_time', 0)
        total_requests = cache.get('metrics:total_requests', 1)
        
        # Simple moving average
        new_avg = ((current_avg * (total_requests - 1)) + response_time_ms) / total_requests
        cache.set('metrics:avg_response_time', new_avg, timeout=3600)


class PerformanceMiddleware:
    """Middleware to track request performance metrics."""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        start_time = time.time()
        
        response = self.get_response(request)
        
        # Calculate response time
        response_time_ms = (time.time() - start_time) * 1000
        
        # Record metrics (only for API requests)
        # Wrap in try-except to prevent any metrics errors from affecting the request
        if request.path.startswith('/api/'):
            try:
                MetricsCollector.increment_request_count()
                MetricsCollector.record_response_time(response_time_ms)
            except Exception:
                # Silently ignore metrics errors - don't let them affect the request
                pass
            
            # Add response time header
            response['X-Response-Time'] = f"{response_time_ms:.2f}ms"
        
        return response

