"""
Security utilities for input sanitization and validation.
"""
import html
import re
from typing import Any, Dict, List, Optional, Union

from django.utils.html import strip_tags
from django.utils.text import slugify


def sanitize_string(value: str, allow_html: bool = False, max_length: Optional[int] = None) -> str:
    """
    Sanitize a string input by removing potentially dangerous content.
    
    Args:
        value: Input string to sanitize
        allow_html: Whether to allow HTML tags (default: False)
        max_length: Maximum length of the string
    
    Returns:
        Sanitized string
    """
    if not isinstance(value, str):
        value = str(value)
    
    # Remove null bytes
    value = value.replace('\x00', '')
    
    # Strip whitespace
    value = value.strip()
    
    # Remove HTML tags if not allowed
    if not allow_html:
        value = strip_tags(value)
        # Escape HTML entities
        value = html.escape(value)
    
    # Truncate if max_length specified
    if max_length and len(value) > max_length:
        value = value[:max_length]
    
    return value


def sanitize_email(email: str) -> Optional[str]:
    """
    Sanitize and validate email address.
    
    Args:
        email: Email address to sanitize
    
    Returns:
        Sanitized email or None if invalid
    """
    if not email:
        return None
    
    email = email.strip().lower()
    
    # Basic email validation regex
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, email):
        return None
    
    # Additional checks for dangerous patterns
    dangerous_patterns = [
        r'<script',
        r'javascript:',
        r'on\w+\s*=',
        r'data:text/html',
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, email, re.IGNORECASE):
            return None
    
    return email


def sanitize_url(url: str, allowed_schemes: Optional[List[str]] = None) -> Optional[str]:
    """
    Sanitize and validate URL.
    
    Args:
        url: URL to sanitize
        allowed_schemes: List of allowed URL schemes (default: ['http', 'https'])
    
    Returns:
        Sanitized URL or None if invalid
    """
    if not url:
        return None
    
    if allowed_schemes is None:
        allowed_schemes = ['http', 'https']
    
    url = url.strip()
    
    # Check for dangerous patterns
    dangerous_patterns = [
        r'javascript:',
        r'data:text/html',
        r'vbscript:',
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, url, re.IGNORECASE):
            return None
    
    # Validate scheme
    if '://' in url:
        scheme = url.split('://')[0].lower()
        if scheme not in allowed_schemes:
            return None
    
    return url


def sanitize_dict(data: Dict[str, Any], allow_html: bool = False) -> Dict[str, Any]:
    """
    Recursively sanitize dictionary values.
    
    Args:
        data: Dictionary to sanitize
        allow_html: Whether to allow HTML in string values
    
    Returns:
        Sanitized dictionary
    """
    sanitized = {}
    
    for key, value in data.items():
        # Sanitize key
        sanitized_key = sanitize_string(str(key), allow_html=False)
        
        # Sanitize value based on type
        if isinstance(value, str):
            sanitized[sanitized_key] = sanitize_string(value, allow_html=allow_html)
        elif isinstance(value, dict):
            sanitized[sanitized_key] = sanitize_dict(value, allow_html=allow_html)
        elif isinstance(value, list):
            sanitized[sanitized_key] = sanitize_list(value, allow_html=allow_html)
        else:
            sanitized[sanitized_key] = value
    
    return sanitized


def sanitize_list(data: List[Any], allow_html: bool = False) -> List[Any]:
    """
    Recursively sanitize list values.
    
    Args:
        data: List to sanitize
        allow_html: Whether to allow HTML in string values
    
    Returns:
        Sanitized list
    """
    sanitized = []
    
    for item in data:
        if isinstance(item, str):
            sanitized.append(sanitize_string(item, allow_html=allow_html))
        elif isinstance(item, dict):
            sanitized.append(sanitize_dict(item, allow_html=allow_html))
        elif isinstance(item, list):
            sanitized.append(sanitize_list(item, allow_html=allow_html))
        else:
            sanitized.append(item)
    
    return sanitized


def sanitize_input(data: Union[str, Dict, List], allow_html: bool = False) -> Union[str, Dict, List]:
    """
    Sanitize input data of any type.
    
    Args:
        data: Data to sanitize (string, dict, or list)
        allow_html: Whether to allow HTML in string values
    
    Returns:
        Sanitized data
    """
    if isinstance(data, str):
        return sanitize_string(data, allow_html=allow_html)
    elif isinstance(data, dict):
        return sanitize_dict(data, allow_html=allow_html)
    elif isinstance(data, list):
        return sanitize_list(data, allow_html=allow_html)
    else:
        return data


def validate_sql_injection_patterns(value: str) -> bool:
    """
    Check for common SQL injection patterns.
    
    This function checks for actual SQL injection attempts, not individual
    special characters that are legitimate in passwords and other inputs.
    
    Args:
        value: String to check
    
    Returns:
        True if potentially dangerous, False otherwise
    """
    if not isinstance(value, str):
        return False
    
    # Only check for actual SQL injection patterns, not individual special characters
    # Individual characters like !, #, $, %, & are legitimate in passwords
    dangerous_patterns = [
        # SQL comment patterns
        r"--\s",  # SQL comment (-- followed by space or end)
        r"/\*.*?\*/",  # Multi-line SQL comment
        # SQL keywords in injection context (with quotes or operators)
        r"'\s*(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+",  # SQL keywords after quote
        r"'\s*(or|and)\s+['\d]",  # OR/AND after quote with quote or digit
        r"(or|and)\s+['\d].*?=.*?['\d]",  # OR/AND with comparisons
        r"(or|and)\s+\d+\s*=\s*\d+",  # OR/AND with numeric comparisons
        r"(or|and)\s+['\"].*?['\"]\s*=\s*['\"].*?['\"]",  # OR/AND with string comparisons
        # Multiple quotes or semicolons (SQL statement termination)
        r"['\"]\s*;\s*['\"]",  # Quote-semicolon-quote pattern
        r"['\"]\s*;\s*(select|insert|update|delete|drop|create|alter)",  # Quote-semicolon-SQL keyword
        # UNION-based injection patterns
        r"union\s+(all\s+)?select",  # UNION SELECT pattern
        # Stacked queries
        r";\s*(select|insert|update|delete|drop|create|alter|exec|execute)",  # Semicolon followed by SQL keyword
    ]
    
    value_lower = value.lower()
    
    for pattern in dangerous_patterns:
        if re.search(pattern, value_lower, re.IGNORECASE):
            return True
    
    return False


def validate_xss_patterns(value: str) -> bool:
    """
    Check for common XSS patterns.
    
    Args:
        value: String to check
    
    Returns:
        True if potentially dangerous, False otherwise
    """
    if not isinstance(value, str):
        return False
    
    # Common XSS patterns
    dangerous_patterns = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe[^>]*>",
        r"<object[^>]*>",
        r"<embed[^>]*>",
        r"<link[^>]*>",
        r"<meta[^>]*>",
        r"expression\s*\(",
        r"vbscript:",
        r"data:text/html",
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, value, re.IGNORECASE):
            return True
    
    return False

