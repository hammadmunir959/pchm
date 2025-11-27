from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'consents', views.CookieConsentViewSet)

app_name = 'cookie_consent'

urlpatterns = [
    path('', include(router.urls)),
    path('submit/', views.submit_cookie_consent, name='submit_consent'),
]
