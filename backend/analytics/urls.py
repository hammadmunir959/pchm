from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('dashboard/summary/', views.dashboard_summary, name='dashboard_summary'),
    path('dashboard/booking-trends/', views.booking_trends, name='booking_trends'),
    path('dashboard/vehicle-usage/', views.vehicle_usage, name='vehicle_usage'),
    path('dashboard/recent-activity/', views.recent_activity, name='recent_activity'),
    path('dashboard/activity-log/', views.activity_log, name='activity_log'),
    path('dashboard/chatbot-stats/', views.chatbot_stats, name='chatbot_stats'),
    path('dashboard/web-overview/', views.web_analytics_overview, name='web_analytics_overview'),
]
