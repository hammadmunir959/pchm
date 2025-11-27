from django.contrib import admin
from .models import LandingPageConfig, TeamMember


@admin.register(LandingPageConfig)
class LandingPageConfigAdmin(admin.ModelAdmin):
    list_display = ["id", "contact_email", "contact_phone", "last_updated"]
    readonly_fields = ["last_updated"]


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ["name", "role", "order", "is_active", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "role", "description"]
    ordering = ["order", "name"]
    list_editable = ["order", "is_active"]
