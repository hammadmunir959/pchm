from django.db import models

class FAQ(models.Model):
    """Frequently Asked Questions model"""
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('vehicles', 'Vehicles'),
        ('bookings', 'Bookings'),
        ('insurance', 'Insurance'),
        ('pricing', 'Pricing'),
        ('car_sales', 'Car Sales'),
    ]

    question = models.CharField(max_length=500)
    answer = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['display_order', '-created_at']
        verbose_name = 'FAQ'
        verbose_name_plural = 'FAQs'

    def __str__(self):
        return self.question
