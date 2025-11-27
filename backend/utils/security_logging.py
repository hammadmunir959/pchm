"""
Security audit logging utilities.
"""
import logging
from typing import Any, Dict, Optional
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()
logger = logging.getLogger('security')


class SecurityAuditLogger:
    """Logger for security-related events."""
    
    @staticmethod
    def log_failed_login(email: str, ip_address: str, reason: str = "Invalid credentials") -> None:
        """Log failed login attempt."""
        logger.warning(
            "Failed login attempt",
            extra={
                'event_type': 'failed_login',
                'email': email,
                'ip_address': ip_address,
                'reason': reason,
                'timestamp': timezone.now().isoformat(),
            }
        )
    
    @staticmethod
    def log_successful_login(user: User, ip_address: str) -> None:
        """Log successful login."""
        logger.info(
            "Successful login",
            extra={
                'event_type': 'successful_login',
                'user_id': user.id,
                'email': user.email,
                'ip_address': ip_address,
                'timestamp': timezone.now().isoformat(),
            }
        )
    
    @staticmethod
    def log_password_reset_request(email: str, ip_address: str) -> None:
        """Log password reset request."""
        logger.info(
            "Password reset requested",
            extra={
                'event_type': 'password_reset_request',
                'email': email,
                'ip_address': ip_address,
                'timestamp': timezone.now().isoformat(),
            }
        )
    
    @staticmethod
    def log_password_reset_success(email: str, ip_address: str) -> None:
        """Log successful password reset."""
        logger.info(
            "Password reset successful",
            extra={
                'event_type': 'password_reset_success',
                'email': email,
                'ip_address': ip_address,
                'timestamp': timezone.now().isoformat(),
            }
        )
    
    @staticmethod
    def log_permission_denied(user: Optional[User], resource: str, action: str, ip_address: str) -> None:
        """Log permission denied event."""
        logger.warning(
            "Permission denied",
            extra={
                'event_type': 'permission_denied',
                'user_id': user.id if user and user.is_authenticated else None,
                'email': user.email if user and user.is_authenticated else None,
                'resource': resource,
                'action': action,
                'ip_address': ip_address,
                'timestamp': timezone.now().isoformat(),
            }
        )
    
    @staticmethod
    def log_suspicious_activity(description: str, ip_address: str, user: Optional[User] = None, details: Optional[Dict[str, Any]] = None) -> None:
        """Log suspicious activity."""
        extra = {
            'event_type': 'suspicious_activity',
            'description': description,
            'ip_address': ip_address,
            'timestamp': timezone.now().isoformat(),
        }
        
        if user and user.is_authenticated:
            extra['user_id'] = user.id
            extra['email'] = user.email
        
        if details:
            extra['details'] = details
        
        logger.warning("Suspicious activity detected", extra=extra)
    
    @staticmethod
    def log_input_validation_failed(field: str, value: str, reason: str, ip_address: str, user: Optional[User] = None) -> None:
        """Log input validation failure."""
        extra = {
            'event_type': 'input_validation_failed',
            'field': field,
            'value': value[:100] if len(value) > 100 else value,  # Truncate long values
            'reason': reason,
            'ip_address': ip_address,
            'timestamp': timezone.now().isoformat(),
        }
        
        if user and user.is_authenticated:
            extra['user_id'] = user.id
            extra['email'] = user.email
        
        logger.warning("Input validation failed", extra=extra)
    
    @staticmethod
    def log_rate_limit_exceeded(endpoint: str, ip_address: str, user: Optional[User] = None) -> None:
        """Log rate limit exceeded."""
        extra = {
            'event_type': 'rate_limit_exceeded',
            'endpoint': endpoint,
            'ip_address': ip_address,
            'timestamp': timezone.now().isoformat(),
        }
        
        if user and user.is_authenticated:
            extra['user_id'] = user.id
            extra['email'] = user.email
        
        logger.warning("Rate limit exceeded", extra=extra)
    
    @staticmethod
    def log_account_locked(user: User, reason: str, ip_address: str) -> None:
        """Log account lockout."""
        logger.warning(
            "Account locked",
            extra={
                'event_type': 'account_locked',
                'user_id': user.id,
                'email': user.email,
                'reason': reason,
                'ip_address': ip_address,
                'timestamp': timezone.now().isoformat(),
            }
        )
    
    @staticmethod
    def log_admin_action(user: User, action: str, resource: str, resource_id: Optional[int] = None, ip_address: Optional[str] = None) -> None:
        """Log admin action (for audit trail)."""
        extra = {
            'event_type': 'admin_action',
            'user_id': user.id,
            'email': user.email,
            'action': action,
            'resource': resource,
            'timestamp': timezone.now().isoformat(),
        }
        
        if resource_id:
            extra['resource_id'] = resource_id
        
        if ip_address:
            extra['ip_address'] = ip_address
        
        logger.info("Admin action", extra=extra)

