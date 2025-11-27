from rest_framework import viewsets, status
from rest_framework.response import Response

from .models import LandingPageConfig, TeamMember
from .serializers import LandingPageConfigSerializer, TeamMemberSerializer
from utils.permissions import IsAdmin, IsPublicOrAdmin


class LandingPageConfigViewSet(viewsets.ModelViewSet):
    """
    Manage simplified landing page configuration.
    Only one config instance should exist.
    """

    queryset = LandingPageConfig.objects.all()
    serializer_class = LandingPageConfigSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [IsPublicOrAdmin]
        else:
            permission_classes = [IsAdmin]
        return [permission() for permission in permission_classes]

    def list(self, request, *args, **kwargs):
        """Return the first config or create a default one."""
        config = LandingPageConfig.objects.first()
        if not config:
            config = LandingPageConfig.objects.create()
        serializer = self.get_serializer(config, context={"request": request})
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Create config if none exists, otherwise update existing."""
        existing = LandingPageConfig.objects.first()
        if existing:
            # Update existing instead of creating new
            serializer = self.get_serializer(existing, data=request.data, partial=True, context={"request": request})
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update config with request context."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial, context={"request": request})
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve config with request context."""
        instance = self.get_object()
        serializer = self.get_serializer(instance, context={"request": request})
        return Response(serializer.data)


class TeamMemberViewSet(viewsets.ModelViewSet):
    """
    Manage team members for the "Our People" page.
    Public users can list active members, admins can manage all.
    """

    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [IsPublicOrAdmin]
        else:
            permission_classes = [IsAdmin]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filter to active members for public, show all for admins."""
        queryset = super().get_queryset()
        # If user is not admin, only show active members
        if not self.request.user.is_authenticated or not (
            hasattr(self.request.user, "admin_type") or self.request.user.is_staff
        ):
            queryset = queryset.filter(is_active=True)
        return queryset.order_by("order", "name")

    def list(self, request, *args, **kwargs):
        """List team members with request context."""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve team member with request context."""
        instance = self.get_object()
        serializer = self.get_serializer(instance, context={"request": request})
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Create team member with request context."""
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update team member with request context."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial, context={"request": request})
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

