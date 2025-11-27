from django.contrib import admin

from .models import Testimonial


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('name', 'rating', 'status', 'created_at')
    list_filter = ('status', 'rating')
    search_fields = ('name', 'feedback')
    readonly_fields = ('created_at', 'updated_at')
