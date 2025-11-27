from .celery import app as celery_app

# Initialize Sentry if configured
try:
    import utils.sentry_config  # noqa: F401
except Exception:
    pass

__all__ = ('celery_app',)
