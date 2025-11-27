"""
Enhanced permission classes for DRF.
"""
import logging
from typing import Optional

from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView

from accounts.models import User
from utils.security_logging import SecurityAuditLogger

logger = logging.getLogger(__name__)


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '')
    return ip


class IsSuperAdmin(permissions.BasePermission):
    """Only super admins can access."""
    
    def has_permission(self, request: Request, view: APIView) -> bool:
        """Check if user is authenticated super admin."""
        if not request.user.is_authenticated:
            return False
        
        user: User = request.user
        
        is_super_admin = (
            user.admin_type == User.ROLE_SUPER_ADMIN
            and user.status == User.STATUS_ACTIVE
            and user.is_email_verified
        )
        
        if not is_super_admin and request.user.is_authenticated:
            # Log permission denied
            SecurityAuditLogger.log_permission_denied(
                user=user,
                resource=view.__class__.__name__,
                action=request.method,
                ip_address=get_client_ip(request)
            )
        
        return is_super_admin


class IsAdmin(permissions.BasePermission):
    """Admins and super admins can access."""
    
    def has_permission(self, request: Request, view: APIView) -> bool:
        """Check if user is authenticated admin or super admin."""
        if not request.user.is_authenticated:
            return False
        
        user: User = request.user
        
        is_admin = (
            user.admin_type in [User.ROLE_ADMIN, User.ROLE_SUPER_ADMIN]
            and user.status == User.STATUS_ACTIVE
            and user.is_email_verified
        )
        
        if not is_admin:
            # Log permission denied
            SecurityAuditLogger.log_permission_denied(
                user=user,
                resource=view.__class__.__name__,
                action=request.method,
                ip_address=get_client_ip(request)
            )
        
        return is_admin


class IsPublicOrAdmin(permissions.BasePermission):
    """Public read, admin write."""
    
    def has_permission(self, request: Request, view: APIView) -> bool:
        """Allow public read access, require admin for write operations."""
        # Allow safe methods (GET, HEAD, OPTIONS) for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Require authentication and admin status for write operations
        if not request.user.is_authenticated:
            return False
        
        user: User = request.user
        
        is_admin = (
            user.admin_type in [User.ROLE_ADMIN, User.ROLE_SUPER_ADMIN]
            and user.status == User.STATUS_ACTIVE
            and user.is_email_verified
        )
        
        if not is_admin:
            # Log permission denied
            SecurityAuditLogger.log_permission_denied(
                user=user,
                resource=view.__class__.__name__,
                action=request.method,
                ip_address=get_client_ip(request)
            )
        
        return is_admin


class IsOwnerOrAdmin(permissions.BasePermission):
    """Object-level permission: owner or admin can access."""
    
    def has_object_permission(self, request: Request, view: APIView, obj: any) -> bool:
        """Check if user is owner of object or is admin."""
        # Admins can access anything
        if request.user.is_authenticated:
            user: User = request.user
            if (
                user.admin_type in [User.ROLE_ADMIN, User.ROLE_SUPER_ADMIN]
                and user.status == User.STATUS_ACTIVE
            ):
                return True
        
        # Check if user is owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        return False


class IsReadOnlyOrAdmin(permissions.BasePermission):
    """Read-only for everyone, write requires admin."""
    
    def has_permission(self, request: Request, view: APIView) -> bool:
        """Allow read for everyone, write for admins only."""
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        user: User = request.user
        return (
            user.admin_type in [User.ROLE_ADMIN, User.ROLE_SUPER_ADMIN]
            and user.status == User.STATUS_ACTIVE
            and user.is_email_verified
        )

