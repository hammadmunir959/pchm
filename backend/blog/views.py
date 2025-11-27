from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from .models import BlogPost
from .serializers import BlogPostCreateSerializer, BlogPostSerializer
from utils.permissions import IsAdmin, IsPublicOrAdmin


class BlogPostViewSet(viewsets.ModelViewSet):
    queryset = BlogPost.objects.select_related('author')
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return BlogPostCreateSerializer
        return BlogPostSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsPublicOrAdmin()]
        return [IsAdmin()]

    def get_queryset(self):
        queryset = BlogPost.objects.select_related('author')
        action = getattr(self, 'action', None)
        user = getattr(self.request, 'user', None)

        if action == 'list' and (not user or not user.is_authenticated):
            queryset = queryset.filter(status='published')
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=['views'])
        return super().retrieve(request, *args, **kwargs)
