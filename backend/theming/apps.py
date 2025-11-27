from django.apps import AppConfig


class ThemingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'theming'
    
    def ready(self):
        import theming.signals  # noqa