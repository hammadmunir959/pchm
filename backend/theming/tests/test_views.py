from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from datetime import date, timedelta
from theming.models import Event
from theming.services.theme_resolver import _today_local_date

User = get_user_model()


class ThemeAPITests(TestCase):
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.today = _today_local_date()
        self.tomorrow = self.today + timedelta(days=1)

    def test_active_theme_api_public_access(self):
        """Test that active theme API is publicly accessible."""
        url = reverse('theming:active-theme')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('theme_key', response.json())
        self.assertIn('theme', response.json())

    def test_active_theme_api_returns_default(self):
        """Test that API returns default theme when no events."""
        url = reverse('theming:active-theme')
        response = self.client.get(url)
        data = response.json()
        self.assertEqual(data['theme_key'], 'default')
        self.assertIsNone(data['event'])

    def test_active_theme_api_returns_event_theme(self):
        """Test that API returns event theme when event is active."""
        Event.objects.create(
            name='Test Event',
            slug='test-event',
            start_date=self.today,
            end_date=self.today,
            theme='christmas',
            priority=1
        )
        url = reverse('theming:active-theme')
        response = self.client.get(url)
        data = response.json()
        self.assertEqual(data['theme_key'], 'christmas')
        self.assertIsNotNone(data['event'])
        self.assertEqual(data['event']['name'], 'Test Event')

    def test_active_theme_api_structure(self):
        """Test that API response has correct structure."""
        url = reverse('theming:active-theme')
        response = self.client.get(url)
        data = response.json()
        
        # Check required fields
        self.assertIn('theme_key', data)
        self.assertIn('theme', data)
        self.assertIn('event', data)
        
        # Check theme structure
        theme = data['theme']
        self.assertIn('name', theme)
        self.assertIn('primary_color', theme)
        self.assertIn('secondary_color', theme)
        self.assertIn('banner', theme)
        self.assertIn('animations', theme)
        self.assertIn('popup', theme)


class ThemeSelectorAdminTests(TestCase):
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            is_staff=True,
            is_superuser=True
        )
        self.today = _today_local_date()

    def test_theme_selector_requires_staff(self):
        """Test that theme selector requires staff access."""
        url = reverse('admin:theming_theme_selector')
        response = self.client.get(url)
        # Should redirect to login
        self.assertEqual(response.status_code, 302)

    def test_theme_selector_accessible_to_staff(self):
        """Test that staff can access theme selector."""
        self.client.login(email='admin@test.com', password='testpass123')
        url = reverse('admin:theming_theme_selector')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Theme Selector')

    def test_theme_selector_set_preview(self):
        """Test setting preview theme via POST."""
        self.client.login(email='admin@test.com', password='testpass123')
        url = reverse('admin:theming_theme_selector')
        
        response = self.client.post(url, {
            'action': 'set_preview',
            'theme_key': 'christmas'
        })
        self.assertEqual(response.status_code, 302)  # Redirect after POST
        
        # Check session
        session = self.client.session
        self.assertEqual(session.get('preview_theme'), 'christmas')

    def test_theme_selector_clear_preview(self):
        """Test clearing preview theme."""
        self.client.login(email='admin@test.com', password='testpass123')
        url = reverse('admin:theming_theme_selector')
        
        # Set preview first
        session = self.client.session
        session['preview_theme'] = 'christmas'
        session.save()
        
        # Clear preview
        response = self.client.post(url, {
            'action': 'clear_preview'
        })
        self.assertEqual(response.status_code, 302)
        
        # Check session
        session = self.client.session
        self.assertIsNone(session.get('preview_theme'))

    def test_theme_selector_shows_current_theme(self):
        """Test that theme selector shows current active theme."""
        Event.objects.create(
            name='Test Event',
            slug='test-event',
            start_date=self.today,
            end_date=self.today,
            theme='christmas',
            priority=1
        )
        
        self.client.login(email='admin@test.com', password='testpass123')
        url = reverse('admin:theming_theme_selector')
        response = self.client.get(url)
        self.assertContains(response, 'Christmas')
        self.assertContains(response, 'christmas')

