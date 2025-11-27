"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from config import views as config_views

urlpatterns = [
    # Health check endpoints (public, no auth required)
    path('health/', config_views.health_check, name='health'),
    path('ready/', config_views.readiness_check, name='ready'),
    path('live/', config_views.liveness_check, name='live'),
    
    path('django-admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('vehicles.urls')),
    path('api/', include('bookings.urls')),
    path('api/', include('inquiries.urls')),
    path('api/', include('testimonials.urls')),
    path('api/', include('blog.urls')),
    path('api/', include('car_sales.urls')),
    path('api/cms/', include('cms.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/newsletter/', include('newsletter.urls')),
    path('api/gallery/', include('gallery.urls')),
    path('api/', include('faq.urls')),
    path('api/cookies/', include('cookie_consent.urls')),
    path('api/theming/', include('theming.urls')),
    path('api/metrics/', include('config.metrics_urls')),  # Metrics endpoints
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'api/schema/swagger-ui/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui'
    ),
    path(
        'api/schema/redoc/',
        SpectacularRedocView.as_view(url_name='schema'),
        name='redoc'
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Serve static files from staticfiles directory
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Serve frontend assets from assets directory
if settings.FRONTEND_DIST_ASSETS_DIR.exists():
    urlpatterns += static(
        settings.FRONTEND_ASSETS_URL,
        document_root=settings.FRONTEND_DIST_ASSETS_DIR,
    )

# Serve frontend fonts
if settings.FRONTEND_DIST_FONTS_DIR.exists():
    urlpatterns += static(
        settings.FRONTEND_FONTS_URL,
        document_root=settings.FRONTEND_DIST_FONTS_DIR,
    )

# Serve root-level frontend files (videos, images, etc.) that are in frontend_dist root
# This needs to be done carefully to not interfere with API routes or SPA routing
if settings.DEBUG and settings.FRONTEND_DIST_DIR.exists():
    from django.views.static import serve as static_serve
    
    # Serve static files from frontend_dist root (videos, images, favicon, etc.)
    # Only match specific file extensions to avoid conflicts with SPA routing
    # Pattern allows letters, numbers, spaces, hyphens, underscores, dots in filename
    frontend_static_extensions = ['mp4', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico', 'txt', 'xml']
    frontend_static_pattern = rf'^(?P<path>[^/]+\.({"|".join(frontend_static_extensions)}))$'
    
    def serve_frontend_static(request, path):
        """Serve static files from frontend_dist root directory"""
        from django.http import Http404
        file_path = settings.FRONTEND_DIST_DIR / path
        # Exclude files that are in subdirectories (already handled by other patterns)
        if 'assets/' in path or 'fonts/' in path:
            raise Http404("File not found")
        if file_path.exists() and file_path.is_file():
            return static_serve(request, path, document_root=str(settings.FRONTEND_DIST_DIR))
        raise Http404("File not found")
    
    urlpatterns += [
        re_path(frontend_static_pattern, serve_frontend_static, name='frontend-static'),
    ]

urlpatterns += [
    re_path(
        r'^(?!api/)(?!django-admin/)(?!media/)(?!static/)(?!assets/)(?!fonts/)(?!health/)(?!ready/)(?!live/).*$',  # fallback for SPA routes (exclude static file patterns)
        config_views.frontend_app,
        name='frontend-app',
    ),
]

# Custom 404 handler to avoid Django debug page URL pattern rendering issues
handler404 = config_views.custom_404_handler
