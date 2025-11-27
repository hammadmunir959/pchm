from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from .models import FAQ
from .serializers import FAQSerializer
from utils.permissions import IsAdmin, IsPublicOrAdmin

class FAQFilter(filters.FilterSet):
    """Filter for FAQs"""
    category = filters.ChoiceFilter(choices=FAQ.CATEGORY_CHOICES)
    is_active = filters.BooleanFilter()

    class Meta:
        model = FAQ
        fields = ['category', 'is_active']

class FAQViewSet(viewsets.ModelViewSet):
    """FAQ management"""
    queryset = FAQ.objects.select_related('created_by')
    serializer_class = FAQSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = FAQFilter
    search_fields = ['question', 'answer']
    ordering_fields = ['display_order', 'created_at']
    ordering = ['display_order', '-created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsPublicOrAdmin]
        else:
            permission_classes = [IsAdmin]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = FAQ.objects.select_related('created_by')
        if self.action == 'list' and not self.request.user.is_authenticated:
            # Only show active FAQs to public
            queryset = queryset.filter(is_active=True)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
