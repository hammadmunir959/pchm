"""
Sentry configuration for error tracking.
"""
import logging
from typing import Optional
from django.conf import settings

logger = logging.getLogger(__name__)

# Initialize Sentry if DSN is provided
SENTRY_DSN = getattr(settings, 'SENTRY_DSN', None)

if SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.celery import CeleryIntegration
        from sentry_sdk.integrations.redis import RedisIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration
        
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[
                DjangoIntegration(
                    transaction_style='url',
                    middleware_spans=True,
                    signals_spans=True,
                ),
                CeleryIntegration(),
                RedisIntegration(),
                LoggingIntegration(
                    level=logging.INFO,
                    event_level=logging.ERROR,
                ),
            ],
            # Set traces_sample_rate to 1.0 to capture 100%
            # of transactions for performance monitoring.
            # We recommend adjusting this value in production.
            traces_sample_rate=float(getattr(settings, 'SENTRY_TRACES_SAMPLE_RATE', '0.1')),
            
            # Set profiles_sample_rate to profile performance
            # We recommend adjusting this value in production.
            profiles_sample_rate=float(getattr(settings, 'SENTRY_PROFILES_SAMPLE_RATE', '0.1')),
            
            # If you wish to associate users to errors (assuming you are using
            # django.contrib.auth) you may enable sending PII data.
            send_default_pii=getattr(settings, 'SENTRY_SEND_DEFAULT_PII', False),
            
            # Environment
            environment=getattr(settings, 'SENTRY_ENVIRONMENT', 'production' if not settings.DEBUG else 'development'),
            
            # Release version
            release=getattr(settings, 'SENTRY_RELEASE', None),
            
            # Before send callback to filter events
            before_send=getattr(settings, 'SENTRY_BEFORE_SEND', None),
        )
        
        logger.info("Sentry initialized successfully")
    except ImportError:
        logger.warning("sentry-sdk not installed. Install it to enable error tracking.")
    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {e}")
else:
    logger.info("Sentry DSN not configured. Error tracking disabled.")


def capture_exception(exception: Exception, **kwargs) -> Optional[str]:
    """
    Capture an exception to Sentry.
    
    Args:
        exception: Exception to capture
        **kwargs: Additional context
    
    Returns:
        Event ID if Sentry is configured, None otherwise
    """
    if SENTRY_DSN:
        try:
            import sentry_sdk
            return sentry_sdk.capture_exception(exception, **kwargs)
        except Exception:
            pass
    return None


def capture_message(message: str, level: str = 'info', **kwargs) -> Optional[str]:
    """
    Capture a message to Sentry.
    
    Args:
        message: Message to capture
        level: Log level (info, warning, error)
        **kwargs: Additional context
    
    Returns:
        Event ID if Sentry is configured, None otherwise
    """
    if SENTRY_DSN:
        try:
            import sentry_sdk
            return sentry_sdk.capture_message(message, level=level, **kwargs)
        except Exception:
            pass
    return None


def set_user_context(user_id: Optional[int] = None, email: Optional[str] = None, **kwargs):
    """
    Set user context for Sentry.
    
    Args:
        user_id: User ID
        email: User email
        **kwargs: Additional user data
    """
    if SENTRY_DSN:
        try:
            import sentry_sdk
            sentry_sdk.set_user({
                'id': user_id,
                'email': email,
                **kwargs
            })
        except Exception:
            pass


def set_context(key: str, value: dict):
    """
    Set additional context for Sentry.
    
    Args:
        key: Context key
        value: Context value (dict)
    """
    if SENTRY_DSN:
        try:
            import sentry_sdk
            sentry_sdk.set_context(key, value)
        except Exception:
            pass

