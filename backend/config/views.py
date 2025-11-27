"""
Health check and monitoring views.
"""
from django.conf import settings
from django.http import HttpResponse, FileResponse
from django.views.decorators.cache import never_cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from utils.health_checks import get_health_status, get_readiness_status
from utils.response import success_response, error_response


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint.
    Returns detailed health status of all system components.
    """
    health = get_health_status()
    
    if health['status'] == 'unhealthy':
        return error_response(
            message='System is unhealthy',
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code='HEALTH_CHECK_FAILED',
            details=health
        )
    
    return success_response(
        data=health,
        message='System is healthy'
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def readiness_check(request):
    """
    Readiness check endpoint.
    Returns whether the service is ready to accept traffic.
    """
    readiness = get_readiness_status()
    
    if readiness['status'] == 'not_ready':
        return error_response(
            message='Service is not ready',
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code='NOT_READY',
            details=readiness
        )
    
    return success_response(
        data=readiness,
        message='Service is ready'
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def liveness_check(request):
    """
    Liveness check endpoint.
    Simple check to verify the service is running.
    """
    return success_response(
        data={'status': 'alive'},
        message='Service is alive'
    )


@never_cache
def frontend_app(request):
    """
    Serve the frontend SPA (Single Page Application).
    Returns index.html for all non-API routes.
    """
    index_file = settings.FRONTEND_DIST_DIR / 'index.html'
    
    if index_file.exists():
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()
        return HttpResponse(content, content_type='text/html')
    else:
        return HttpResponse(
            '<h1>Frontend not found</h1><p>Please build the frontend first.</p>',
            status=404,
            content_type='text/html'
        )


def custom_404_handler(request, exception):
    """
    Custom 404 handler that avoids Django's debug page URL pattern rendering issues.
    """
    from django.http import Http404
    
    # For API requests, return JSON response
    if request.path.startswith('/api/'):
        return error_response(
            message="Resource not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND"
        )
    
    # For non-API requests, serve the frontend app (SPA routing)
    # This allows the frontend router to handle 404s
    return frontend_app(request)
