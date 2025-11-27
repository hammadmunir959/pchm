"""
URLs for metrics and monitoring endpoints.
"""
from django.urls import path
from config.views import health_check, readiness_check, liveness_check
from config.metrics_views import metrics_view

urlpatterns = [
    path('health/', health_check, name='health'),
    path('ready/', readiness_check, name='ready'),
    path('live/', liveness_check, name='live'),
    path('', metrics_view, name='metrics'),
]

