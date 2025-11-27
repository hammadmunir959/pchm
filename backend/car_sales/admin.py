from django.contrib import admin

from .models import CarImage, CarListing, CarPurchaseRequest, CarSellRequest


class CarImageInline(admin.TabularInline):
    model = CarImage
    extra = 1


@admin.register(CarListing)
class CarListingAdmin(admin.ModelAdmin):
    list_display = ('make', 'model', 'year', 'price', 'status', 'featured')
    list_filter = ('status', 'featured', 'fuel_type', 'transmission')
    search_fields = ('make', 'model', 'registration')
    inlines = [CarImageInline]
    readonly_fields = ('created_at', 'updated_at', 'published_at', 'sold_at')


@admin.register(CarPurchaseRequest)
class CarPurchaseRequestAdmin(admin.ModelAdmin):
    list_display = ('car_listing', 'name', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('name', 'email', 'car_listing__make', 'car_listing__model')
    readonly_fields = ('created_at', 'updated_at', 'contacted_at')


@admin.register(CarSellRequest)
class CarSellRequestAdmin(admin.ModelAdmin):
    list_display = ('name', 'vehicle_make', 'vehicle_model', 'email', 'phone', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('name', 'email', 'phone', 'vehicle_make', 'vehicle_model')
    readonly_fields = ('created_at', 'updated_at', 'contacted_at')
