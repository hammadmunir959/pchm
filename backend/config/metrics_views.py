"""
Metrics views for monitoring.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from utils.metrics import MetricsCollector
from utils.permissions import IsAdmin
from utils.response import success_response


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def metrics_view(request):
    """
    Get application metrics.
    Requires admin authentication.
    """
    metrics = MetricsCollector.get_all_metrics()
    return success_response(
        data=metrics,
        message='Metrics retrieved successfully'
    )

