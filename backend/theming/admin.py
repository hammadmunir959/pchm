from django.contrib import admin
from django.urls import path
from django.shortcuts import redirect
from django.utils.html import format_html
from django.urls import reverse
from theming.models import Event, Theme
from theming.views import theme_selector


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ('name', 'key', 'primary_color', 'secondary_color', 'is_custom', 'created_at')
    list_filter = ('is_custom', 'created_at')
    search_fields = ('name', 'key')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('key', 'name', 'is_custom')
        }),
        ('Colors', {
            'fields': ('primary_color', 'secondary_color', 'background_color', 'text_color', 'accent_color')
        }),
        ('Assets', {
            'fields': ('banner', 'hero_background', 'icons_path', 'animations')
        }),
        ('Popup Configuration', {
            'fields': ('popup_title', 'popup_content'),
            'classes': ('collapse',)
        }),
        ('Landing Popup Configuration', {
            'fields': (
                'landing_popup_enabled',
                'landing_popup_title',
                'landing_popup_subtitle',
                'landing_popup_description',
                'landing_popup_button_text',
                'landing_popup_image_url',
                'landing_popup_overlay_text'
            )
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'start_date', 'end_date', 'theme_key', 'priority', 'active', 'recurring_yearly')
    list_filter = ('theme_key', 'active', 'recurring_yearly', 'start_date')
    search_fields = ('name', 'slug', 'theme_key')
    date_hierarchy = 'start_date'
    list_editable = ('active',)
    readonly_fields = ('created_at', 'updated_at')
    
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['theme_selector_url'] = reverse('admin:theming_theme_selector')
        return super().changelist_view(request, extra_context=extra_context)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'theme_key')
        }),
        ('Date Range', {
            'fields': ('start_date', 'end_date', 'recurring_yearly')
        }),
        ('Settings', {
            'fields': ('priority', 'active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_events', 'deactivate_events']
    
    def activate_events(self, request, queryset):
        queryset.update(active=True)
        self.message_user(request, f"{queryset.count()} events activated.")
    activate_events.short_description = "Activate selected events"
    
    def deactivate_events(self, request, queryset):
        queryset.update(active=False)
        self.message_user(request, f"{queryset.count()} events deactivated.")
    deactivate_events.short_description = "Deactivate selected events"
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                'theme-selector/',
                self.admin_site.admin_view(theme_selector),
                name='theming_theme_selector',
            ),
        ]
        return custom_urls + urls
