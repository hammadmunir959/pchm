from __future__ import annotations

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Q

class User(AbstractUser):
    """Custom user model with admin roles and workflow status."""

    ROLE_SUPER_ADMIN = 'super_admin'
    ROLE_ADMIN = 'admin'

    ROLE_CHOICES = [
        (ROLE_SUPER_ADMIN, 'Super Admin'),
        (ROLE_ADMIN, 'Admin'),
    ]

    STATUS_ACTIVE = 'active'
    STATUS_PENDING = 'pending_approval'
    STATUS_SUSPENDED = 'suspended'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_PENDING, 'Pending Approval'),
        (STATUS_SUSPENDED, 'Suspended'),
    ]

    admin_type = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        null=True,
        blank=True,
        help_text="Role assigned to the user within the admin workflow."
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        help_text="Workflow status controlling dashboard access."
    )
    phone = models.CharField(max_length=20, blank=True)
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['admin_type'],
                condition=Q(admin_type='super_admin'),
                name='unique_super_admin_user'
            )
        ]

    def __str__(self):
        return self.email or self.username

    @property
    def role(self) -> str | None:
        return self.admin_type

    @property
    def is_super_admin(self) -> bool:
        return self.admin_type == self.ROLE_SUPER_ADMIN

    @property
    def is_admin(self) -> bool:
        return self.admin_type in {self.ROLE_ADMIN, self.ROLE_SUPER_ADMIN}

class OTPVerification(models.Model):
    """OTP for email verification and password reset"""
    email = models.EmailField()
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20)  # 'verification', 'password_reset'
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']
