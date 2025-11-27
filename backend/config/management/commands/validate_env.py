"""
Management command to validate environment variables.
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from utils.env_validation import EnvironmentValidator


class Command(BaseCommand):
    """Validate environment variables."""
    
    help = 'Validates required and recommended environment variables'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--production',
            action='store_true',
            help='Run production-level validation',
        )
        parser.add_argument(
            '--exit-on-error',
            action='store_true',
            help='Exit with error code if validation fails',
        )
    
    def handle(self, *args, **options):
        """Execute the command."""
        is_production = options['production'] or not settings.DEBUG
        
        self.stdout.write('Validating environment variables...\n')
        
        is_valid = EnvironmentValidator.print_validation_report(is_production)
        
        if not is_valid and options['exit_on_error']:
            self.stdout.write(self.style.ERROR('\nValidation failed. Exiting.'))
            exit(1)
        elif is_valid:
            self.stdout.write(self.style.SUCCESS('\nValidation passed.'))

