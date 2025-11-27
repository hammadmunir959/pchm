from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.postgres.fields import ArrayField
import json


class Theme(models.Model):
    """Custom theme configuration stored in database"""
    key = models.SlugField(max_length=120, unique=True, help_text="Unique identifier for the theme (e.g., 'summer_2024')")
    name = models.CharField(max_length=200, help_text="Display name for the theme")
    primary_color = models.CharField(max_length=7, default="#0b5cff", help_text="Primary theme color in hex format")
    secondary_color = models.CharField(max_length=7, default="#00d4ff", help_text="Secondary theme color in hex format")
    background_color = models.CharField(max_length=7, blank=True, default="", help_text="Background color for the website in hex format")
    text_color = models.CharField(max_length=7, blank=True, default="", help_text="Main text color in hex format")
    accent_color = models.CharField(max_length=7, blank=True, default="", help_text="Accent color for buttons and highlights in hex format")
    banner = models.CharField(max_length=500, blank=True, default="", help_text="Path to banner image")
    hero_background = models.CharField(max_length=500, blank=True, default="", help_text="Hero section background (image URL or color)")
    icons_path = models.CharField(max_length=500, blank=True, default="", help_text="Path to icons directory")
    animations = models.JSONField(default=list, blank=True, help_text="List of animation names")
    
    # Popup configuration (theme-based popup)
    popup_title = models.CharField(max_length=200, blank=True, null=True)
    popup_content = models.TextField(blank=True, null=True)
    
    # Landing popup configuration
    landing_popup_enabled = models.BooleanField(default=True)
    landing_popup_title = models.CharField(max_length=200, blank=True, default="")
    landing_popup_subtitle = models.CharField(max_length=200, blank=True, default="")
    landing_popup_description = models.TextField(blank=True, default="")
    landing_popup_button_text = models.CharField(max_length=200, blank=True, default="")
    landing_popup_image_url = models.CharField(max_length=500, blank=True, default="")
    landing_popup_overlay_text = models.CharField(max_length=200, blank=True, default="")
    
    is_custom = models.BooleanField(default=True, help_text="True for user-created themes, False for system defaults")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Theme'
        verbose_name_plural = 'Themes'
    
    def to_dict(self):
        """Convert theme model to dictionary format compatible with THEMES config"""
        theme_dict = {
            "name": self.name,
            "primary_color": self.primary_color,
            "secondary_color": self.secondary_color,
            "background_color": self.background_color or "",
            "text_color": self.text_color or "",
            "accent_color": self.accent_color or "",
            "banner": self.banner or f"themes/{self.key}/banner.jpg",
            "hero_background": self.hero_background or "",
            "icons_path": self.icons_path or f"themes/{self.key}/icons/",
            "animations": self.animations or [],
        }
        
        # Add popup if configured
        if self.popup_title and self.popup_content:
            theme_dict["popup"] = {
                "title": self.popup_title,
                "content": self.popup_content
            }
        else:
            theme_dict["popup"] = None
        
        # Add landing popup if enabled
        if self.landing_popup_enabled:
            theme_dict["landing_popup"] = {
                "enabled": True,
                "title": self.landing_popup_title,
                "subtitle": self.landing_popup_subtitle,
                "description": self.landing_popup_description,
                "button_text": self.landing_popup_button_text,
                "image_url": self.landing_popup_image_url,
                "overlay_text": self.landing_popup_overlay_text,
            }
        else:
            theme_dict["landing_popup"] = {
                "enabled": False,
                "title": "",
                "subtitle": "",
                "description": "",
                "button_text": "",
                "image_url": "",
                "overlay_text": "",
            }
        
        return theme_dict
    
    def __str__(self):
        return f"{self.name} ({self.key})"


class Event(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=120, unique=True)
    start_date = models.DateField()
    end_date = models.DateField()
    theme_key = models.CharField(max_length=120, help_text="Theme key (can be from predefined themes or custom themes)")
    priority = models.IntegerField(default=0, help_text="Higher priority runs when events overlap")
    active = models.BooleanField(default=True)
    recurring_yearly = models.BooleanField(default=False, help_text="If true, treat as recurring each year")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-priority', 'start_date']
        verbose_name = 'Event'
        verbose_name_plural = 'Events'
    
    def clean(self):
        if self.end_date < self.start_date:
            raise ValidationError("end_date must be same or after start_date")
    
    @property
    def theme(self):
        """Backward compatibility property"""
        return self.theme_key
    
    def __str__(self):
        return f"{self.name} ({self.start_date} → {self.end_date})"
