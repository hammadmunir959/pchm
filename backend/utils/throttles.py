"""
Custom throttling classes for per-endpoint rate limiting.
"""
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle, SimpleRateThrottle


class AnonBurstRateThrottle(AnonRateThrottle):
    """Throttle for anonymous users - burst requests."""
    scope = 'anon_burst'
    rate = '20/minute'


class AnonSustainedRateThrottle(AnonRateThrottle):
    """Throttle for anonymous users - sustained requests."""
    scope = 'anon_sustained'
    rate = '100/hour'


class UserBurstRateThrottle(UserRateThrottle):
    """Throttle for authenticated users - burst requests."""
    scope = 'user_burst'
    rate = '60/minute'


class UserSustainedRateThrottle(UserRateThrottle):
    """Throttle for authenticated users - sustained requests."""
    scope = 'user_sustained'
    rate = '1000/hour'


class ChatbotRateThrottle(SimpleRateThrottle):
    """Throttle for chatbot endpoint - stricter limits."""
    scope = 'chatbot'
    rate = '10/minute'
    
    def get_cache_key(self, request, view):
        """Use IP address for anonymous users, user ID for authenticated."""
        if request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class AuthRateThrottle(SimpleRateThrottle):
    """Throttle for authentication endpoints - prevent brute force."""
    scope = 'auth'
    rate = '5/minute'
    
    def get_cache_key(self, request, view):
        """Use IP address for authentication throttling."""
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class ContactFormRateThrottle(SimpleRateThrottle):
    """Throttle for contact/inquiry forms - prevent spam."""
    scope = 'contact'
    rate = '3/hour'
    
    def get_cache_key(self, request, view):
        """Use IP address for contact form throttling."""
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class AdminActionRateThrottle(UserRateThrottle):
    """Throttle for admin actions - moderate limits."""
    scope = 'admin_action'
    rate = '100/minute'

