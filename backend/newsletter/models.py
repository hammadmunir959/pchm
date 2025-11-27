from django.db import models

class NewsletterSubscriber(models.Model):
    """Newsletter subscriber model"""
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=200, blank=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    source = models.CharField(max_length=100, blank=True)  # How they subscribed

    class Meta:
        ordering = ['-subscribed_at']

    def __str__(self):
        return f"{self.email} - {'Active' if self.is_active else 'Inactive'}"

class NewsletterCampaign(models.Model):
    """Newsletter campaign model"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('sending', 'Sending'),
        ('sent', 'Sent'),
        ('cancelled', 'Cancelled'),
    ]

    subject = models.CharField(max_length=200)
    content = models.TextField()  # HTML content
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    recipients_count = models.IntegerField(default=0)
    opened_count = models.IntegerField(default=0)
    clicked_count = models.IntegerField(default=0)
    created_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.subject} - {self.get_status_display()}"


class NewsletterRecipient(models.Model):
    """Per-recipient tracking for a campaign."""
    campaign = models.ForeignKey(NewsletterCampaign, on_delete=models.CASCADE, related_name='recipients')
    email = models.EmailField()
    token = models.CharField(max_length=255, unique=True)
    is_test = models.BooleanField(default=False)
    open_count = models.IntegerField(default=0)
    click_count = models.IntegerField(default=0)
    first_opened_at = models.DateTimeField(null=True, blank=True)
    last_opened_at = models.DateTimeField(null=True, blank=True)
    first_clicked_at = models.DateTimeField(null=True, blank=True)
    last_clicked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('campaign', 'email')
        indexes = [
            models.Index(fields=['campaign', 'email']),
        ]

    def __str__(self):
        return f"{self.email} ({'test' if self.is_test else 'live'})"
