"""
Health check utilities for monitoring system status.
"""
from typing import Dict, Any, Optional
from django.db import connection
from django.core.cache import cache
from django.conf import settings
import time


def check_database() -> Dict[str, Any]:
    """
    Check database connectivity and performance.
    
    Returns:
        Dictionary with status and metrics
    """
    try:
        start_time = time.time()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        response_time = (time.time() - start_time) * 1000  # Convert to ms
        
        return {
            'status': 'healthy',
            'response_time_ms': round(response_time, 2),
            'database': settings.DATABASES['default']['NAME'],
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e),
        }


def check_cache() -> Dict[str, Any]:
    """
    Check cache (Redis) connectivity.
    
    Returns:
        Dictionary with status and metrics
    """
    try:
        start_time = time.time()
        test_key = 'health_check_test'
        test_value = 'test_value'
        
        cache.set(test_key, test_value, 10)
        retrieved = cache.get(test_key)
        cache.delete(test_key)
        
        response_time = (time.time() - start_time) * 1000
        
        if retrieved == test_value:
            return {
                'status': 'healthy',
                'response_time_ms': round(response_time, 2),
            }
        else:
            return {
                'status': 'unhealthy',
                'error': 'Cache read/write mismatch',
            }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e),
        }


def check_celery() -> Dict[str, Any]:
    """
    Check Celery worker availability.
    
    Returns:
        Dictionary with status
    """
    try:
        from celery import current_app
        inspect = current_app.control.inspect()
        active_workers = inspect.active()
        
        if active_workers:
            return {
                'status': 'healthy',
                'workers': len(active_workers),
            }
        else:
            return {
                'status': 'degraded',
                'message': 'No active Celery workers found',
            }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e),
        }


def check_disk_space() -> Dict[str, Any]:
    """
    Check available disk space.
    
    Returns:
        Dictionary with status and disk info
    """
    try:
        import shutil
        total, used, free = shutil.disk_usage('/')
        
        free_gb = free / (1024 ** 3)
        total_gb = total / (1024 ** 3)
        used_percent = (used / total) * 100
        
        status = 'healthy'
        if used_percent > 90:
            status = 'critical'
        elif used_percent > 80:
            status = 'warning'
        
        return {
            'status': status,
            'free_gb': round(free_gb, 2),
            'total_gb': round(total_gb, 2),
            'used_percent': round(used_percent, 2),
        }
    except Exception as e:
        return {
            'status': 'unknown',
            'error': str(e),
        }


def get_health_status() -> Dict[str, Any]:
    """
    Get overall health status of the system.
    
    Returns:
        Dictionary with health status of all components
    """
    checks = {
        'database': check_database(),
        'cache': check_cache(),
        'disk_space': check_disk_space(),
    }
    
    # Optional: Check Celery if configured
    if hasattr(settings, 'CELERY_BROKER_URL') and settings.CELERY_BROKER_URL:
        checks['celery'] = check_celery()
    
    # Determine overall status
    statuses = [check.get('status') for check in checks.values()]
    
    if 'unhealthy' in statuses or 'critical' in statuses:
        overall_status = 'unhealthy'
    elif 'degraded' in statuses or 'warning' in statuses:
        overall_status = 'degraded'
    else:
        overall_status = 'healthy'
    
    return {
        'status': overall_status,
        'timestamp': time.time(),
        'checks': checks,
    }


def get_readiness_status() -> Dict[str, Any]:
    """
    Get readiness status (can the service accept traffic?).
    
    Returns:
        Dictionary with readiness status
    """
    checks = {
        'database': check_database(),
        'cache': check_cache(),
    }
    
    # Service is ready if critical components are healthy
    critical_checks = ['database']
    critical_statuses = [checks[check].get('status') for check in critical_checks]
    
    if all(status == 'healthy' for status in critical_statuses):
        return {
            'status': 'ready',
            'checks': checks,
        }
    else:
        return {
            'status': 'not_ready',
            'checks': checks,
        }

