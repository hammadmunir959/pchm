from rest_framework.throttling import BaseThrottle
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta


class TestimonialSubmissionThrottle(BaseThrottle):
    """
    Custom throttle for testimonial submissions.
    Allows max 2 submissions per hour per IP address.
    """
    rate = '2/hour'  # For documentation, actual logic is in allow_request
    scope = 'testimonial_submission'

    def get_ident(self, request):
        """Get IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '')
        return ip

    def allow_request(self, request, view):
        """
        Check if the request should be throttled.
        Returns True if request is allowed, False if throttled.
        """
        ident = self.get_ident(request)
        if not ident:
            # If we can't get IP, allow the request (fallback)
            return True

        cache_key = f"testimonial_throttle:{ident}"
        now = timezone.now()
        window_start = now - timedelta(hours=1)

        # Get existing submission times from cache
        submission_times = cache.get(cache_key, [])

        # Filter out submissions outside the 1-hour window
        submission_times = [
            timestamp for timestamp in submission_times
            if timestamp > window_start
        ]

        # Check if limit exceeded
        if len(submission_times) >= 2:
            # Store the oldest submission time for wait calculation
            self.oldest_submission = min(submission_times)
            return False

        # Add current submission time
        submission_times.append(now)
        # Cache for 1 hour (3600 seconds)
        cache.set(cache_key, submission_times, 3600)

        return True

    def wait(self):
        """Return how long to wait before next request (in seconds)"""
        # Calculate remaining time until the oldest submission expires
        if hasattr(self, 'oldest_submission'):
            now = timezone.now()
            window_end = self.oldest_submission + timedelta(hours=1)
            wait_seconds = max(0, (window_end - now).total_seconds())
            return int(wait_seconds)
        return 3600  # Default: 1 hour in seconds

