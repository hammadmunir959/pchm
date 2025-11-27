from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as filters
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Claim
from .serializers import ClaimSerializer, ClaimCreateSerializer
from utils.permissions import IsAdmin
from utils.email import send_claim_confirmation


class ClaimFilter(filters.FilterSet):
    status = filters.ChoiceFilter(choices=Claim.STATUS_CHOICES)
    created_after = filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Claim
        fields = ['status', 'assigned_staff']


class ClaimViewSet(viewsets.ModelViewSet):
    queryset = Claim.objects.select_related('vehicle', 'assigned_staff').prefetch_related('documents')
    filter_backends = [DjangoFilterBackend]
    filterset_class = ClaimFilter

    def get_serializer_class(self):
        if self.action == 'create':
            return ClaimCreateSerializer
        return ClaimSerializer

    def get_permissions(self):
        if self.action == 'create':
            return []
        return [IsAdmin()]

    def perform_create(self, serializer):
        claim = serializer.save()
        send_claim_confirmation(claim.email, claim)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        claim = self.get_object()
        claim.status = 'approved'
        claim.save(update_fields=['status'])
        serializer = self.get_serializer(claim)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def cancel(self, request, pk=None):
        claim = self.get_object()
        claim.status = 'cancelled'
        claim.save(update_fields=['status'])
        serializer = self.get_serializer(claim)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def assign_staff(self, request, pk=None):
        claim = self.get_object()
        staff_id = request.data.get('staff_id')

        from accounts.models import User
        try:
            staff = User.objects.get(id=staff_id, admin_type__in=['admin', 'super_admin'])
        except User.DoesNotExist:
            return Response({'error': 'Invalid staff member'}, status=status.HTTP_400_BAD_REQUEST)

        claim.assigned_staff = staff
        claim.save(update_fields=['assigned_staff'])
        serializer = self.get_serializer(claim)
        return Response(serializer.data)
