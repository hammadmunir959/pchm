from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'subscribers', views.NewsletterSubscriberViewSet)
router.register(r'campaigns', views.NewsletterCampaignViewSet)

app_name = 'newsletter'

urlpatterns = [
    path('', include(router.urls)),
    path('subscribe/', views.subscribe_newsletter, name='subscribe'),
    path('unsubscribe/', views.unsubscribe_newsletter, name='unsubscribe'),
    path('campaigns/<int:pk>/open.gif', views.campaign_open_pixel, name='campaign-open'),
    path('campaigns/<int:pk>/click', views.campaign_click_redirect, name='campaign-click'),
]
