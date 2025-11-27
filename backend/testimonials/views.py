from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Testimonial
from .serializers import TestimonialSerializer, TestimonialCreateSerializer
from .throttles import TestimonialSubmissionThrottle
from utils.permissions import IsAdmin, IsPublicOrAdmin


class TestimonialViewSet(viewsets.ModelViewSet):
    queryset = Testimonial.objects.all().order_by('-created_at')
    filter_backends = []

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TestimonialCreateSerializer
        return TestimonialSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Public can view approved testimonials
            permission_classes = [IsPublicOrAdmin]
        elif self.action == 'create':
            # Public can create testimonials (with rate limiting)
            permission_classes = [AllowAny]
        else:
            # Only admins can update/delete
            permission_classes = [IsAdmin]
        return [permission() for permission in permission_classes]

    def get_throttles(self):
        """Apply rate limiting only for create action"""
        if self.action == 'create':
            return [TestimonialSubmissionThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        queryset = Testimonial.objects.all().order_by('-created_at')
        # Public users only see approved testimonials
        if self.action == 'list' and not self.request.user.is_authenticated:
            queryset = queryset.filter(status='approved')
        
        # Optimize for list views
        if self.action == 'list':
            queryset = queryset.only(
                'id', 'name', 'rating', 'feedback', 'status', 'created_at'
            )
        
        return queryset

    def create(self, request, *args, **kwargs):
        """Override create to ensure status is always 'approved' (published) for public submissions"""
        # Remove status from request data for public submissions (it will be set to approved by serializer)
        if not request.user.is_authenticated and 'status' in request.data:
            request.data.pop('status')
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        """Approve/publish a testimonial"""
        testimonial = self.get_object()
        testimonial.status = 'approved'
        testimonial.save(update_fields=['status'])
        serializer = self.get_serializer(testimonial)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def reject(self, request, pk=None):
        """Reject a testimonial"""
        testimonial = self.get_object()
        testimonial.status = 'rejected'
        testimonial.save(update_fields=['status'])
        serializer = self.get_serializer(testimonial)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def publish(self, request, pk=None):
        """Publish a testimonial (same as approve)"""
        testimonial = self.get_object()
        testimonial.status = 'approved'
        testimonial.save(update_fields=['status'])
        serializer = self.get_serializer(testimonial)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def archive(self, request, pk=None):
        """Archive a testimonial"""
        testimonial = self.get_object()
        testimonial.status = 'archived'
        testimonial.save(update_fields=['status'])
        serializer = self.get_serializer(testimonial)
        return Response(serializer.data)
