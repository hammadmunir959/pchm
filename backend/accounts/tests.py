"""
Tests for accounts app - registration and login functionality.
"""
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User, OTPVerification


class RegistrationTests(TestCase):
    """Test cases for admin registration."""

    def setUp(self):
        """Set up test client."""
        self.client = APIClient()
        self.register_url = reverse('accounts:register')

    @patch('accounts.views.send_otp_email')
    def test_register_super_admin_success(self, mock_send_otp):
        """Test successful super admin registration."""
        data = {
            'email': 'superadmin@example.com',
            'password': 'SecurePass123!',
            'admin_type': 'super_admin',
            'first_name': 'Super',
            'last_name': 'Admin',
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user_id', response.data.get('data', {}))
        self.assertEqual(response.data.get('data', {}).get('status'), 'active')
        
        # Verify user was created
        user = User.objects.get(email='superadmin@example.com')
        self.assertEqual(user.admin_type, User.ROLE_SUPER_ADMIN)
        self.assertEqual(user.status, User.STATUS_ACTIVE)
        self.assertFalse(user.is_email_verified)
        
        # Verify OTP was sent
        mock_send_otp.assert_called_once()
        self.assertTrue(OTPVerification.objects.filter(email='superadmin@example.com').exists())

    @patch('accounts.views.send_otp_email')
    def test_register_admin_success(self, mock_send_otp):
        """Test successful admin registration after super admin exists."""
        # Create super admin first
        User.objects.create_user(
            username='super@example.com',
            email='super@example.com',
            password='password123',
            admin_type=User.ROLE_SUPER_ADMIN,
            status=User.STATUS_ACTIVE,
            is_email_verified=True
        )
        
        data = {
            'email': 'admin@example.com',
            'password': 'SecurePass123!',
            'admin_type': 'admin',
            'first_name': 'Regular',
            'last_name': 'Admin',
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user_id', response.data.get('data', {}))
        self.assertEqual(response.data.get('data', {}).get('status'), 'pending_approval')
        
        # Verify user was created
        user = User.objects.get(email='admin@example.com')
        self.assertEqual(user.admin_type, User.ROLE_ADMIN)
        self.assertEqual(user.status, User.STATUS_PENDING)
        self.assertFalse(user.is_email_verified)
        
        mock_send_otp.assert_called_once()

    def test_register_missing_fields(self):
        """Test registration with missing required fields."""
        data = {
            'email': 'test@example.com',
            # Missing password and admin_type
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_register_invalid_admin_type(self):
        """Test registration with invalid admin type."""
        data = {
            'email': 'test@example.com',
            'password': 'SecurePass123!',
            'admin_type': 'invalid_type',
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('error_code'), 'INVALID_ADMIN_TYPE')

    @patch('accounts.views.send_otp_email')
    def test_register_duplicate_email_verified(self, mock_send_otp):
        """Test registration with already verified email."""
        # Create existing verified user
        User.objects.create_user(
            username='existing@example.com',
            email='existing@example.com',
            password='password123',
            is_email_verified=True
        )
        
        data = {
            'email': 'existing@example.com',
            'password': 'SecurePass123!',
            'admin_type': 'super_admin',
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data.get('error_code'), 'EMAIL_EXISTS')
        mock_send_otp.assert_not_called()

    @patch('accounts.views.send_otp_email')
    def test_register_duplicate_email_unverified(self, mock_send_otp):
        """Test registration with unverified email (should delete old and create new)."""
        # Create existing unverified user
        User.objects.create_user(
            username='unverified@example.com',
            email='unverified@example.com',
            password='password123',
            is_email_verified=False
        )
        
        data = {
            'email': 'unverified@example.com',
            'password': 'SecurePass123!',
            'admin_type': 'super_admin',
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Should have only one user with this email
        self.assertEqual(User.objects.filter(email='unverified@example.com').count(), 1)
        mock_send_otp.assert_called_once()

    def test_register_admin_without_super_admin(self):
        """Test admin registration when no super admin exists."""
        data = {
            'email': 'admin@example.com',
            'password': 'SecurePass123!',
            'admin_type': 'admin',
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('error_code'), 'SUPER_ADMIN_REQUIRED')

    @patch('accounts.views.send_otp_email')
    def test_register_second_super_admin(self, mock_send_otp):
        """Test attempting to register second super admin."""
        # Create existing super admin
        User.objects.create_user(
            username='super1@example.com',
            email='super1@example.com',
            password='password123',
            admin_type=User.ROLE_SUPER_ADMIN,
            status=User.STATUS_ACTIVE,
            is_email_verified=True
        )
        
        data = {
            'email': 'super2@example.com',
            'password': 'SecurePass123!',
            'admin_type': 'super_admin',
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data.get('error_code'), 'SUPER_ADMIN_EXISTS')
        mock_send_otp.assert_not_called()


class LoginTests(TestCase):
    """Test cases for admin login."""

    def setUp(self):
        """Set up test client and test users."""
        self.client = APIClient()
        self.login_url = reverse('accounts:login')
        
        # Create test users
        self.super_admin = User.objects.create_user(
            username='super@example.com',
            email='super@example.com',
            password='password123',
            admin_type=User.ROLE_SUPER_ADMIN,
            status=User.STATUS_ACTIVE,
            is_email_verified=True,
            first_name='Super',
            last_name='Admin'
        )
        
        self.active_admin = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='password123',
            admin_type=User.ROLE_ADMIN,
            status=User.STATUS_ACTIVE,
            is_email_verified=True,
            first_name='Active',
            last_name='Admin'
        )
        
        self.pending_admin = User.objects.create_user(
            username='pending@example.com',
            email='pending@example.com',
            password='password123',
            admin_type=User.ROLE_ADMIN,
            status=User.STATUS_PENDING,
            is_email_verified=True,
            first_name='Pending',
            last_name='Admin'
        )
        
        self.suspended_admin = User.objects.create_user(
            username='suspended@example.com',
            email='suspended@example.com',
            password='password123',
            admin_type=User.ROLE_ADMIN,
            status=User.STATUS_SUSPENDED,
            is_email_verified=True,
            first_name='Suspended',
            last_name='Admin'
        )
        
        self.unverified_admin = User.objects.create_user(
            username='unverified@example.com',
            email='unverified@example.com',
            password='password123',
            admin_type=User.ROLE_ADMIN,
            status=User.STATUS_ACTIVE,
            is_email_verified=False,
            first_name='Unverified',
            last_name='Admin'
        )

    def test_login_super_admin_success(self):
        """Test successful super admin login."""
        data = {
            'email': 'super@example.com',
            'password': 'password123',
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data.get('data', {}))
        self.assertIn('refresh', response.data.get('data', {}))
        self.assertIn('user', response.data.get('data', {}))
        
        user_data = response.data.get('data', {}).get('user', {})
        self.assertEqual(user_data.get('email'), 'super@example.com')
        self.assertEqual(user_data.get('admin_type'), 'super_admin')
        self.assertEqual(user_data.get('status'), 'active')

    def test_login_admin_success(self):
        """Test successful admin login."""
        data = {
            'email': 'admin@example.com',
            'password': 'password123',
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data.get('data', {}))
        user_data = response.data.get('data', {}).get('user', {})
        self.assertEqual(user_data.get('email'), 'admin@example.com')
        self.assertEqual(user_data.get('admin_type'), 'admin')

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        data = {
            'email': 'admin@example.com',
            'password': 'wrongpassword',
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data.get('error_code'), 'INVALID_CREDENTIALS')

    def test_login_nonexistent_user(self):
        """Test login with non-existent user."""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'password123',
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data.get('error_code'), 'INVALID_CREDENTIALS')

    def test_login_unverified_email(self):
        """Test login with unverified email."""
        data = {
            'email': 'unverified@example.com',
            'password': 'password123',
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', response.data)
        self.assertIn('verify your email', response.data.get('error', '').lower())

    def test_login_pending_approval(self):
        """Test login with pending approval status."""
        data = {
            'email': 'pending@example.com',
            'password': 'password123',
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', response.data)
        self.assertIn('awaiting approval', response.data.get('error', '').lower())

    def test_login_suspended_account(self):
        """Test login with suspended account."""
        data = {
            'email': 'suspended@example.com',
            'password': 'password123',
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', response.data)
        self.assertIn('suspended', response.data.get('error', '').lower())

    def test_login_missing_email(self):
        """Test login with missing email."""
        data = {
            'password': 'password123',
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('error_code'), 'INVALID_EMAIL')

    def test_login_missing_password(self):
        """Test login with missing password."""
        data = {
            'email': 'admin@example.com',
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('error_code'), 'MISSING_CREDENTIALS')

    def test_login_invalid_email_format(self):
        """Test login with invalid email format."""
        data = {
            'email': 'not-an-email',
            'password': 'password123',
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('error_code'), 'INVALID_EMAIL')

    def test_login_sql_injection_attempt(self):
        """Test login with SQL injection pattern in password."""
        data = {
            'email': 'admin@example.com',
            'password': "'; DROP TABLE users; --",
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('error_code'), 'INVALID_INPUT')

    def test_login_non_admin_user(self):
        """Test login with user that is not an admin."""
        # Create regular user (not admin)
        User.objects.create_user(
            username='regular@example.com',
            email='regular@example.com',
            password='password123',
            admin_type=None,
            is_email_verified=True
        )
        
        data = {
            'email': 'regular@example.com',
            'password': 'password123',
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data.get('error_code'), 'INVALID_CREDENTIALS')

