"""
Enhanced pagination classes for optimized API responses.
"""
from rest_framework.pagination import PageNumberPagination, CursorPagination
from rest_framework.response import Response
from typing import Any, Dict


class CustomPagination(PageNumberPagination):
    """
    Standard page number pagination with optimizations.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data: list) -> Response:
        """Return paginated response with metadata."""
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page': self.page.number,
            'page_size': self.page_size,
            'total_pages': self.page.paginator.num_pages,
            'results': data,
        })


class OptimizedPagination(PageNumberPagination):
    """
    Optimized pagination for large datasets.
    Uses only() and defer() to limit queryset fields.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def paginate_queryset(self, queryset, request, view=None):
        """Paginate queryset with optimization."""
        # For list views, optimize queryset
        if hasattr(view, 'action') and view.action == 'list':
            # Try to use only() if model has common fields
            if hasattr(queryset.model, '_meta'):
                # Get common fields that are usually needed
                common_fields = ['id', 'created_at', 'updated_at']
                # Add model-specific fields if available
                if hasattr(queryset.model, 'name'):
                    common_fields.append('name')
                if hasattr(queryset.model, 'status'):
                    common_fields.append('status')
                
                # Only fetch necessary fields
                try:
                    queryset = queryset.only(*common_fields)
                except Exception:
                    # If only() fails, continue with full queryset
                    pass
        
        return super().paginate_queryset(queryset, request, view)
    
    def get_paginated_response(self, data: list) -> Response:
        """Return paginated response."""
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page': self.page.number,
            'page_size': self.page_size,
            'total_pages': self.page.paginator.num_pages,
            'results': data,
        })


class CursorBasedPagination(CursorPagination):
    """
    Cursor-based pagination for very large datasets.
    Better performance than offset-based pagination.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    ordering = '-created_at'
    
    def get_paginated_response(self, data: list) -> Response:
        """Return paginated response with cursor info."""
        return Response({
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page_size': self.page_size,
            'results': data,
        })


