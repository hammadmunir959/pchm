from __future__ import annotations

from datetime import timedelta
import random
import string

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, OTPVerification
from utils.email import send_otp_email, notify_super_admin_of_admin_request
from utils.permissions import IsSuperAdmin
from utils.response import success_response, error_response
from utils.exceptions import ValidationError as CustomValidationError, NotFoundError, ConflictError
from utils.security import sanitize_email, sanitize_string, validate_sql_injection_patterns, validate_xss_patterns
from utils.security_logging import SecurityAuditLogger


def get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '')
    return ip


def _generate_otp(length: int = 6) -> str:
    """Generate numeric OTP of given length."""
    return ''.join(random.choices(string.digits, k=length))


def _issue_otp(email: str, purpose: str) -> str:
    """Create (or refresh) an OTP for a specific purpose and email."""
    # Mark existing unused OTPs for the same purpose as used
    OTPVerification.objects.filter(
        email=email,
        purpose=purpose,
        is_used=False
    ).update(is_used=True)

    otp_code = _generate_otp()
    OTPVerification.objects.create(
        email=email,
        otp_code=otp_code,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=10)
    )
    send_otp_email(email, otp_code, purpose=purpose)
    return otp_code


def _super_admin_email() -> str | None:
    super_admin = User.objects.filter(
        admin_type=User.ROLE_SUPER_ADMIN,
        is_email_verified=True
    ).first()
    return super_admin.email if super_admin else None


