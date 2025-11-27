"""
Redis caching utilities for performance optimization.
"""
from typing import Any, Callable, Optional, TypeVar
import json
import hashlib
from functools import wraps

from django.core.cache import cache
from django.conf import settings

T = TypeVar('T')

# Cache timeout defaults (in seconds)
CACHE_TIMEOUT_SHORT = 60 * 5  # 5 minutes
CACHE_TIMEOUT_MEDIUM = 60 * 30  # 30 minutes
CACHE_TIMEOUT_LONG = 60 * 60 * 24  # 24 hours


def get_cache_key(prefix: str, *args, **kwargs) -> str:
    """
    Generate a cache key from prefix and arguments.
    
    Args:
        prefix: Cache key prefix
        *args: Positional arguments
        **kwargs: Keyword arguments
    
    Returns:
        Cache key string
    """
    # Create a hash of arguments
    key_parts = [prefix]
    if args:
        key_parts.append(str(hash(str(args))))
    if kwargs:
        # Sort kwargs for consistent keys
        sorted_kwargs = sorted(kwargs.items())
        key_parts.append(str(hash(str(sorted_kwargs))))
    
    key_string = ':'.join(key_parts)
    # Create hash for long keys
    if len(key_string) > 200:
        key_string = hashlib.md5(key_string.encode()).hexdigest()
    
    return f"pchm:{prefix}:{key_string}"


def cache_result(timeout: int = CACHE_TIMEOUT_MEDIUM, key_prefix: Optional[str] = None):
    """
    Decorator to cache function results.
    
    Args:
        timeout: Cache timeout in seconds
        key_prefix: Optional custom key prefix
    
    Usage:
        @cache_result(timeout=300, key_prefix='vehicles')
        def get_vehicles():
            return Vehicle.objects.all()
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            prefix = key_prefix or f"{func.__module__}.{func.__name__}"
            cache_key = get_cache_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Store in cache
            cache.set(cache_key, result, timeout)
            
            return result
        
        return wrapper
    return decorator


def invalidate_cache_pattern(pattern: str) -> int:
    """
    Invalidate all cache keys matching a pattern.
    
    Args:
        pattern: Cache key pattern (e.g., 'pchm:vehicles:*')
    
    Returns:
        Number of keys deleted
    """
    # Note: This requires Redis and may not work with all cache backends
    # For production, consider using django-redis with pattern deletion
    try:
        from django.core.cache import cache
        if hasattr(cache, 'delete_pattern'):
            return cache.delete_pattern(pattern)
        else:
            # Fallback: clear all cache (not ideal)
            cache.clear()
            return -1
    except Exception:
        return 0


def cache_queryset(queryset, timeout: int = CACHE_TIMEOUT_MEDIUM, key_prefix: str = 'queryset') -> Any:
    """
    Cache a queryset result.
    
    Args:
        queryset: Django queryset
        timeout: Cache timeout in seconds
        key_prefix: Cache key prefix
    
    Returns:
        Cached queryset result
    """
    # Generate cache key from queryset SQL
    sql = str(queryset.query)
    cache_key = get_cache_key(key_prefix, sql=sql)
    
    # Try to get from cache
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return cached_result
    
    # Execute queryset
    result = list(queryset)
    
    # Store in cache
    cache.set(cache_key, result, timeout)
    
    return result


class CacheManager:
    """Manager for cache operations."""
    
    @staticmethod
    def get(key: str, default: Any = None) -> Any:
        """Get value from cache."""
        return cache.get(key, default)
    
    @staticmethod
    def set(key: str, value: Any, timeout: int = CACHE_TIMEOUT_MEDIUM) -> None:
        """Set value in cache."""
        cache.set(key, value, timeout)
    
    @staticmethod
    def delete(key: str) -> None:
        """Delete key from cache."""
        cache.delete(key)
    
    @staticmethod
    def clear() -> None:
        """Clear all cache."""
        cache.clear()
    
    @staticmethod
    def get_or_set(key: str, default: Callable[[], T], timeout: int = CACHE_TIMEOUT_MEDIUM) -> T:
        """Get from cache or set default value."""
        return cache.get_or_set(key, default, timeout)
    
    @staticmethod
    def invalidate_vehicle_cache(vehicle_id: Optional[int] = None) -> None:
        """Invalidate vehicle-related cache."""
        if vehicle_id:
            cache.delete(f"pchm:vehicles:{vehicle_id}")
        cache.delete("pchm:vehicles:list")
        invalidate_cache_pattern("pchm:vehicles:*")
    
    @staticmethod
    def invalidate_blog_cache(blog_id: Optional[int] = None) -> None:
        """Invalidate blog-related cache."""
        if blog_id:
            cache.delete(f"pchm:blog:{blog_id}")
        cache.delete("pchm:blog:list")
        invalidate_cache_pattern("pchm:blog:*")
    
    @staticmethod
    def invalidate_car_sales_cache(listing_id: Optional[int] = None) -> None:
        """Invalidate car sales cache."""
        if listing_id:
            cache.delete(f"pchm:car_sales:{listing_id}")
        cache.delete("pchm:car_sales:list")
        invalidate_cache_pattern("pchm:car_sales:*")

