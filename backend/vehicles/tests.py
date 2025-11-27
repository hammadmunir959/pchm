from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from .models import Vehicle


class VehicleAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='pass12345',
            admin_type='admin'
        )
        self.vehicle = Vehicle.objects.create(
            name='Test BMW X5',
            type='suv',
            registration='TEST123',
            status='available'
        )

    def test_list_vehicles_is_public(self):
        url = reverse('vehicle-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_admin_can_create_vehicle(self):
        url = reverse('vehicle-list')
        self.client.force_authenticate(user=self.admin)
        payload = {
            'name': 'Audi A6',
            'type': 'sedan',
            'registration': 'AUDI001',
            'status': 'available'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Vehicle.objects.filter(registration='AUDI001').exists())
