"""
Tests for utility functions and classes.
"""
import pytest
from rest_framework import status

from utils.exceptions import (
    APIException,
    ValidationError,
    AuthenticationError,
    PermissionError,
    NotFoundError,
    ConflictError,
    ServerError,
)
from utils.response import success_response, error_response, paginated_response


class TestCustomExceptions:
    """Test custom exception classes."""
    
    def test_api_exception(self):
        """Test base APIException."""
        exc = APIException("Test error", status_code=400, error_code="TEST_ERROR")
        assert exc.message == "Test error"
        assert exc.status_code == 400
        assert exc.error_code == "TEST_ERROR"
    
    def test_validation_error(self):
        """Test ValidationError exception."""
        exc = ValidationError("Invalid input", details={"field": "value"})
        assert exc.message == "Invalid input"
        assert exc.status_code == 400
        assert exc.error_code == "VALIDATION_ERROR"
        assert exc.details == {"field": "value"}
    
    def test_authentication_error(self):
        """Test AuthenticationError exception."""
        exc = AuthenticationError("Not authenticated")
        assert exc.message == "Not authenticated"
        assert exc.status_code == 401
        assert exc.error_code == "AUTHENTICATION_ERROR"
    
    def test_permission_error(self):
        """Test PermissionError exception."""
        exc = PermissionError("Access denied")
        assert exc.message == "Access denied"
        assert exc.status_code == 403
        assert exc.error_code == "PERMISSION_ERROR"
    
    def test_not_found_error(self):
        """Test NotFoundError exception."""
        exc = NotFoundError("Resource not found")
        assert exc.message == "Resource not found"
        assert exc.status_code == 404
        assert exc.error_code == "NOT_FOUND"
    
    def test_conflict_error(self):
        """Test ConflictError exception."""
        exc = ConflictError("Resource conflict")
        assert exc.message == "Resource conflict"
        assert exc.status_code == 409
        assert exc.error_code == "CONFLICT"
    
    def test_server_error(self):
        """Test ServerError exception."""
        exc = ServerError("Internal error")
        assert exc.message == "Internal error"
        assert exc.status_code == 500
        assert exc.error_code == "SERVER_ERROR"


class TestResponseUtilities:
    """Test response utility functions."""
    
    def test_success_response(self):
        """Test success_response function."""
        response = success_response(
            data={"id": 1, "name": "Test"},
            message="Operation successful",
            status_code=status.HTTP_200_OK
        )
        
        assert response.status_code == 200
        data = response.data
        assert data["success"] is True
        assert data["message"] == "Operation successful"
        assert data["data"] == {"id": 1, "name": "Test"}
    
    def test_success_response_with_meta(self):
        """Test success_response with metadata."""
        response = success_response(
            data={"id": 1},
            message="Success",
            meta={"count": 10}
        )
        
        assert response.data["meta"] == {"count": 10}
    
    def test_error_response(self):
        """Test error_response function."""
        response = error_response(
            message="Validation failed",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="VALIDATION_ERROR",
            errors={"field": ["Error message"]}
        )
        
        assert response.status_code == 400
        data = response.data
        assert data["success"] is False
        assert data["error"] == "Validation failed"
        assert data["error_code"] == "VALIDATION_ERROR"
        assert data["errors"] == {"field": ["Error message"]}
    
    def test_paginated_response(self):
        """Test paginated_response function."""
        response = paginated_response(
            data=[{"id": 1}, {"id": 2}],
            count=100,
            next_url="http://example.com/api/?page=2",
            previous_url=None,
            page=1,
            page_size=20,
            message="Success"
        )
        
        assert response.status_code == 200
        data = response.data
        assert data["success"] is True
        assert data["count"] == 100
        assert data["page"] == 1
        assert data["page_size"] == 20
        assert len(data["results"]) == 2
        assert data["next"] == "http://example.com/api/?page=2"
        assert "previous" not in data or data["previous"] is None

