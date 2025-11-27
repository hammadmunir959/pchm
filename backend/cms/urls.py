from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LandingPageConfigViewSet, TeamMemberViewSet

router = DefaultRouter()
router.register(r"landing-config", LandingPageConfigViewSet, basename="landing-config")
router.register(r"team-members", TeamMemberViewSet, basename="team-members")

app_name = "cms"

urlpatterns = [
    path("", include(router.urls)),
]


