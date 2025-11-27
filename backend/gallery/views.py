from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from .models import GalleryImage
from .serializers import GalleryImageSerializer
from utils.permissions import IsAdmin, IsPublicOrAdmin

class GalleryImageFilter(filters.FilterSet):
    """Filter for gallery images"""
    category = filters.ChoiceFilter(choices=GalleryImage.CATEGORY_CHOICES)
    is_active = filters.BooleanFilter()

    class Meta:
        model = GalleryImage
        fields = ['category', 'is_active']

class GalleryImageViewSet(viewsets.ModelViewSet):
    """Gallery image management"""
    queryset = GalleryImage.objects.select_related('uploaded_by')
    serializer_class = GalleryImageSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = GalleryImageFilter
    search_fields = ['title', 'description']
    ordering_fields = ['uploaded_at', 'display_order']
    ordering = ['display_order', '-uploaded_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsPublicOrAdmin]
        else:
            permission_classes = [IsAdmin]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = GalleryImage.objects.select_related('uploaded_by')
        if self.action == 'list' and not self.request.user.is_authenticated:
            # Only show active images to public
            queryset = queryset.filter(is_active=True)
        return queryset

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
