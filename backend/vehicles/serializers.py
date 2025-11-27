from decimal import Decimal

from rest_framework import serializers

from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = '__all__'

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None


class VehicleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'

    def validate_registration(self, value):
        qs = Vehicle.objects.filter(registration=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Vehicle with this registration already exists.")
        return value

    def validate_daily_rate(self, value):
        if value is None:
            return value
        if value < Decimal('0'):
            raise serializers.ValidationError("Daily rate must be zero or a positive amount.")
        return value

    def validate_seats(self, value):
        if value is None:
            return value
        if value <= 0:
            raise serializers.ValidationError("Seats must be greater than zero.")
        return value


