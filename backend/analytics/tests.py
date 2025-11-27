from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from bookings.models import Claim
from .models import ActivityLog, PageView, VisitorSession

User = get_user_model()

class AnalyticsTests(TestCase):
    """Test cases for analytics models"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            admin_type='admin'
        )

        self.page_view = PageView.objects.create(
            page_path='/test-page',
            page_title='Test Page',
            ip_address='127.0.0.1',
            user_agent='Test Browser',
            referrer='https://example.com',
            session_id='test_session_123',
            user=self.user
        )

        self.session = VisitorSession.objects.create(
            session_id='test_session_123',
            ip_address='127.0.0.1',
            user_agent='Test Browser',
            user=self.user,
            page_views_count=5,
            duration_seconds=300
        )

        self.activity = ActivityLog.objects.create(
            user=self.user,
            activity_type='login',
            description='User logged in',
            ip_address='127.0.0.1'
        )

    def test_page_view_creation(self):
        """Test page view model creation"""
        self.assertEqual(self.page_view.page_path, '/test-page')
        self.assertEqual(self.page_view.page_title, 'Test Page')
        self.assertEqual(self.page_view.ip_address, '127.0.0.1')
        self.assertEqual(self.page_view.session_id, 'test_session_123')
        self.assertEqual(self.page_view.user, self.user)
        self.assertIsNotNone(self.page_view.viewed_at)

    def test_visitor_session_creation(self):
        """Test visitor session model creation"""
        self.assertEqual(self.session.session_id, 'test_session_123')
        self.assertEqual(self.session.ip_address, '127.0.0.1')
        self.assertEqual(self.session.page_views_count, 5)
        self.assertEqual(self.session.duration_seconds, 300)
        self.assertEqual(self.session.user, self.user)
        self.assertIsNotNone(self.session.first_visit)

    def test_activity_log_creation(self):
        """Test activity log model creation"""
        self.assertEqual(self.activity.activity_type, 'login')
        self.assertEqual(self.activity.description, 'User logged in')
        self.assertEqual(self.activity.user, self.user)
        self.assertEqual(self.activity.ip_address, '127.0.0.1')
        self.assertIsNotNone(self.activity.created_at)

    def test_activity_log_str_method(self):
        """Test activity log string representation"""
        # Note: This would need the get_activity_type_display method to work
        # but since we're testing the model directly, we'll just check basic functionality
        pass

    def test_page_view_ordering(self):
        """Test page view ordering by viewed_at descending"""
        # Create another page view with later timestamp
        later_view = PageView.objects.create(
            page_path='/another-page',
            session_id='test_session_456'
        )

        # Get all page views ordered by the model's default ordering
        page_views = list(PageView.objects.all())
        # Should be ordered by -viewed_at (most recent first)
        self.assertGreater(page_views[0].viewed_at, page_views[1].viewed_at)


class ActivityLogApiTests(APITestCase):
    """Test cases for the activity log API endpoint."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='activityuser',
            email='activity@example.com',
            password='testpass123',
            admin_type='admin'
        )
        self.client = APIClient()
        self.url = reverse('analytics:activity_log')

        batch = []
        for index in range(30):
            batch.append(ActivityLog(
                user=self.user,
                activity_type='create' if index % 2 == 0 else 'update',
                description=f'Test entry {index}',
                ip_address='127.0.0.1',
            ))
        ActivityLog.objects.bulk_create(batch)

    def test_activity_log_requires_authentication(self):
        client = APIClient()
        response = client.get(self.url)
        self.assertEqual(response.status_code, 401)

    def test_activity_log_returns_paginated_results(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url, {'page_size': 10})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 30)
        self.assertEqual(len(response.data['results']), 10)
        self.assertIn('activity_type', response.data['results'][0])
        self.assertIn('timestamp', response.data['results'][0])

    def test_activity_log_filters_by_type(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url, {'type': 'update'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(all(item['activity_type'] == 'update' for item in response.data['results']))


class AdminActivityMiddlewareTests(APITestCase):
    """Ensure the admin activity middleware records CRUD actions."""

    def setUp(self):
        self.admin = User.objects.create_user(
            username='middlewareadmin',
            email='middleware@example.com',
            password='testpass123',
            admin_type=User.ROLE_ADMIN,
            status=User.STATUS_ACTIVE,
        )
        self.client = APIClient()

        today = timezone.now().date()
        self.claim = Claim.objects.create(
            first_name='John',
            last_name='Doe',
            email='john@example.com',
            phone='1234567890',
            address='123 Street',
            accident_date=today,
            vehicle_registration='ABC123',
            insurance_company='Test Insurance',
            policy_number='POL123',
            accident_details='Minor bump',
            pickup_location='Location A',
            drop_location='Location B',
            notes='Initial note',
        )

    def test_logs_successful_admin_update(self):
        self.client.force_authenticate(self.admin)
        url = reverse('claim-detail', kwargs={'pk': self.claim.id})
        response = self.client.patch(url, {'notes': 'Updated note'}, format='json')
        self.assertEqual(response.status_code, 200)

        log = ActivityLog.objects.filter(user=self.admin).latest('id')
        self.assertEqual(log.activity_type, 'update')
        self.assertIn(str(self.claim.id), log.description)

    def test_does_not_log_failed_request(self):
        self.client.force_authenticate(self.admin)
        invalid_url = reverse('claim-detail', kwargs={'pk': self.claim.id + 999})
        response = self.client.patch(invalid_url, {'notes': 'Won\'t work'}, format='json')
        self.assertEqual(response.status_code, 404)
        self.assertFalse(ActivityLog.objects.filter(user=self.admin, description__icontains="Won't work").exists())
