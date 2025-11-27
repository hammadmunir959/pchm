from rest_framework import serializers

from utils.email import (
    notify_purchase_request_team,
    notify_sell_request_team,
    send_purchase_request_acknowledgement,
    send_sell_request_acknowledgement,
)
from .models import CarImage, CarListing, CarPurchaseRequest, CarSellRequest


class CarImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = CarImage
        fields = '__all__'

    def get_image_url(self, obj):
        if obj.image and (request := self.context.get('request')):
            return request.build_absolute_uri(obj.image.url)
        return None


class CarImageUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarImage
        fields = ['image', 'is_primary', 'alt_text']

    def create(self, validated_data):
        car_listing = self.context['car_listing']
        if validated_data.get('is_primary'):
            car_listing.images.filter(is_primary=True).update(is_primary=False)
        return CarImage.objects.create(car_listing=car_listing, **validated_data)


class CarListingSerializer(serializers.ModelSerializer):
    images = CarImageSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = CarListing
        fields = '__all__'

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first()
        if primary and (request := self.context.get('request')):
            return request.build_absolute_uri(primary.image.url)
        return None


class CarPurchaseRequestSerializer(serializers.ModelSerializer):
    car_listing_title = serializers.SerializerMethodField()
    assigned_staff_name = serializers.SerializerMethodField()

    class Meta:
        model = CarPurchaseRequest
        fields = '__all__'

    def get_car_listing_title(self, obj):
        return str(obj.car_listing)

    def get_assigned_staff_name(self, obj):
        if obj.assigned_staff:
            return obj.assigned_staff.get_full_name() or obj.assigned_staff.email
        return None


class CarPurchaseRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarPurchaseRequest
        fields = [
            'name',
            'email',
            'phone',
            'message',
            'offer_price',
            'financing_required',
            'trade_in_details',
        ]

    def create(self, validated_data):
        car_listing = self.context['car_listing']
        purchase_request = CarPurchaseRequest.objects.create(
            car_listing=car_listing,
            **validated_data,
        )
        notify_purchase_request_team(purchase_request)
        send_purchase_request_acknowledgement(purchase_request)
        return purchase_request


class CarSellRequestSerializer(serializers.ModelSerializer):
    vehicle_image_url = serializers.SerializerMethodField()
    assigned_staff_name = serializers.SerializerMethodField()

    class Meta:
        model = CarSellRequest
        fields = '__all__'

    def get_vehicle_image_url(self, obj):
        if obj.vehicle_image and (request := self.context.get('request')):
            return request.build_absolute_uri(obj.vehicle_image.url)
        return None

    def get_assigned_staff_name(self, obj):
        if obj.assigned_staff:
            return obj.assigned_staff.get_full_name() or obj.assigned_staff.email
        return None


class CarSellRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarSellRequest
        fields = [
            'name',
            'email',
            'phone',
            'vehicle_make',
            'vehicle_model',
            'vehicle_year',
            'mileage',
            'message',
            'vehicle_image',
        ]

    def validate(self, data):
        """Ensure at least email or phone is provided"""
        email = data.get('email')
        phone = data.get('phone')
        
        if not email and not phone:
            raise serializers.ValidationError({
                'email': 'Either email or phone must be provided.',
                'phone': 'Either email or phone must be provided.',
            })
        
        return data

    def create(self, validated_data):
        sell_request = CarSellRequest.objects.create(**validated_data)
        notify_sell_request_team(sell_request)
        send_sell_request_acknowledgement(sell_request)
        return sell_request

