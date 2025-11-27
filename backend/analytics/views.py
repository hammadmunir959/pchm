from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import ExtractHour, TruncDate

from vehicles.models import Vehicle
from bookings.models import Claim
from testimonials.models import Testimonial
from car_sales.models import CarListing, CarPurchaseRequest
from newsletter.models import NewsletterSubscriber
from gallery.models import GalleryImage
from faq.models import FAQ
from inquiries.models import Inquiry
from .models import PageView, ActivityLog, VisitorSession
from .serializers import ActivityLogSerializer
from .utils import get_activity_icon


class ActivityLogPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


def _safe_percentage(value: int | float, total: int | float) -> float:
    if not total:
        return 0.0
    return round((value / total) * 100, 2)


def _classify_referrer(referrer: str | None) -> str:
    if not referrer:
        return 'Direct'
    ref = referrer.lower()
    social_domains = ['facebook', 'instagram', 'linkedin', 'twitter', 't.co', 'x.com']
    search_domains = ['google', 'bing', 'yahoo', 'duckduckgo']

    if any(domain in ref for domain in search_domains):
        return 'Search'
    if any(domain in ref for domain in social_domains):
        return 'Social'
    if 'email' in ref:
        return 'Email'
    return 'Referral'


def _classify_device(user_agent: str | None) -> str:
    if not user_agent:
        return 'Unknown'

    agent = user_agent.lower()
    if 'ipad' in agent or 'tablet' in agent:
        return 'Tablet'
    if 'mobile' in agent or 'iphone' in agent or 'android' in agent:
        return 'Mobile'
    return 'Desktop'


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """Get dashboard summary statistics"""
    now = timezone.now()
    today = now.date()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # Basic counts
    data = {
        'totalVehicles': Vehicle.objects.count(),
        'totalBookings': Claim.objects.count(),
        'inquiries': Claim.objects.filter(created_at__date=today).count(),
        'testimonials': Testimonial.objects.filter(status='approved').count(),
        'carListings': CarListing.objects.filter(status='published').count(),
        'purchaseRequests': CarPurchaseRequest.objects.count(),
        'galleryImages': GalleryImage.objects.filter(is_active=True).count(),
        'newsletterSubscribers': NewsletterSubscriber.objects.filter(is_active=True).count(),
        'faqItems': FAQ.objects.filter(is_active=True).count(),
    }

    # Analytics data
    data.update({
        'pageViewsToday': PageView.objects.filter(viewed_at__date=today).count(),
        'pageViewsWeek': PageView.objects.filter(viewed_at__gte=week_ago).count(),
        'pageViewsMonth': PageView.objects.filter(viewed_at__gte=month_ago).count(),
        'uniqueVisitorsToday': PageView.objects.filter(viewed_at__date=today).values('session_id').distinct().count(),
        'uniqueVisitorsWeek': PageView.objects.filter(viewed_at__gte=week_ago).values('session_id').distinct().count(),
        'uniqueVisitorsMonth': PageView.objects.filter(viewed_at__gte=month_ago).values('session_id').distinct().count(),
    })

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def booking_trends(request):
    """Get multi-metric trends for the last 8 months"""
    from django.db.models.functions import TruncMonth

    end_date = timezone.now()
    start_date = end_date - timedelta(days=240)  # 8 months

    def get_monthly_counts(queryset, date_field: str):
        return queryset.filter(
            **{f"{date_field}__gte": start_date, f"{date_field}__lte": end_date}
        ).annotate(
            month=TruncMonth(date_field)
        ).values('month').annotate(
            total=Count('id')
        ).order_by('month')

    def to_lookup(data):
        lookup = {}
        for entry in data:
            month_key = entry['month'].strftime('%B %Y')
            lookup[month_key] = entry['total']
        return lookup

    bookings_lookup = to_lookup(get_monthly_counts(Claim.objects, 'created_at'))
    inquiries_lookup = to_lookup(get_monthly_counts(Inquiry.objects, 'created_at'))
    purchase_lookup = to_lookup(get_monthly_counts(CarPurchaseRequest.objects, 'created_at'))

    # Generate month range
    months = []
    current_date = start_date.replace(day=1)
    while current_date <= end_date:
        months.append(current_date.strftime('%B %Y'))
        if current_date.month == 12:
            current_date = current_date.replace(year=current_date.year + 1, month=1)
        else:
            current_date = current_date.replace(month=current_date.month + 1)

    result = [
        {
            'month': month_key,
            'bookings': bookings_lookup.get(month_key, 0),
            'inquiries': inquiries_lookup.get(month_key, 0),
            'purchaseRequests': purchase_lookup.get(month_key, 0),
        }
        for month_key in months
    ]

    return Response(result[-8:])  # Return last 8 months

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vehicle_usage(request):
    """Get vehicle usage distribution"""
    usage_data = Vehicle.objects.values('type').annotate(
        count=Count('id')
    ).order_by('-count')

    total_vehicles = Vehicle.objects.count()
    result = []

    for item in usage_data:
        result.append({
            'name': dict(Vehicle.TYPE_CHOICES)[item['type']],
            'value': item['count'],
            'percentage': round((item['count'] / total_vehicles) * 100, 1) if total_vehicles > 0 else 0
        })

    return Response(result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_activity(request):
    """Get recent activity feed"""
    activities = ActivityLog.objects.select_related('user').order_by('-created_at')[:20]

    result = []
    for activity in activities:
        result.append({
            'id': activity.id,
            'text': f"{activity.get_activity_type_display()} - {activity.description}",
            'icon': get_activity_icon(activity.activity_type),
            'timestamp': activity.created_at,
            'user': activity.user.get_full_name() if activity.user else 'System'
        })

    return Response(result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activity_log(request):
    """Return paginated activity log with optional filters."""
    queryset = ActivityLog.objects.select_related('user').order_by('-created_at')

    activity_type = request.query_params.get('type')
    search_query = request.query_params.get('q')

    if activity_type:
        queryset = queryset.filter(activity_type=activity_type)

    if search_query:
        queryset = queryset.filter(
            Q(description__icontains=search_query)
            | Q(user__first_name__icontains=search_query)
            | Q(user__last_name__icontains=search_query)
            | Q(user__email__icontains=search_query)
        )

    paginator = ActivityLogPagination()
    paginated_queryset = paginator.paginate_queryset(queryset, request)
    serializer = ActivityLogSerializer(paginated_queryset, many=True)

    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def web_analytics_overview(request):
    """Provide detailed website analytics for the dashboard."""
    period_param = request.query_params.get('period', '30d')
    period_map = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
    }
    days = period_map.get(period_param, 30)
    days = max(days, 1)

    now = timezone.now()
    start = (now - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)

    pageviews_qs = PageView.objects.filter(viewed_at__gte=start, viewed_at__lte=now)
    visitor_sessions_qs = VisitorSession.objects.filter(last_activity__gte=start)

    total_views = pageviews_qs.count()
    unique_visitors = pageviews_qs.exclude(session_id="").values('session_id').distinct().count()
    total_sessions = visitor_sessions_qs.count()

    avg_session_duration = visitor_sessions_qs.filter(duration_seconds__isnull=False).aggregate(
        avg=Avg('duration_seconds')
    )['avg'] or 0

    total_duration = visitor_sessions_qs.filter(duration_seconds__isnull=False).aggregate(
        total=Sum('duration_seconds')
    )['total'] or 0

    avg_pages_per_session = visitor_sessions_qs.aggregate(
        avg=Avg('page_views_count')
    )['avg'] or 0

    bounce_sessions = visitor_sessions_qs.filter(page_views_count__lte=1).count()
    returning_sessions = visitor_sessions_qs.filter(page_views_count__gte=3).count()

    raw_daily = list(
        pageviews_qs
        .annotate(day=TruncDate('viewed_at'))
        .values('day')
        .annotate(
            views=Count('id'),
            unique_visitors=Count('session_id', distinct=True)
        )
    )
    daily_lookup = {entry['day']: entry for entry in raw_daily}
    traffic_trend = []
    for offset in range(days):
        current_day = (start + timedelta(days=offset)).date()
        entry = daily_lookup.get(current_day)
        traffic_trend.append({
            'date': current_day.isoformat(),
            'views': entry['views'] if entry else 0,
            'uniqueVisitors': entry['unique_visitors'] if entry else 0,
        })

    raw_hourly = list(
        pageviews_qs
        .annotate(hour=ExtractHour('viewed_at'))
        .values('hour')
        .annotate(views=Count('id'))
    )
    hourly_lookup = {entry['hour']: entry['views'] for entry in raw_hourly}
    hourly_distribution = [
        {'hour': hour, 'views': hourly_lookup.get(hour, 0)}
        for hour in range(24)
    ]

    top_pages_qs = list(
        pageviews_qs
        .values('page_path', 'page_title')
        .annotate(views=Count('id'))
        .order_by('-views')[:8]
    )
    top_pages = [
        {
            'path': item['page_path'],
            'title': item['page_title'],
            'views': item['views'],
            'share': _safe_percentage(item['views'], total_views),
        }
        for item in top_pages_qs
    ]

    source_totals: dict[str, int] = {}
    for referrer in pageviews_qs.values_list('referrer', flat=True):
        source = _classify_referrer(referrer)
        source_totals[source] = source_totals.get(source, 0) + 1
    traffic_sources = [
        {
            'source': source,
            'views': views,
            'percentage': _safe_percentage(views, total_views),
        }
        for source, views in sorted(source_totals.items(), key=lambda item: item[1], reverse=True)
    ][:6]

    device_totals: dict[str, int] = {}
    for agent in pageviews_qs.values_list('user_agent', flat=True):
        device = _classify_device(agent)
        device_totals[device] = device_totals.get(device, 0) + 1
    device_breakdown = [
        {
            'device': device,
            'views': views,
            'percentage': _safe_percentage(views, total_views),
        }
        for device, views in sorted(device_totals.items(), key=lambda item: item[1], reverse=True)
    ]

    response_payload = {
        'period': period_param if period_param in period_map else '30d',
        'range': {
            'start': start.isoformat(),
            'end': now.isoformat(),
        },
        'headline': {
            'totalViews': total_views,
            'uniqueVisitors': unique_visitors,
            'totalSessions': total_sessions,
            'avgSessionDurationSeconds': round(avg_session_duration, 2),
            'avgPagesPerSession': round(avg_pages_per_session or 0, 2),
            'viewerMinutes': round(total_duration / 60, 2),
            'bounceRate': round(_safe_percentage(bounce_sessions, total_sessions), 2),
            'returningVisitorRate': round(_safe_percentage(returning_sessions, total_sessions), 2),
        },
        'trafficTrend': traffic_trend,
        'hourlyDistribution': hourly_distribution,
        'topPages': top_pages,
        'trafficSources': traffic_sources,
        'deviceBreakdown': device_breakdown,
        'engagement': {
            'sessions': total_sessions,
            'avgSessionDurationSeconds': round(avg_session_duration, 2),
            'avgPagesPerSession': round(avg_pages_per_session or 0, 2),
            'totalDurationSeconds': total_duration,
        },
    }

    return Response(response_payload)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chatbot_stats(request):
    """Get chatbot usage statistics"""
    from chatbot.models import Conversation, ConversationMessage
    from django.db.models import Avg, Count

    # Basic stats
    total_conversations = Conversation.objects.count()
    total_messages = ConversationMessage.objects.count()
    leads_generated = Conversation.objects.filter(is_lead=True).count()

    # Average response time (if available)
    avg_response_time = ConversationMessage.objects.filter(
        response_time_ms__isnull=False
    ).aggregate(avg_time=Avg('response_time_ms'))['avg_time']

    return Response({
        'totalConversations': total_conversations,
        'totalMessages': total_messages,
        'leadsCollected': leads_generated,
        'avgResponseTime': f"{avg_response_time:.0f}ms" if avg_response_time else "N/A"
    })
