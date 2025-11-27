"""
Pytest configuration and shared fixtures.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from accounts.models import User

User = get_user_model()


@pytest.fixture
def api_client():
    """API client for making requests."""
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, super_admin_user):
    """API client authenticated as super admin."""
    api_client.force_authenticate(user=super_admin_user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """API client authenticated as admin."""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def super_admin_user(db):
    """Create a super admin user for testing."""
    return User.objects.create_user(
        username='superadmin@test.com',
        email='superadmin@test.com',
        password='testpass123',
        admin_type=User.ROLE_SUPER_ADMIN,
        status=User.STATUS_ACTIVE,
        is_email_verified=True,
        first_name='Super',
        last_name='Admin'
    )


@pytest.fixture
def admin_user(db):
    """Create an admin user for testing."""
    return User.objects.create_user(
        username='admin@test.com',
        email='admin@test.com',
        password='testpass123',
        admin_type=User.ROLE_ADMIN,
        status=User.STATUS_ACTIVE,
        is_email_verified=True,
        first_name='Admin',
        last_name='User'
    )


@pytest.fixture
def pending_admin_user(db):
    """Create a pending admin user for testing."""
    return User.objects.create_user(
        username='pending@test.com',
        email='pending@test.com',
        password='testpass123',
        admin_type=User.ROLE_ADMIN,
        status=User.STATUS_PENDING,
        is_email_verified=True,
        first_name='Pending',
        last_name='Admin'
    )

