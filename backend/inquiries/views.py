from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Inquiry
from .serializers import InquiryCreateSerializer, InquiryReplySerializer, InquirySerializer
from utils.permissions import IsAdmin
from utils.email import notify_inquiry_team, send_inquiry_acknowledgement, send_inquiry_reply


class InquiryFilter(filters.FilterSet):
    status = filters.ChoiceFilter(choices=Inquiry.STATUS_CHOICES)
    source = filters.ChoiceFilter(choices=Inquiry.SOURCE_CHOICES)
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Inquiry
        fields = ['status', 'source', 'is_spam']


class InquiryViewSet(viewsets.ModelViewSet):
    queryset = Inquiry.objects.all().order_by('-created_at')
    filter_backends = [DjangoFilterBackend]
    filterset_class = InquiryFilter
    
    def get_queryset(self):
        """Optimize queryset for admin list views."""
        queryset = Inquiry.objects.all().order_by('-created_at')
        
        # For list views, limit fields
        if self.action == 'list':
            queryset = queryset.only(
                'id', 'name', 'email', 'subject', 'status', 'source',
                'is_spam', 'created_at'
            )
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return InquiryCreateSerializer
        return InquirySerializer

    def get_permissions(self):
        if self.action == 'create':
            return []
        return [IsAdmin()]

    def perform_create(self, serializer):
        inquiry = serializer.save()
        notify_inquiry_team(inquiry)
        send_inquiry_acknowledgement(inquiry)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def update_status(self, request, pk=None):
        inquiry = self.get_object()
        new_status = request.data.get('status')

        if new_status not in dict(Inquiry.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        inquiry.status = new_status
        inquiry.save(update_fields=['status'])
        serializer = self.get_serializer(inquiry)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def mark_spam(self, request, pk=None):
        inquiry = self.get_object()
        inquiry.is_spam = True
        inquiry.spam_score = request.data.get('spam_score')
        inquiry.save(update_fields=['is_spam', 'spam_score'])
        serializer = self.get_serializer(inquiry)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reply_email(self, request, pk=None):
        inquiry = self.get_object()
        reply_serializer = InquiryReplySerializer(data=request.data)
        reply_serializer.is_valid(raise_exception=True)

        reply_message = reply_serializer.validated_data['message']
        send_inquiry_reply(
            inquiry=inquiry,
            reply_message=reply_message,
        )

        inquiry.status = 'replied'
        inquiry.save(update_fields=['status'])

        serializer = self.get_serializer(inquiry)
        return Response(serializer.data, status=status.HTTP_200_OK)
