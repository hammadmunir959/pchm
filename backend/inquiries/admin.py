from django.contrib import admin

from .models import Inquiry


@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = ('subject', 'email', 'status', 'source', 'created_at')
    list_filter = ('status', 'source', 'is_spam')
    search_fields = ('subject', 'email', 'message')
    readonly_fields = ('created_at', 'updated_at')
