"""
Environment variable validation on startup.
"""
import os
import sys
from typing import Dict, List, Optional

from django.core.management.base import BaseCommand


class EnvironmentValidator:
    """
    Validates required environment variables on application startup.
    """
    
    # Required environment variables for production
    REQUIRED_PROD_VARS = [
        'SECRET_KEY',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'DB_HOST',
    ]
    
    # Optional but recommended variables
    RECOMMENDED_VARS = [
        'EMAIL_HOST_USER',
        'EMAIL_HOST_PASSWORD',
        'GROQ_API_KEY',
        'GOOGLE_MAPS_API_KEY',
        'RECAPTCHA_PUBLIC_KEY',
        'RECAPTCHA_PRIVATE_KEY',
    ]
    
    # Variables that should not have default values in production
    NO_DEFAULT_PROD_VARS = [
        'SECRET_KEY',
    ]
    
    @classmethod
    def validate(cls, is_production: bool = False) -> tuple[bool, List[str]]:
        """
        Validate environment variables.
        
        Args:
            is_production: Whether running in production mode
        
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors: List[str] = []
        warnings: List[str] = []
        
        # Check required variables
        if is_production:
            for var in cls.REQUIRED_PROD_VARS:
                value = os.getenv(var)
                if not value:
                    errors.append(f"Required environment variable '{var}' is not set")
                elif var in cls.NO_DEFAULT_PROD_VARS and value.startswith(('your-', 'default-', 'change-')):
                    errors.append(
                        f"Environment variable '{var}' has a default/placeholder value. "
                        f"Please set a proper value for production."
                    )
        
        # Check recommended variables
        for var in cls.RECOMMENDED_VARS:
            if not os.getenv(var):
                warnings.append(f"Recommended environment variable '{var}' is not set")
        
        # Validate SECRET_KEY strength in production
        if is_production:
            secret_key = os.getenv('SECRET_KEY', '')
            if secret_key and len(secret_key) < 50:
                warnings.append(
                    "SECRET_KEY is shorter than 50 characters. "
                    "Consider using a longer, more secure key."
                )
        
        # Validate DEBUG setting
        debug = os.getenv('DEBUG', 'False').lower()
        if is_production and debug == 'true':
            errors.append("DEBUG should be False in production environment")
        
        # Validate database settings
        db_name = os.getenv('DB_NAME', '')
        if is_production and (not db_name or db_name == 'pchm_db'):
            warnings.append("Consider using a more specific database name in production")
        
        return len(errors) == 0, errors + warnings
    
    @classmethod
    def print_validation_report(cls, is_production: bool = False) -> bool:
        """
        Print validation report and return whether validation passed.
        
        Args:
            is_production: Whether running in production mode
        
        Returns:
            True if validation passed, False otherwise
        """
        is_valid, messages = cls.validate(is_production)
        
        if messages:
            print("\n" + "=" * 70)
            print("ENVIRONMENT VARIABLE VALIDATION REPORT")
            print("=" * 70)
            
            errors = [m for m in messages if not m.startswith("Consider")]
            warnings = [m for m in messages if m.startswith("Consider")]
            
            if errors:
                print("\n❌ ERRORS (must be fixed):")
                for error in errors:
                    print(f"   • {error}")
            
            if warnings:
                print("\n⚠️  WARNINGS (recommended to fix):")
                for warning in warnings:
                    print(f"   • {warning}")
            
            print("=" * 70 + "\n")
            
            if errors:
                print("❌ Validation failed. Please fix the errors above before continuing.\n")
                return False
            else:
                print("⚠️  Validation passed with warnings. Please review the warnings above.\n")
                return True
        else:
            print("✅ Environment variable validation passed.\n")
            return True


def validate_environment_on_startup():
    """
    Validate environment variables when Django starts.
    This should be called in settings or AppConfig.ready()
    """
    from django.conf import settings
    
    is_production = not settings.DEBUG
    
    # Only validate in production or when explicitly enabled
    if is_production or os.getenv('VALIDATE_ENV', 'False').lower() == 'true':
        is_valid = EnvironmentValidator.print_validation_report(is_production)
        
        if not is_valid and is_production:
            # In production, exit if validation fails
            sys.exit(1)

