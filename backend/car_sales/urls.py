from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CarListingViewSet, CarPurchaseRequestViewSet, CarSellRequestViewSet

router = DefaultRouter()
router.register(r'car-listings', CarListingViewSet, basename='car-listing')
router.register(r'car-purchase-requests', CarPurchaseRequestViewSet, basename='car-purchase-request')
router.register(r'car-sell-requests', CarSellRequestViewSet, basename='car-sell-request')

urlpatterns = [
    path('', include(router.urls)),
]



