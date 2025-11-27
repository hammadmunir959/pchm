import os

env = os.getenv('DJANGO_ENV', 'development').lower()

if env == 'production':
    from .production import *  # noqa
elif env == 'staging':
    from .staging import *  # type: ignore  # noqa
else:
    from .development import *  # noqa





