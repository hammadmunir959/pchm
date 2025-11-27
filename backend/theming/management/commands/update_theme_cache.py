from django.core.management.base import BaseCommand
from django.core.cache import cache
from theming.services.theme_resolver import get_active_theme, get_active_event, _today_local_date


class Command(BaseCommand):
    help = "Warm up and cache today's theme"

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear theme cache before warming',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=0,
            help='Pre-cache themes for the next N days (default: 0, only today)',
        )

    def handle(self, *args, **options):
        if options['clear']:
            # Clear all theme-related cache keys
            from django.core.cache.utils import make_key
            cache_key_prefix = "active_theme"
            today = _today_local_date()
            
            # Clear today's cache
            cache_key = f"{cache_key_prefix}_event_{today.isoformat()}"
            cache.delete(cache_key)
            self.stdout.write(
                self.style.SUCCESS(f"Cleared cache for {today.isoformat()}")
            )
            
            # Clear future days if specified
            if options['days'] > 0:
                from datetime import timedelta
                for i in range(1, options['days'] + 1):
                    future_date = today + timedelta(days=i)
                    future_key = f"{cache_key_prefix}_event_{future_date.isoformat()}"
                    cache.delete(future_key)
                self.stdout.write(
                    self.style.SUCCESS(f"Cleared cache for next {options['days']} days")
                )

        # Warm up today's theme
        today = _today_local_date()
        self.stdout.write(f"Warming cache for {today.isoformat()}...")
        
        theme_data = get_active_theme()
        event = get_active_event(today)
        
        if event:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully cached active theme: {theme_data['theme_key']} "
                    f"(Event: {event.name})"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully cached default theme: {theme_data['theme_key']} "
                    f"(No active events)"
                )
            )
        
        # Pre-cache future days if specified
        if options['days'] > 0:
            from datetime import timedelta
            self.stdout.write(f"\nPre-caching themes for next {options['days']} days...")
            for i in range(1, options['days'] + 1):
                future_date = today + timedelta(days=i)
                future_event = get_active_event(future_date)
                if future_event:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  {future_date.isoformat()}: {future_event.theme} "
                            f"(Event: {future_event.name})"
                        )
                    )
                else:
                    self.stdout.write(
                        f"  {future_date.isoformat()}: default (No active events)"
                    )

