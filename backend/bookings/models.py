from django.db import models

class Claim(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('cancelled', 'Cancelled'),
    ]

    # Customer Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()

    # Accident Details
    accident_date = models.DateField()
    vehicle_registration = models.CharField(max_length=20)
    insurance_company = models.CharField(max_length=200)
    policy_number = models.CharField(max_length=100)
    accident_details = models.TextField()

    # Booking Details
    vehicle = models.ForeignKey('vehicles.Vehicle', on_delete=models.SET_NULL, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    pickup_location = models.CharField(max_length=200)
    drop_location = models.CharField(max_length=200)
    notes = models.TextField(blank=True)

    # Status & Assignment
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_staff = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Claim {self.id} - {self.first_name} {self.last_name}"

    class Meta:
        ordering = ['-created_at']

class ClaimDocument(models.Model):
    claim = models.ForeignKey(Claim, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='claims/documents/')
    file_name = models.CharField(max_length=200)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name
