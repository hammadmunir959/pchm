from django.test import TestCase

from .models import CarListing, CarPurchaseRequest


class CarListingModelTests(TestCase):
    def test_string_representation(self):
        listing = CarListing.objects.create(
            make='BMW',
            model='X5',
            year=2022,
            mileage=12000,
            color='Black',
            registration='TEST123',
            price=55000,
            fuel_type='petrol',
            transmission='automatic',
            description='Luxury SUV',
        )

        self.assertEqual(str(listing), 'BMW X5 (TEST123)')


class CarPurchaseRequestTests(TestCase):
    def setUp(self):
        self.listing = CarListing.objects.create(
            make='Audi',
            model='Q7',
            year=2021,
            mileage=8000,
            color='White',
            registration='REQ123',
            price=60000,
            fuel_type='diesel',
            transmission='automatic',
            description='Premium SUV',
        )

    def test_default_status_pending(self):
        purchase_request = CarPurchaseRequest.objects.create(
            car_listing=self.listing,
            name='Jane Smith',
            email='jane@example.com',
            phone='0123456789',
        )

        self.assertEqual(purchase_request.status, 'pending')
