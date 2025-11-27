from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import CookieConsent
from .serializers import CookieConsentSerializer, CookieConsentCreateSerializer
from utils.permissions import IsAdmin

class CookieConsentViewSet(viewsets.ReadOnlyModelViewSet):
    """Cookie consent management (admin only)"""
    queryset = CookieConsent.objects.select_related('user')
    serializer_class = CookieConsentSerializer
    permission_classes = [IsAdmin]

@api_view(['POST'])
def submit_cookie_consent(request):
    """Submit cookie consent preferences"""
    data = request.data.copy()
    data['ip_address'] = request.META.get('REMOTE_ADDR')
    data['user_agent'] = request.META.get('HTTP_USER_AGENT')

    serializer = CookieConsentCreateSerializer(data=data, context={'request': request})

    if serializer.is_valid():
        consent, created = CookieConsent.objects.get_or_create(
            session_id=data['session_id'],
            defaults=serializer.validated_data
        )

        if not created:
            # Update existing consent
            for field in ['analytics_cookies', 'marketing_cookies', 'functional_cookies']:
                if field in data:
                    setattr(consent, field, data[field])
            consent.save()

        return Response({'message': 'Cookie consent saved successfully'})

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
