"""
Tests for security utilities and functions.
"""
import pytest
from django.test import RequestFactory

from utils.security import (
    sanitize_string,
    sanitize_email,
    sanitize_url,
    sanitize_dict,
    sanitize_list,
    sanitize_input,
    validate_sql_injection_patterns,
    validate_xss_patterns,
)
from utils.permissions import (
    IsSuperAdmin,
    IsAdmin,
    IsPublicOrAdmin,
    IsOwnerOrAdmin,
    IsReadOnlyOrAdmin,
)
from accounts.models import User


class TestSecuritySanitization:
    """Test input sanitization functions."""
    
    def test_sanitize_string_basic(self):
        """Test basic string sanitization."""
        result = sanitize_string("  test string  ")
        assert result == "test string"
    
    def test_sanitize_string_remove_html(self):
        """Test HTML tag removal."""
        result = sanitize_string("<script>alert('xss')</script>test")
        assert "<script>" not in result
        assert "alert" not in result
    
    def test_sanitize_string_escape_html(self):
        """Test HTML entity escaping."""
        result = sanitize_string("<div>test</div>")
        assert "<" not in result or "&lt;" in result
    
    def test_sanitize_string_max_length(self):
        """Test max length truncation."""
        long_string = "a" * 100
        result = sanitize_string(long_string, max_length=50)
        assert len(result) == 50
    
    def test_sanitize_string_allow_html(self):
        """Test allowing HTML when specified."""
        html_string = "<p>test</p>"
        result = sanitize_string(html_string, allow_html=True)
        assert "<p>" in result
    
    def test_sanitize_email_valid(self):
        """Test valid email sanitization."""
        result = sanitize_email("test@example.com")
        assert result == "test@example.com"
    
    def test_sanitize_email_invalid(self):
        """Test invalid email sanitization."""
        result = sanitize_email("not-an-email")
        assert result is None
    
    def test_sanitize_email_dangerous_pattern(self):
        """Test email with dangerous pattern."""
        result = sanitize_email("test<script>@example.com")
        assert result is None
    
    def test_sanitize_url_valid(self):
        """Test valid URL sanitization."""
        result = sanitize_url("https://example.com")
        assert result == "https://example.com"
    
    def test_sanitize_url_javascript(self):
        """Test URL with javascript scheme."""
        result = sanitize_url("javascript:alert('xss')")
        assert result is None
    
    def test_sanitize_dict(self):
        """Test dictionary sanitization."""
        data = {
            "name": "<script>alert('xss')</script>",
            "email": "test@example.com",
            "nested": {
                "value": "<div>test</div>"
            }
        }
        result = sanitize_dict(data)
        assert "<script>" not in result["name"]
        assert result["email"] == "test@example.com"
        assert "<div>" not in result["nested"]["value"]
    
    def test_sanitize_list(self):
        """Test list sanitization."""
        data = ["<script>test</script>", "normal string", "<div>html</div>"]
        result = sanitize_list(data)
        assert "<script>" not in result[0]
        assert result[1] == "normal string"
        assert "<div>" not in result[2]
    
    def test_sanitize_input_string(self):
        """Test sanitize_input with string."""
        result = sanitize_input("<script>test</script>")
        assert "<script>" not in result
    
    def test_sanitize_input_dict(self):
        """Test sanitize_input with dict."""
        result = sanitize_input({"key": "<script>test</script>"})
        assert "<script>" not in result["key"]


class TestSQLInjectionValidation:
    """Test SQL injection pattern validation."""
    
    def test_sql_injection_union(self):
        """Test UNION SQL injection pattern."""
        assert validate_sql_injection_patterns("' UNION SELECT * FROM users--")
    
    def test_sql_injection_or_condition(self):
        """Test OR condition SQL injection."""
        assert validate_sql_injection_patterns("' OR '1'='1")
    
    def test_sql_injection_comment(self):
        """Test SQL comment injection."""
        assert validate_sql_injection_patterns("test'--")
    
    def test_sql_injection_safe_string(self):
        """Test safe string doesn't trigger."""
        assert not validate_sql_injection_patterns("normal user input")


class TestXSSValidation:
    """Test XSS pattern validation."""
    
    def test_xss_script_tag(self):
        """Test script tag XSS."""
        assert validate_xss_patterns("<script>alert('xss')</script>")
    
    def test_xss_javascript_url(self):
        """Test javascript: URL XSS."""
        assert validate_xss_patterns("javascript:alert('xss')")
    
    def test_xss_event_handler(self):
        """Test event handler XSS."""
        assert validate_xss_patterns("<img onerror='alert(1)'>")
    
    def test_xss_safe_string(self):
        """Test safe string doesn't trigger."""
        assert not validate_xss_patterns("normal text content")


class TestPermissions:
    """Test permission classes."""
    
    @pytest.fixture
    def factory(self):
        """Request factory."""
        return RequestFactory()
    
    def test_is_super_admin_allowed(self, factory, super_admin_user):
        """Test IsSuperAdmin allows super admin."""
        request = factory.get('/')
        request.user = super_admin_user
        
        permission = IsSuperAdmin()
        assert permission.has_permission(request, None)
    
    def test_is_super_admin_denied_admin(self, factory, admin_user):
        """Test IsSuperAdmin denies regular admin."""
        request = factory.get('/')
        request.user = admin_user
        
        permission = IsSuperAdmin()
        assert not permission.has_permission(request, None)
    
    def test_is_admin_allowed_super_admin(self, factory, super_admin_user):
        """Test IsAdmin allows super admin."""
        request = factory.get('/')
        request.user = super_admin_user
        
        permission = IsAdmin()
        assert permission.has_permission(request, None)
    
    def test_is_admin_allowed_admin(self, factory, admin_user):
        """Test IsAdmin allows admin."""
        request = factory.get('/')
        request.user = admin_user
        
        permission = IsAdmin()
        assert permission.has_permission(request, None)
    
    def test_is_public_or_admin_read(self, factory):
        """Test IsPublicOrAdmin allows public read."""
        request = factory.get('/')
        request.user = type('User', (), {'is_authenticated': False})()
        
        permission = IsPublicOrAdmin()
        assert permission.has_permission(request, None)
    
    def test_is_public_or_admin_write_requires_auth(self, factory):
        """Test IsPublicOrAdmin requires auth for write."""
        request = factory.post('/')
        request.user = type('User', (), {'is_authenticated': False})()
        
        permission = IsPublicOrAdmin()
        assert not permission.has_permission(request, None)
    
    def test_is_public_or_admin_write_allows_admin(self, factory, admin_user):
        """Test IsPublicOrAdmin allows admin write."""
        request = factory.post('/')
        request.user = admin_user
        
        permission = IsPublicOrAdmin()
        assert permission.has_permission(request, None)

