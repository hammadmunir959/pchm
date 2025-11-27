from datetime import timedelta
from typing import Optional

import requests
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone


def validate_recaptcha(token: str, ip_address: Optional[str] = None) -> bool:
    """
    Validate a reCAPTCHA token against Google's API.
    Returns True if validation passes or if reCAPTCHA is not configured.
    """
    if settings.DEBUG or not settings.RECAPTCHA_PRIVATE_KEY:
        return True

    payload = {
        'secret': settings.RECAPTCHA_PRIVATE_KEY,
        'response': token,
    }

    if ip_address:
        payload['remoteip'] = ip_address

    try:
        response = requests.post(
            'https://www.google.com/recaptcha/api/siteverify',
            data=payload,
            timeout=5,
        )
        response.raise_for_status()
        result = response.json()
    except Exception:
        return False

    score = result.get('score', 0)
    required_score = getattr(settings, 'RECAPTCHA_REQUIRED_SCORE', 0.5)
    return result.get('success', False) and score >= required_score


def check_rate_limit(ip_address: str, action_type: str, max_requests: int = 3, window_minutes: int = 60) -> bool:
    """
    Simple rate limiter based on IP address and action type.
    Returns True if the limit is exceeded.
    """
    cache_key = f"rate_limit:{action_type}:{ip_address}"
    now = timezone.now()
    window_start = now - timedelta(minutes=window_minutes)

    request_times = cache.get(cache_key, [])
    request_times = [timestamp for timestamp in request_times if timestamp > window_start]

    if len(request_times) >= max_requests:
        return True

    request_times.append(now)
    cache.set(cache_key, request_times, window_minutes * 60)
    return False
