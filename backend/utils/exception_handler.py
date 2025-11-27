"""
Custom exception handler for DRF to provide standardized error responses.
"""
import logging
from typing import Any

from django.http import Http404
from django.core.exceptions import PermissionDenied, ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied as DRFPermissionDenied,
    ValidationError as DRFValidationError,
    NotFound,
    MethodNotAllowed,
    Throttled,
)
from rest_framework.views import exception_handler

from .exceptions import APIException as CustomAPIException
from .response import error_response

logger = logging.getLogger(__name__)


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Any:
    """
    Custom exception handler that provides standardized error responses.
    
    Args:
        exc: The exception that was raised
        context: Context dictionary containing view, request, etc.
    
    Returns:
        Response: Standardized error response
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # Handle custom API exceptions
    if isinstance(exc, CustomAPIException):
        return error_response(
            message=exc.message,
            status_code=exc.status_code,
            error_code=exc.error_code,
            details=exc.details
        )
    
    # Handle Django exceptions
    if isinstance(exc, Http404):
        return error_response(
            message="Resource not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND"
        )
    
    if isinstance(exc, PermissionDenied):
        return error_response(
            message="Permission denied",
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="PERMISSION_DENIED"
        )
    
    if isinstance(exc, DjangoValidationError):
        errors = {}
        if hasattr(exc, 'error_dict'):
            errors = {k: [str(v) for v in v_list] for k, v_list in exc.error_dict.items()}
        elif hasattr(exc, 'error_list'):
            errors = {'non_field_errors': [str(e) for e in exc.error_list]}
        
        return error_response(
            message="Validation error",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="VALIDATION_ERROR",
            errors=errors
        )
    
    # Handle DRF exceptions
    if isinstance(exc, NotAuthenticated):
        return error_response(
            message="Authentication credentials were not provided.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="NOT_AUTHENTICATED"
        )
    
    if isinstance(exc, AuthenticationFailed):
        return error_response(
            message="Invalid authentication credentials.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="AUTHENTICATION_FAILED"
        )
    
    if isinstance(exc, DRFPermissionDenied):
        return error_response(
            message="You do not have permission to perform this action.",
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="PERMISSION_DENIED"
        )
    
    if isinstance(exc, DRFValidationError):
        errors = {}
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                errors = {k: v if isinstance(v, list) else [v] for k, v in exc.detail.items()}
            elif isinstance(exc.detail, list):
                errors = {'non_field_errors': exc.detail}
            else:
                errors = {'non_field_errors': [str(exc.detail)]}
        
        return error_response(
            message="Validation error",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="VALIDATION_ERROR",
            errors=errors
        )
    
    if isinstance(exc, NotFound):
        return error_response(
            message="Resource not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND"
        )
    
    if isinstance(exc, MethodNotAllowed):
        return error_response(
            message=f"Method '{exc.request.method}' not allowed.",
            status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
            error_code="METHOD_NOT_ALLOWED"
        )
    
    if isinstance(exc, Throttled):
        return error_response(
            message="Request was throttled. Please try again later.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="THROTTLED",
            details={
                "wait_seconds": exc.wait if hasattr(exc, 'wait') else None
            }
        )
    
    # Handle generic APIException
    if isinstance(exc, APIException):
        if response is not None:
            # Extract error details from DRF response
            error_data = response.data
            message = "An error occurred"
            errors = None
            
            if isinstance(error_data, dict):
                if 'detail' in error_data:
                    message = str(error_data['detail'])
                elif 'message' in error_data:
                    message = str(error_data['message'])
                else:
                    # Use the first error message found
                    for key, value in error_data.items():
                        if isinstance(value, (list, str)):
                            message = f"{key}: {value[0] if isinstance(value, list) else value}"
                            break
                    errors = error_data
            elif isinstance(error_data, (list, str)):
                message = error_data[0] if isinstance(error_data, list) else str(error_data)
            
            return error_response(
                message=message,
                status_code=response.status_code,
                error_code="API_ERROR",
                errors=errors
            )
    
    # Log unexpected exceptions
    if response is None:
        logger.exception("Unhandled exception occurred", exc_info=exc)
        return error_response(
            message="An unexpected error occurred. Please try again later.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="INTERNAL_SERVER_ERROR"
        )
    
    # For other exceptions, return the default response
    return response

