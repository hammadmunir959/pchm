from django.db import models


class Inquiry(models.Model):
    STATUS_CHOICES = [
        ('unread', 'Unread'),
        ('replied', 'Replied'),
        ('resolved', 'Resolved'),
    ]

    SOURCE_CHOICES = [
        ('web', 'Web Form'),
        ('chatbot', 'AI Chatbot'),
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    vehicle_interest = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unread')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='web')
    is_spam = models.BooleanField(default=False)
    spam_score = models.FloatField(null=True, blank=True)
    recaptcha_token = models.CharField(max_length=500, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.subject} - {self.email}"
