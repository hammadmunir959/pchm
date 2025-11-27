"""
Django app configuration for config app.
"""
from django.apps import AppConfig
import os


class ConfigConfig(AppConfig):
    """Configuration for the config app."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'config'
    
    def ready(self):
        """Called when Django starts."""
        # Validate environment variables on startup
        from django.conf import settings
        from utils.env_validation import validate_environment_on_startup
        
        # Only validate if explicitly enabled or in production
        if settings.VALIDATE_ENV or not settings.DEBUG:
            validate_environment_on_startup()

