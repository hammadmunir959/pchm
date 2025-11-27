from django.core.management.base import BaseCommand
from django.test import Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from datetime import date, timedelta
from theming.models import Event
from theming.services.theme_resolver import get_active_theme, get_active_event, _today_local_date

User = get_user_model()


class Command(BaseCommand):
    help = "Test the theming system - verify API, events, and theme resolution"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("Testing Theming System"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        
        # Test 1: Check API endpoint
        self.stdout.write("\n[1] Testing API Endpoint...")
        self._test_api_endpoint()
        
        # Test 2: Check active theme resolution
        self.stdout.write("\n[2] Testing Theme Resolution...")
        self._test_theme_resolution()
        
        # Test 3: Check events
        self.stdout.write("\n[3] Testing Events...")
        self._test_events()
        
        # Test 4: Check cache
        self.stdout.write("\n[4] Testing Cache...")
        self._test_cache()
        
        # Summary
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("Testing Complete!"))
        self.stdout.write("=" * 60)

    def _test_api_endpoint(self):
        """Test the active theme API endpoint."""
        client = Client()
        try:
            response = client.get(reverse('theming:active-theme'))
            if response.status_code == 200:
                data = response.json()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  ✓ API endpoint accessible"
                    )
                )
                self.stdout.write(
                    f"    Theme: {data.get('theme_key', 'unknown')}"
                )
                if data.get('event'):
                    self.stdout.write(
                        f"    Event: {data.get('event', {}).get('name', 'unknown')}"
                    )
                else:
                    self.stdout.write("    Event: None (default theme)")
            else:
                self.stdout.write(
                    self.style.ERROR(f"  ✗ API returned status {response.status_code}")
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"  ✗ API test failed: {str(e)}")
            )

    def _test_theme_resolution(self):
        """Test theme resolution logic."""
        try:
            theme = get_active_theme()
            self.stdout.write(
                self.style.SUCCESS(f"  ✓ Theme resolution working")
            )
            self.stdout.write(f"    Active theme: {theme.get('theme_key')}")
            self.stdout.write(f"    Theme name: {theme.get('theme', {}).get('name')}")
            
            # Test with a specific date
            today = _today_local_date()
            event = get_active_event(today)
            if event:
                self.stdout.write(f"    Active event: {event.name}")
            else:
                self.stdout.write("    Active event: None")
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"  ✗ Theme resolution failed: {str(e)}")
            )

    def _test_events(self):
        """Test event model and queries."""
        try:
            total_events = Event.objects.count()
            active_events = Event.objects.filter(active=True).count()
            today = _today_local_date()
            today_events = Event.objects.filter(
                active=True,
                start_date__lte=today,
                end_date__gte=today
            ).count()
            
            self.stdout.write(
                self.style.SUCCESS(f"  ✓ Events query working")
            )
            self.stdout.write(f"    Total events: {total_events}")
            self.stdout.write(f"    Active events: {active_events}")
            self.stdout.write(f"    Events active today: {today_events}")
            
            if total_events == 0:
                self.stdout.write(
                    self.style.WARNING(
                        "    ⚠ No events found. Run 'python manage.py create_sample_events'"
                    )
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"  ✗ Events test failed: {str(e)}")
            )

    def _test_cache(self):
        """Test cache functionality."""
        try:
            from django.core.cache import cache
            today = _today_local_date()
            cache_key = f"active_theme_event_{today.isoformat()}"
            
            # Try to get from cache
            cached = cache.get(cache_key)
            if cached is not None:
                self.stdout.write(
                    self.style.SUCCESS(f"  ✓ Cache working (found cached event)")
                )
            else:
                # Cache might be empty, which is fine
                self.stdout.write(
                    self.style.SUCCESS(f"  ✓ Cache accessible (empty, will populate on next request)")
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"  ✗ Cache test failed: {str(e)}")
            )

