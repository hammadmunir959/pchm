from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from theming.models import Event


class EventModelTests(TestCase):
    def setUp(self):
        """Set up test data."""
        from datetime import date, timedelta
        self.today = date.today()
        self.tomorrow = self.today + timedelta(days=1)
        self.yesterday = self.today - timedelta(days=1)

    def test_create_event(self):
        """Test creating a basic event."""
        event = Event.objects.create(
            name='Test Event',
            slug='test-event',
            start_date=self.today,
            end_date=self.tomorrow,
            theme='christmas',
            priority=1
        )
        self.assertEqual(event.name, 'Test Event')
        self.assertEqual(event.slug, 'test-event')
        self.assertEqual(event.theme, 'christmas')
        self.assertTrue(event.active)
        self.assertFalse(event.recurring_yearly)

    def test_event_str_representation(self):
        """Test event string representation."""
        event = Event.objects.create(
            name='Test Event',
            slug='test-event',
            start_date=self.today,
            end_date=self.tomorrow,
            theme='default'
        )
        expected = f"Test Event ({self.today} → {self.tomorrow})"
        self.assertEqual(str(event), expected)

    def test_event_slug_unique(self):
        """Test that event slugs must be unique."""
        Event.objects.create(
            name='Test Event',
            slug='test-event',
            start_date=self.today,
            end_date=self.tomorrow,
            theme='default'
        )
        with self.assertRaises(IntegrityError):
            Event.objects.create(
                name='Another Event',
                slug='test-event',  # Duplicate slug
                start_date=self.today,
                end_date=self.tomorrow,
                theme='default'
            )

    def test_event_clean_validation(self):
        """Test that end_date must be >= start_date."""
        event = Event(
            name='Invalid Event',
            slug='invalid-event',
            start_date=self.today,
            end_date=self.yesterday,  # End before start
            theme='default'
        )
        with self.assertRaises(ValidationError):
            event.clean()

    def test_event_clean_valid_dates(self):
        """Test that valid dates pass validation."""
        event = Event(
            name='Valid Event',
            slug='valid-event',
            start_date=self.today,
            end_date=self.today,  # Same day is valid
            theme='default'
        )
        try:
            event.clean()
        except ValidationError:
            self.fail("clean() raised ValidationError unexpectedly!")

    def test_event_defaults(self):
        """Test event default values."""
        event = Event.objects.create(
            name='Default Event',
            slug='default-event',
            start_date=self.today,
            end_date=self.tomorrow
        )
        self.assertEqual(event.theme, 'default')
        self.assertEqual(event.priority, 0)
        self.assertTrue(event.active)
        self.assertFalse(event.recurring_yearly)

    def test_event_ordering(self):
        """Test that events are ordered by priority (desc) then start_date."""
        event1 = Event.objects.create(
            name='Low Priority',
            slug='low-priority',
            start_date=self.today,
            end_date=self.tomorrow,
            priority=1
        )
        event2 = Event.objects.create(
            name='High Priority',
            slug='high-priority',
            start_date=self.today,
            end_date=self.tomorrow,
            priority=10
        )
        event3 = Event.objects.create(
            name='Medium Priority',
            slug='medium-priority',
            start_date=self.today,
            end_date=self.tomorrow,
            priority=5
        )
        
        events = list(Event.objects.all())
        self.assertEqual(events[0], event2)  # Highest priority
        self.assertEqual(events[1], event3)  # Medium priority
        self.assertEqual(events[2], event1)  # Lowest priority

