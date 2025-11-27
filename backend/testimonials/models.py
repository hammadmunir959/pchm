from django.db import models


class Testimonial(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('archived', 'Archived'),
    ]

    SERVICE_CHOICES = [
        ('car_hire', 'Car Hire'),
        ('car_rental', 'Car Rental'),
        ('claims_management', 'Claims Management'),
        ('car_purchase_sale', 'Car Purchase/ Sale'),
    ]

    name = models.CharField(max_length=200)
    feedback = models.TextField()
    rating = models.IntegerField(default=5)
    service_type = models.CharField(max_length=30, choices=SERVICE_CHOICES, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.rating}/5)"
