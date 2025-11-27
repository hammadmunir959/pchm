from django.db import models

class CookieConsent(models.Model):
    """Cookie consent tracking model"""
    session_id = models.CharField(max_length=200, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    # Consent choices
    necessary_cookies = models.BooleanField(default=True)  # Always true, cannot be disabled
    analytics_cookies = models.BooleanField(default=False)
    marketing_cookies = models.BooleanField(default=False)
    functional_cookies = models.BooleanField(default=False)

    consented_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

    # User association (if logged in)
    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-consented_at']

    def __str__(self):
        return f"Cookie consent for session {self.session_id}"
