from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as filters
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Vehicle
from .serializers import VehicleSerializer, VehicleCreateSerializer
from utils.permissions import IsAdmin, IsPublicOrAdmin


class VehicleFilter(filters.FilterSet):
    type = filters.ChoiceFilter(choices=Vehicle.TYPE_CHOICES)
    status = filters.ChoiceFilter(choices=Vehicle.STATUS_CHOICES)
    transmission = filters.ChoiceFilter(choices=Vehicle.TRANSMISSION_CHOICES)
    fuel_type = filters.ChoiceFilter(choices=Vehicle.FUEL_CHOICES)
    seats = filters.NumberFilter(field_name='seats', lookup_expr='gte')

    class Meta:
        model = Vehicle
        fields = ['type', 'status', 'transmission', 'fuel_type', 'seats']


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().order_by('-created_at')
    filter_backends = [DjangoFilterBackend]
    filterset_class = VehicleFilter
    
    def get_queryset(self):
        """Optimize queryset with select_related/prefetch_related."""
        queryset = Vehicle.objects.all().order_by('-created_at')
        
        # For list views, we can use only() to limit fields
        if self.action == 'list':
            queryset = queryset.only(
                'id', 'name', 'manufacturer', 'model', 'type', 'status',
                'daily_rate', 'image', 'created_at'
            )
        
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return VehicleCreateSerializer
        return VehicleSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsPublicOrAdmin]
        else:
            permission_classes = [IsAdmin]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def update_status(self, request, pk=None):
        vehicle = self.get_object()
        new_status = request.data.get('status')

        if new_status not in dict(Vehicle.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        vehicle.status = new_status
        vehicle.save(update_fields=['status'])

        serializer = self.get_serializer(vehicle)
        return Response(serializer.data)
