from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from theming.models import Event

CACHE_KEY_PREFIX = "active_theme"


@receiver([post_save, post_delete], sender=Event)
def clear_theme_cache(sender, instance, **kwargs):
    """Clear theme cache when events are saved or deleted"""
    # Clear all theme event caches - simple approach: clear cache keys that match pattern
    # Since we don't know all dates, we'll use a cache version pattern
    cache_pattern = f"{CACHE_KEY_PREFIX}_event_*"
    # Django cache doesn't support wildcard deletion easily, so we'll clear the entire cache
    # or use a version system. For simplicity, we'll just clear relevant date caches
    # by invalidating a version key that clients check
    
    # Set a version/timestamp that changes on event updates
    cache.set(f"{CACHE_KEY_PREFIX}_version", cache.get(f"{CACHE_KEY_PREFIX}_version", 0) + 1, timeout=None)
    
    # Also clear today's cache immediately
    from django.utils import timezone
    from theming.services.theme_resolver import _today_local_date
    today = _today_local_date()
    cache_key = f"{CACHE_KEY_PREFIX}_event_{today.isoformat()}"
    cache.delete(cache_key)

