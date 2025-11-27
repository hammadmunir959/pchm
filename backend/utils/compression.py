"""
Response compression middleware for API performance.
"""
import gzip
from io import BytesIO
from typing import Callable

from django.utils.deprecation import MiddlewareMixin
from django.conf import settings


class GZipCompressionMiddleware(MiddlewareMixin):
    """
    Middleware to compress API responses with gzip.
    """
    
    # Content types that should be compressed
    COMPRESSIBLE_CONTENT_TYPES = [
        'application/json',
        'application/javascript',
        'text/css',
        'text/html',
        'text/javascript',
        'text/plain',
        'text/xml',
    ]
    
    # Minimum response size to compress (bytes)
    MIN_COMPRESS_SIZE = 200
    
    def process_response(self, request, response):
        """Compress response if applicable."""
        # Skip compression in development if disabled
        if settings.DEBUG and not getattr(settings, 'ENABLE_COMPRESSION', False):
            return response
        
        # Only compress API responses
        if not request.path.startswith('/api/'):
            return response
        
        # Check if client accepts gzip
        accept_encoding = request.META.get('HTTP_ACCEPT_ENCODING', '')
        if 'gzip' not in accept_encoding:
            return response
        
        # Check content type
        content_type = response.get('Content-Type', '')
        if not any(ct in content_type for ct in self.COMPRESSIBLE_CONTENT_TYPES):
            return response
        
        # Check response size
        content = response.content
        if len(content) < self.MIN_COMPRESS_SIZE:
            return response
        
        # Check if already compressed
        if response.get('Content-Encoding'):
            return response
        
        # Compress content
        try:
            compressed_content = gzip.compress(content)
            
            # Only use compression if it actually reduces size
            if len(compressed_content) < len(content):
                response.content = compressed_content
                response['Content-Encoding'] = 'gzip'
                response['Content-Length'] = str(len(compressed_content))
                # Remove Vary header if present, add our own
                if 'Vary' not in response:
                    response['Vary'] = 'Accept-Encoding'
        except Exception:
            # If compression fails, return original response
            pass
        
        return response

