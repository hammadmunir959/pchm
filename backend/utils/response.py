"""
Standardized API response utilities.
"""
from typing import Any, Dict, Optional

from rest_framework.response import Response
from rest_framework import status


def success_response(
    data: Any = None,
    message: str = "Success",
    status_code: int = status.HTTP_200_OK,
    meta: Optional[Dict[str, Any]] = None
) -> Response:
    """
    Create a standardized success response.
    
    Args:
        data: Response data
        message: Success message
        status_code: HTTP status code
        meta: Additional metadata
    
    Returns:
        Response: Standardized success response
    """
    response_data: Dict[str, Any] = {
        "success": True,
        "message": message,
    }
    
    if data is not None:
        response_data["data"] = data
    
    if meta:
        response_data["meta"] = meta
    
    return Response(response_data, status=status_code)


def error_response(
    message: str,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    error_code: Optional[str] = None,
    errors: Optional[Dict[str, Any]] = None,
    details: Optional[Dict[str, Any]] = None
) -> Response:
    """
    Create a standardized error response.
    
    Args:
        message: Error message
        status_code: HTTP status code
        error_code: Error code identifier
        errors: Field-specific errors (for validation)
        details: Additional error details
    
    Returns:
        Response: Standardized error response
    """
    response_data: Dict[str, Any] = {
        "success": False,
        "error": message,
        "error_code": error_code or "ERROR",
    }
    
    if errors:
        response_data["errors"] = errors
    
    if details:
        response_data["details"] = details
    
    return Response(response_data, status=status_code)


def paginated_response(
    data: list,
    count: int,
    next_url: Optional[str] = None,
    previous_url: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    message: str = "Success"
) -> Response:
    """
    Create a standardized paginated response.
    
    Args:
        data: List of items
        count: Total count of items
        next_url: URL for next page
        previous_url: URL for previous page
        page: Current page number
        page_size: Items per page
        message: Success message
    
    Returns:
        Response: Standardized paginated response
    """
    response_data = {
        "success": True,
        "message": message,
        "count": count,
        "page": page,
        "page_size": page_size,
        "results": data,
    }
    
    if next_url:
        response_data["next"] = next_url
    
    if previous_url:
        response_data["previous"] = previous_url
    
    return Response(response_data)

