from django.db import models


class LandingPageConfig(models.Model):
    """
    Simplified landing page configuration.
    Manages hero video, logos (light/dark mode), and contact information.
    """

    # Hero Section
    hero_video = models.FileField(
        upload_to="landing/hero/",
        blank=True,
        null=True,
        help_text="Hero section background video",
    )

    # Logos
    logo_light = models.ImageField(
        upload_to="landing/logos/",
        blank=True,
        null=True,
        help_text="Logo for light mode",
    )
    logo_dark = models.ImageField(
        upload_to="landing/logos/",
        blank=True,
        null=True,
        help_text="Logo for dark mode",
    )

    # Contact Information
    contact_phone = models.CharField(
        max_length=50,
        blank=True,
        default="+44 (0) 20 1234 5678",
        help_text="Contact phone number",
    )
    contact_email = models.EmailField(
        blank=True,
        default="info@prestigecarhire.co.uk",
        help_text="Contact email address",
    )
    contact_address = models.CharField(
        max_length=255,
        blank=True,
        default="London, United Kingdom",
        help_text="Contact address",
    )
    contact_hours = models.CharField(
        max_length=255,
        blank=True,
        help_text="Business hours (e.g., 'Monday - Friday: 9:00 AM - 6:00 PM')",
    )

    # Google Map
    google_map_embed_url = models.TextField(
        blank=True,
        help_text="Google Maps embed URL or iframe code for 'Visit Our Office' section",
    )

    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Landing Page Configuration"
        verbose_name_plural = "Landing Page Configurations"

    def __str__(self) -> str:
        return "Landing Page Config"


class TeamMember(models.Model):
    """
    Team member model for the "Our People" page.
    Represents staff members displayed on the public-facing Our People page.
    """

    name = models.CharField(
        max_length=255,
        help_text="Full name of the team member",
    )
    role = models.CharField(
        max_length=255,
        help_text="Job title or role (e.g., 'Managing Director', 'Operations Manager')",
    )
    description = models.TextField(
        help_text="Brief description or bio of the team member",
    )
    image = models.ImageField(
        upload_to="team/",
        blank=True,
        null=True,
        help_text="Profile photo of the team member",
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Display order (lower numbers appear first)",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this team member should be displayed on the Our People page",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Team Member"
        verbose_name_plural = "Team Members"
        ordering = ["order", "name"]

    def __str__(self) -> str:
        return f"{self.name} - {self.role}"

