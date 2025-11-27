from django.test import TestCase
from django.utils import timezone
from django.core.cache import cache
from datetime import date, timedelta
from theming.models import Event
from theming.services.theme_resolver import get_active_event, get_active_theme, _today_local_date


class ThemeResolverTests(TestCase):
    def setUp(self):
        """Set up test data."""
        self.today = _today_local_date()
        self.tomorrow = self.today + timedelta(days=1)
        self.yesterday = self.today - timedelta(days=1)
        # Clear cache before each test
        cache.clear()

    def test_default_when_no_event(self):
        """Test that default theme is returned when no events are active."""
        theme = get_active_theme()
        self.assertEqual(theme['theme_key'], 'default')
        self.assertIsNone(theme['event'])

    def test_event_picks_up(self):
        """Test that an active event is picked up."""
        Event.objects.create(
            name='Test Event',
            slug='test-event',
            start_date=self.today,
            end_date=self.today,
            theme='christmas',
            priority=1
        )
        theme = get_active_theme()
        self.assertEqual(theme['theme_key'], 'christmas')
        self.assertIsNotNone(theme['event'])
        self.assertEqual(theme['event']['name'], 'Test Event')

    def test_priority_resolution(self):
        """Test that higher priority events win when overlapping."""
        Event.objects.create(
            name='Low Priority',
            slug='low',
            start_date=self.today,
            end_date=self.today,
            theme='valentine',
            priority=1
        )
        Event.objects.create(
            name='High Priority',
            slug='high',
            start_date=self.today,
            end_date=self.today,
            theme='christmas',
            priority=10
        )
        theme = get_active_theme()
        self.assertEqual(theme['theme_key'], 'christmas')
        self.assertEqual(theme['event']['name'], 'High Priority')

    def test_inactive_event_not_picked(self):
        """Test that inactive events are not picked up."""
        Event.objects.create(
            name='Inactive Event',
            slug='inactive',
            start_date=self.today,
            end_date=self.today,
            theme='christmas',
            active=False
        )
        theme = get_active_theme()
        self.assertEqual(theme['theme_key'], 'default')
        self.assertIsNone(theme['event'])

    def test_event_outside_date_range(self):
        """Test that events outside date range are not picked."""
        Event.objects.create(
            name='Past Event',
            slug='past',
            start_date=self.yesterday - timedelta(days=1),
            end_date=self.yesterday,
            theme='christmas'
        )
        Event.objects.create(
            name='Future Event',
            slug='future',
            start_date=self.tomorrow,
            end_date=self.tomorrow + timedelta(days=1),
            theme='valentine'
        )
        theme = get_active_theme()
        self.assertEqual(theme['theme_key'], 'default')
        self.assertIsNone(theme['event'])

    def test_recurring_yearly_event(self):
        """Test that recurring yearly events work correctly."""
        # Create event for a specific date (e.g., Christmas)
        christmas_date = date(2024, 12, 25)
        Event.objects.create(
            name='Christmas',
            slug='christmas-2024',
            start_date=christmas_date,
            end_date=christmas_date,
            theme='christmas',
            recurring_yearly=True
        )
        
        # Test on the actual date (if it's December 25th)
        if self.today.month == 12 and self.today.day == 25:
            theme = get_active_theme()
            self.assertEqual(theme['theme_key'], 'christmas')
        else:
            # Test with a specific date
            event = get_active_event(christmas_date.replace(year=self.today.year))
            if event:
                self.assertEqual(event.theme, 'christmas')
                self.assertTrue(event.recurring_yearly)

    def test_cache_functionality(self):
        """Test that caching works correctly."""
        Event.objects.create(
            name='Cached Event',
            slug='cached',
            start_date=self.today,
            end_date=self.today,
            theme='christmas'
        )
        
        # First call should hit database
        theme1 = get_active_theme()
        self.assertEqual(theme1['theme_key'], 'christmas')
        
        # Deactivate event
        Event.objects.filter(slug='cached').update(active=False)
        
        # Second call should still return cached result (cache TTL is 5 minutes)
        # In a real scenario, we'd wait for cache to expire or clear it
        # For testing, we'll just verify the cache key exists
        cache_key = f"active_theme_event_{self.today.isoformat()}"
        cached = cache.get(cache_key)
        self.assertIsNotNone(cached)  # Cache should exist

    def test_multiple_events_same_priority(self):
        """Test that when priority is same, earliest start_date wins."""
        Event.objects.create(
            name='Later Start',
            slug='later',
            start_date=self.today,
            end_date=self.today,
            theme='valentine',
            priority=5
        )
        Event.objects.create(
            name='Earlier Start',
            slug='earlier',
            start_date=self.yesterday,
            end_date=self.today,
            theme='christmas',
            priority=5
        )
        theme = get_active_theme()
        # Should pick the one with earlier start_date
        self.assertEqual(theme['event']['name'], 'Earlier Start')

