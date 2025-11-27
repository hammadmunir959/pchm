from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from theming.models import Event


class Command(BaseCommand):
    help = "Create sample events for testing the theming system"

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing events before creating samples',
        )

    def handle(self, *args, **options):
        if options['clear']:
            deleted_count = Event.objects.all().delete()[0]
            self.stdout.write(
                self.style.WARNING(f"Deleted {deleted_count} existing events")
            )

        today = timezone.localtime(timezone.now()).date()
        
        # Calculate dates for sample events
        christmas_start = date(today.year, 12, 20)
        christmas_end = date(today.year, 12, 26)
        
        valentine_start = date(today.year, 2, 10)
        valentine_end = date(today.year, 2, 16)
        
        new_year_start = date(today.year, 12, 30)
        new_year_end = date(today.year + 1, 1, 5)
        
        # Black Friday (last Friday of November)
        black_friday_date = self._get_black_friday_date(today.year)
        black_friday_start = black_friday_date - timedelta(days=1)
        black_friday_end = black_friday_date + timedelta(days=2)
        
        # Eid (example dates - adjust as needed)
        eid_start = date(today.year, 4, 10)  # Approximate
        eid_end = date(today.year, 4, 13)
        
        # Create sample events
        events_data = [
            {
                'name': 'Christmas Celebration',
                'slug': 'christmas-2024',
                'start_date': christmas_start,
                'end_date': christmas_end,
                'theme': 'christmas',
                'priority': 10,
                'active': True,
                'recurring_yearly': True,
            },
            {
                'name': "Valentine's Day Special",
                'slug': 'valentine-2024',
                'start_date': valentine_start,
                'end_date': valentine_end,
                'theme': 'valentine',
                'priority': 8,
                'active': True,
                'recurring_yearly': True,
            },
            {
                'name': 'New Year Celebration',
                'slug': 'new-year-2024',
                'start_date': new_year_start,
                'end_date': new_year_end,
                'theme': 'new_year',
                'priority': 9,
                'active': True,
                'recurring_yearly': True,
            },
            {
                'name': 'Black Friday Sale',
                'slug': 'black-friday-2024',
                'start_date': black_friday_start,
                'end_date': black_friday_end,
                'theme': 'black_friday',
                'priority': 15,  # High priority for sales
                'active': True,
                'recurring_yearly': True,
            },
            {
                'name': 'Eid Mubarak',
                'slug': 'eid-2024',
                'start_date': eid_start,
                'end_date': eid_end,
                'theme': 'eid',
                'priority': 10,
                'active': True,
                'recurring_yearly': True,
            },
            # Create a test event for today (if not already covered)
            {
                'name': 'Test Event (Today)',
                'slug': 'test-event-today',
                'start_date': today,
                'end_date': today,
                'theme': 'christmas',
                'priority': 5,
                'active': True,
                'recurring_yearly': False,
            },
        ]

        created_count = 0
        updated_count = 0

        for event_data in events_data:
            event, created = Event.objects.update_or_create(
                slug=event_data['slug'],
                defaults=event_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"✓ Created: {event.name}")
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f"↻ Updated: {event.name}")
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSummary: {created_count} created, {updated_count} updated"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"\nYou can now:\n"
                f"  1. Visit Django Admin → Theming → Events to view events\n"
                f"  2. Visit Theme Selector to preview themes\n"
                f"  3. Test the API: GET /api/theming/active-theme/\n"
                f"  4. Visit frontend to see active theme"
            )
        )

    def _get_black_friday_date(self, year):
        """Calculate Black Friday date (4th Thursday of November)."""
        # Black Friday is the day after Thanksgiving (4th Thursday of November)
        # Start with November 1st
        nov_1 = date(year, 11, 1)
        # Find the first Thursday
        days_until_thursday = (3 - nov_1.weekday()) % 7
        first_thursday = nov_1 + timedelta(days=days_until_thursday)
        # 4th Thursday is 3 weeks later
        thanksgiving = first_thursday + timedelta(weeks=3)
        # Black Friday is the day after
        return thanksgiving + timedelta(days=1)

