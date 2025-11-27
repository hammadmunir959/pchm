from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from vehicles.models import Vehicle
from .models import Claim


class ClaimAPITests(APITestCase):
    def setUp(self):
        self.vehicle = Vehicle.objects.create(
            name='Tesla Model S',
            type='sedan',
            registration='TESLA001',
            status='available'
        )
        self.admin = User.objects.create_user(
            username='admin2@example.com',
            email='admin2@example.com',
            password='pass12345',
            admin_type='admin'
        )

    def test_public_can_create_claim(self):
        url = reverse('claim-list')
        payload = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john@example.com',
            'phone': '1234567890',
            'address': '123 Main St',
            'accident_date': '2024-01-01',
            'vehicle_registration': 'TESLA001',
            'insurance_company': 'XYZ Insurance',
            'policy_number': 'POL123',
            'accident_details': 'Minor collision',
            'pickup_location': 'Location A',
            'drop_location': 'Location B',
            'notes': 'Need ASAP'
        }
        response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Claim.objects.count(), 1)

    def test_admin_can_list_claims(self):
        Claim.objects.create(
            first_name='Jane',
            last_name='Doe',
            email='jane@example.com',
            phone='0987654321',
            address='456 Elm St',
            accident_date='2024-01-02',
            vehicle_registration='TESLA001',
            insurance_company='ABC Insurance',
            policy_number='POL456',
            accident_details='Rear end',
            pickup_location='Loc X',
            drop_location='Loc Y'
        )
        url = reverse('claim-list')
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)
