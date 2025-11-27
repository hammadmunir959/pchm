"""
Custom exception classes for centralized error handling.
"""
from typing import Any, Dict, Optional


class APIException(Exception):
    """Base exception for all API errors."""
    
    def __init__(
        self,
        message: str,
        status_code: int = 400,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(APIException):
    """Exception for validation errors."""
    
    def __init__(self, message: str = "Validation error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=400, error_code="VALIDATION_ERROR", details=details)


class AuthenticationError(APIException):
    """Exception for authentication errors."""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, status_code=401, error_code="AUTHENTICATION_ERROR")


class PermissionError(APIException):
    """Exception for permission errors."""
    
    def __init__(self, message: str = "Permission denied"):
        super().__init__(message, status_code=403, error_code="PERMISSION_ERROR")


class NotFoundError(APIException):
    """Exception for resource not found errors."""
    
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404, error_code="NOT_FOUND")


class ConflictError(APIException):
    """Exception for conflict errors (e.g., duplicate resource)."""
    
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, status_code=409, error_code="CONFLICT")


class ServerError(APIException):
    """Exception for server errors."""
    
    def __init__(self, message: str = "Internal server error"):
        super().__init__(message, status_code=500, error_code="SERVER_ERROR")