def _notify_super_admin_about_admin(user: User) -> None:
    recipient = _super_admin_email()
    if not recipient:
        return
    notify_super_admin_of_admin_request(
        super_admin_email=recipient,
        admin_email=user.email,
        admin_name=user.get_full_name() or user.email,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def register_admin(request):
    """Register a new admin or super admin user respecting workflow rules."""
    data = request.data

    required_fields = ['email', 'password', 'admin_type']
    for field in required_fields:
        if field not in data or not data[field]:
            return error_response(
                message=f'{field} is required',
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code='MISSING_FIELD'
            )

    admin_type = data['admin_type']
    if admin_type not in dict(User.ROLE_CHOICES):
        return error_response(
            message='Invalid admin type',
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code='INVALID_ADMIN_TYPE'
        )

    email = data['email']

    with transaction.atomic():
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            if existing_user.is_email_verified:
                return error_response(
                    message='Email already exists',
                    status_code=status.HTTP_409_CONFLICT,
                    error_code='EMAIL_EXISTS'
                )
            existing_user.delete()
            OTPVerification.objects.filter(email=email).delete()

        super_admin_exists = User.objects.filter(
            admin_type=User.ROLE_SUPER_ADMIN,
            is_email_verified=True
        ).exists()

        if admin_type == User.ROLE_SUPER_ADMIN and super_admin_exists:
            return error_response(
                message='A Super Admin already exists. Only one is allowed.',
                status_code=status.HTTP_409_CONFLICT,
                error_code='SUPER_ADMIN_EXISTS'
            )

        if admin_type == User.ROLE_ADMIN and not super_admin_exists:
            return error_response(
                message='A Super Admin must be created before registering admins.',
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code='SUPER_ADMIN_REQUIRED'
            )

        status_value = User.STATUS_ACTIVE if admin_type == User.ROLE_SUPER_ADMIN else User.STATUS_PENDING

        user = User.objects.create_user(
            username=email,
            email=email,
            password=data['password'],
            admin_type=admin_type,
            status=status_value,
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            phone=data.get('phone', ''),
        )

        _issue_otp(user.email, 'verification')

    return success_response(
        data={
            'user_id': user.id,
            'status': user.status,
        },
        message='Admin registered successfully. Please verify your email.',
        status_code=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_admin(request):
    """Authenticate an admin user and issue JWT tokens when allowed."""
    data = request.data
    email_raw = data.get('email', '')
    password = data.get('password', '')
    
    ip_address = get_client_ip(request)

    # Sanitize and validate email
    email = sanitize_email(email_raw)
    if not email:
        SecurityAuditLogger.log_input_validation_failed(
            field='email',
            value=email_raw[:100] if len(email_raw) > 100 else email_raw,
            reason='Invalid email format',
            ip_address=ip_address
        )
        SecurityAuditLogger.log_failed_login(email_raw, ip_address, "Invalid email format")
        return error_response(
            message='Invalid email format',
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code='INVALID_EMAIL'
        )

    if not password:
        SecurityAuditLogger.log_failed_login(email, ip_address, "Missing password")
        return error_response(
            message='Email and password are required',
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code='MISSING_CREDENTIALS'
        )
    
    # Check for SQL injection patterns in password (not email, as email is already sanitized)
    # Only check for actual SQL keywords/patterns, not individual characters that are normal in emails
    if validate_sql_injection_patterns(password):
        SecurityAuditLogger.log_suspicious_activity(
            description=f"Potential SQL injection attempt in password field",
            ip_address=ip_address
        )
        return error_response(
            message='Invalid input',
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code='INVALID_INPUT'
        )

    user = authenticate(
        request=request,
        username=email,
        password=password
    )

    if not user or user.admin_type not in [User.ROLE_ADMIN, User.ROLE_SUPER_ADMIN]:
        SecurityAuditLogger.log_failed_login(email, ip_address, "Invalid credentials")
        return error_response(
            message='Invalid credentials',
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code='INVALID_CREDENTIALS'
        )

    if not user.is_email_verified:
        return Response(
            {
                'error': 'Please verify your email to continue.',
                'status': user.status,
            },
            status=status.HTTP_403_FORBIDDEN
        )

    if user.admin_type == User.ROLE_ADMIN and user.status == User.STATUS_PENDING:
        return Response(
            {
                'error': 'Your account is awaiting approval.',
                'status': user.status,
            },
            status=status.HTTP_403_FORBIDDEN
        )

    if user.status == User.STATUS_SUSPENDED:
        return Response(
            {
                'error': 'Your account is suspended. Contact support.',
                'status': user.status,
            },
            status=status.HTTP_403_FORBIDDEN
        )

    if user.status != User.STATUS_ACTIVE:
        SecurityAuditLogger.log_failed_login(email, ip_address, f"Account not active: {user.status}")
        return error_response(
            message='Your account is not active.',
            status_code=status.HTTP_403_FORBIDDEN,
            error_code='ACCOUNT_INACTIVE',
            details={'status': user.status}
        )

    # Log successful login
    SecurityAuditLogger.log_successful_login(user, ip_address)
    
    refresh = RefreshToken.for_user(user)
    return success_response(
        data={
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'admin_type': user.admin_type,
                'status': user.status,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_email_verified': user.is_email_verified,
            }
        },
        message='Login successful'
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """Verify OTP for email verification or password reset."""
    data = request.data
    email = data.get('email')
    otp_code = data.get('otp_code')
    purpose = data.get('purpose', 'verification')

    if not all([email, otp_code, purpose]):
        return Response(
            {'error': 'email, otp_code and purpose are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        otp_obj = OTPVerification.objects.get(
            email=email,
            otp_code=otp_code,
            purpose=purpose,
            is_used=False,
            expires_at__gt=timezone.now()
        )
    except OTPVerification.DoesNotExist:
        return Response(
            {'error': 'Invalid or expired OTP'},
            status=status.HTTP_400_BAD_REQUEST
        )

    otp_obj.is_used = True
    otp_obj.save(update_fields=['is_used'])

    user = User.objects.filter(email=email).first()
    if user and purpose == 'verification':
        was_verified = user.is_email_verified
        if not was_verified:
            user.is_email_verified = True
            user.save(update_fields=['is_email_verified'])
            if user.admin_type == User.ROLE_ADMIN and user.status == User.STATUS_PENDING:
                _notify_super_admin_about_admin(user)

    return Response({'message': 'OTP verified successfully'})


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_otp(request):
    """Resend verification OTP to existing user."""
    email = request.data.get('email')

    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email=email).first()
    if not user:
        # Avoid disclosing whether the email exists
        return Response({'message': 'If an account exists for this email, a new OTP has been sent.'})

    _issue_otp(email, 'verification')
    return Response({'message': 'Verification code sent successfully.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """Send OTP for password reset."""
    email = request.data.get('email')

    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email=email).first()
    if user:
        _issue_otp(email, 'password_reset')

    # Always return success to prevent email enumeration
    return Response({'message': 'If an account exists for this email, a reset code has been sent.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password using OTP."""
    email = request.data.get('email')
    otp_code = request.data.get('otp_code')
    new_password = request.data.get('new_password')

    if not all([email, otp_code, new_password]):
        return Response(
            {'error': 'email, otp_code and new_password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        otp_obj = OTPVerification.objects.get(
            email=email,
            otp_code=otp_code,
            purpose='password_reset',
            is_used=False,
            expires_at__gt=timezone.now()
        )
    except OTPVerification.DoesNotExist:
        return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email=email).first()
    if not user:
        return Response({'error': 'User account not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        validate_password(new_password, user)
    except ValidationError as exc:
        return Response({'error': exc.messages}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save(update_fields=['password'])

    otp_obj.is_used = True
    otp_obj.save(update_fields=['is_used'])

    return Response({'message': 'Password reset successfully. You may now login with your new password.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Return current authenticated user details."""
    user = request.user
    return Response(
        {
            'id': user.id,
            'email': user.email,
            'admin_type': user.admin_type,
            'status': user.status,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_email_verified': user.is_email_verified,
        }
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def list_admin_requests(request):
    """Return admin accounts filtered by status (default pending)."""
    status_filter = request.query_params.get('status') or User.STATUS_PENDING
    admins = User.objects.filter(
        admin_type=User.ROLE_ADMIN,
        is_email_verified=True
    )
    if status_filter:
        admins = admins.filter(status=status_filter)

    data = [
        {
            'id': admin.id,
            'email': admin.email,
            'status': admin.status,
            'first_name': admin.first_name,
            'last_name': admin.last_name,
            'created_at': admin.created_at.isoformat(),
        }
        for admin in admins.order_by('-created_at')
    ]
    return Response({'results': data})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def update_admin_status(request, user_id: int):
    """Allow the Super Admin to transition admin statuses."""
    new_status = request.data.get('status')
    if new_status not in dict(User.STATUS_CHOICES):
        return Response(
            {'error': 'Invalid status value.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        admin = User.objects.get(id=user_id, admin_type=User.ROLE_ADMIN)
    except User.DoesNotExist:
        return Response(
            {'error': 'Admin not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    admin.status = new_status
    admin.save(update_fields=['status'])

    return Response(
        {
            'id': admin.id,
            'email': admin.email,
            'status': admin.status,
            'first_name': admin.first_name,
            'last_name': admin.last_name,
        }
    )
