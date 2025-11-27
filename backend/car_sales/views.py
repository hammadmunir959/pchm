from django.utils import timezone
from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import CarListing, CarPurchaseRequest, CarSellRequest
from .serializers import (
    CarImageSerializer,
    CarImageUploadSerializer,
    CarListingSerializer,
    CarPurchaseRequestCreateSerializer,
    CarPurchaseRequestSerializer,
    CarSellRequestCreateSerializer,
    CarSellRequestSerializer,
)
from utils.permissions import IsAdmin, IsPublicOrAdmin


class CarListingFilter(filters.FilterSet):
    make = filters.CharFilter(field_name='make', lookup_expr='icontains')
    model = filters.CharFilter(field_name='model', lookup_expr='icontains')
    year = filters.NumberFilter()
    min_price = filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = filters.NumberFilter(field_name='price', lookup_expr='lte')
    fuel_type = filters.ChoiceFilter(choices=CarListing.FUEL_TYPE_CHOICES)
    transmission = filters.ChoiceFilter(choices=CarListing.TRANSMISSION_CHOICES)
    status = filters.ChoiceFilter(choices=CarListing.STATUS_CHOICES)

    class Meta:
        model = CarListing
        fields = ['make', 'model', 'year', 'fuel_type', 'transmission', 'status']


class CarListingViewSet(viewsets.ModelViewSet):
    queryset = CarListing.objects.prefetch_related('images')
    serializer_class = CarListingSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = CarListingFilter

    def get_permissions(self):
        if self.action == 'purchase_request':
            return []
        if self.action in ['list', 'retrieve']:
            return [IsPublicOrAdmin()]
        return [IsAdmin()]

    def get_queryset(self):
        queryset = CarListing.objects.prefetch_related('images')
        action = getattr(self, 'action', None)
        user = getattr(self.request, 'user', None)

        if action == 'list' and (not user or not user.is_authenticated):
            queryset = queryset.filter(status='published')
        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=['views'])
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[])
    def purchase_request(self, request, pk=None):
        listing = self.get_object()
        serializer = CarPurchaseRequestCreateSerializer(
            data=request.data,
            context={'request': request, 'car_listing': listing},
        )
        if serializer.is_valid():
            purchase_request = serializer.save()
            response_serializer = CarPurchaseRequestSerializer(purchase_request)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin], url_path=r'upload[-_]image')
    def upload_image(self, request, pk=None):
        listing = self.get_object()
        serializer = CarImageUploadSerializer(
            data=request.data,
            context={'car_listing': listing},
        )
        if serializer.is_valid():
            image = serializer.save()
            response_serializer = CarImageSerializer(image, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CarPurchaseRequestViewSet(viewsets.ModelViewSet):
    queryset = CarPurchaseRequest.objects.select_related('car_listing', 'assigned_staff')
    serializer_class = CarPurchaseRequestSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'car_listing', 'assigned_staff']

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def update_status(self, request, pk=None):
        purchase_request = self.get_object()
        new_status = request.data.get('status')

        if new_status not in dict(CarPurchaseRequest.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        purchase_request.status = new_status
        if new_status == 'contacted':
            purchase_request.contacted_at = timezone.now()
            update_fields = ['status', 'contacted_at']
        else:
            update_fields = ['status']
        purchase_request.save(update_fields=update_fields)
        serializer = self.get_serializer(purchase_request)
        return Response(serializer.data)


class CarSellRequestViewSet(viewsets.ModelViewSet):
    queryset = CarSellRequest.objects.select_related('assigned_staff')
    serializer_class = CarSellRequestSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'assigned_staff']

    def get_permissions(self):
        if self.action == 'create':
            return []  # Public endpoint for creating sell requests
        return [IsAdmin()]  # Admin only for list, retrieve, update, delete

    def get_serializer_class(self):
        if self.action == 'create':
            return CarSellRequestCreateSerializer
        return CarSellRequestSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            sell_request = serializer.save()
            response_serializer = CarSellRequestSerializer(sell_request, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def update_status(self, request, pk=None):
        sell_request = self.get_object()
        new_status = request.data.get('status')

        if new_status not in dict(CarSellRequest.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        sell_request.status = new_status
        if new_status == 'contacted':
            sell_request.contacted_at = timezone.now()
            update_fields = ['status', 'contacted_at']
        else:
            update_fields = ['status']
        sell_request.save(update_fields=update_fields)
        serializer = self.get_serializer(sell_request)
        return Response(serializer.data)
