from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.core.mail import send_mass_mail, send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
from django.utils import timezone
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.db.models import F
from django.core.signing import TimestampSigner
import re

from .models import NewsletterSubscriber, NewsletterCampaign, NewsletterRecipient
from .serializers import NewsletterSubscriberSerializer, NewsletterCampaignSerializer
from utils.permissions import IsAdmin

@api_view(['POST'])
@permission_classes([AllowAny])
def subscribe_newsletter(request):
    """Subscribe to newsletter"""
    email = request.data.get('email', '').strip()
    name = request.data.get('name', '').strip()

    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    subscriber, created = NewsletterSubscriber.objects.get_or_create(
        email=email,
        defaults={
            'name': name,
            'source': request.data.get('source', 'website')
        }
    )

    if created:
        # Send welcome email
        html_message = render_to_string('emails/newsletter_welcome.html', {
            'name': name or 'there',
            'email': email
        })
        plain_message = f"Welcome to Prestige Car Hire Management newsletter! You've successfully subscribed with {email}."

        try:
            from django.core.mail import send_mail
            send_mail(
                subject="Welcome to Our Newsletter",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=True
            )
        except:
            pass  # Don't fail subscription if email fails

        return Response({'message': 'Successfully subscribed to newsletter'}, status=status.HTTP_201_CREATED)
    else:
        return Response({'message': 'Email already subscribed'}, status=status.HTTP_200_OK)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def unsubscribe_newsletter(request):
    """Unsubscribe from newsletter - supports both GET (query param) and POST (body)"""
    # Support both GET (query param) and POST (body) requests
    if request.method == 'GET':
        email = request.GET.get('email', '').strip()
    else:
        email = request.data.get('email', '').strip()

    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Try to get subscriber regardless of active status
        subscriber = NewsletterSubscriber.objects.get(email=email)
        
        # If already unsubscribed, return success message
        if not subscriber.is_active:
            return Response({
                'message': 'This email is already unsubscribed from our newsletter.',
                'already_unsubscribed': True
            })
        
        # Unsubscribe the subscriber
        subscriber.is_active = False
        subscriber.unsubscribed_at = timezone.now()
        subscriber.save()

        return Response({
            'message': 'Successfully unsubscribed from newsletter',
            'already_unsubscribed': False
        })

    except NewsletterSubscriber.DoesNotExist:
        # Return success even if not found (privacy best practice - don't reveal if email exists)
        return Response({
            'message': 'If this email was subscribed, it has been unsubscribed from our newsletter.',
            'not_found': True
        })

class NewsletterSubscriberViewSet(viewsets.ModelViewSet):
    """Newsletter subscriber management (admin only)"""
    queryset = NewsletterSubscriber.objects.all()
    serializer_class = NewsletterSubscriberSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'source']

class NewsletterCampaignViewSet(viewsets.ModelViewSet):
    """Newsletter campaign management (admin only)"""
    queryset = NewsletterCampaign.objects.select_related('created_by')
    serializer_class = NewsletterCampaignSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def send_campaign(self, request, pk=None):
        """Send newsletter campaign"""
        campaign = self.get_object()

        if campaign.status != 'draft':
            return Response({'error': 'Campaign can only be sent from draft status'}, status=status.HTTP_400_BAD_REQUEST)

        # Get active subscribers
        subscribers = NewsletterSubscriber.objects.filter(is_active=True)
        recipients = [subscriber.email for subscriber in subscribers]

        if not recipients:
            return Response({'error': 'No active subscribers found'}, status=status.HTTP_400_BAD_REQUEST)

        # Update campaign status
        campaign.status = 'sending'
        campaign.recipients_count = len(recipients)
        campaign.sent_at = timezone.now()
        campaign.save()

        # Send emails (this would typically be done asynchronously with Celery)
        try:
            # For simplicity, sending synchronously (use Celery in production)
            sent_count = 0
            errors = []
            signer = TimestampSigner()
            
            for email in recipients:
                try:
                    # Ensure recipient tracking record and token
                    recipient, _ = NewsletterRecipient.objects.get_or_create(
                        campaign=campaign,
                        email=email,
                        defaults={'is_test': False, 'token': signer.sign(f"{campaign.id}:{email}")}
                    )
                    if not recipient.token:
                        recipient.token = signer.sign(f"{campaign.id}:{email}")
                        recipient.save(update_fields=['token'])

                    html_content = campaign.content.replace('{{email}}', email)
                    footer_html = f"""
                    <hr style='border:none;border-top:1px solid #eee;margin:20px 0;'/>
                    <div style='font-size:12px;color:#666'>
                      You are receiving this email because you subscribed to our newsletter.
                      <br/>
                      <a href="/unsubscribe?email={email}">Unsubscribe</a>
                    </div>
                    """
                    # Append tracking pixel (open)
                    pixel_url = request.build_absolute_uri(
                        reverse('newsletter:campaign-open', args=[campaign.id])
                    )
                    tracking_pixel = f'<img src="{pixel_url}?t={recipient.token}" width="1" height="1" style="display:none" alt="." />'
                    # Rewrite links to pass through click tracker
                    click_base = request.build_absolute_uri(
                        reverse('newsletter:campaign-click', args=[campaign.id])
                    )
                    def _rewrite_link(match: re.Match) -> str:
                        href = match.group(1)
                        # Only rewrite http(s) links
                        if href.startswith('http://') or href.startswith('https://'):
                            return f'href="{click_base}?t={recipient.token}&u={href}"'
                        return f'href="{href}"'
                    html_content = re.sub(r'href="([^"]+)"', _rewrite_link, html_content)
                    html_content = f"{html_content}{tracking_pixel}{footer_html}"
                    plain_content = strip_tags(html_content)

                    # Use EmailMultiAlternatives to support HTML
                    msg = EmailMultiAlternatives(
                        subject=campaign.subject,
                        body=plain_content,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to=[email],
                    )
                    msg.attach_alternative(html_content, "text/html")
                    msg.send(fail_silently=False)
                    sent_count += 1
                except Exception as e:
                    errors.append(f"Failed to send to {email}: {str(e)}")
                    # Continue sending to other recipients even if one fails

            if sent_count > 0:
                campaign.status = 'sent'
                campaign.save()
                message = f'Campaign sent to {sent_count} out of {len(recipients)} subscribers'
                if errors:
                    message += f'. {len(errors)} failed.'
                return Response({'message': message})
            else:
                campaign.status = 'cancelled'
                campaign.save()
                return Response({
                    'error': f'Failed to send campaign to any subscribers. Errors: {", ".join(errors[:5])}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            campaign.status = 'cancelled'
            campaign.save()
            return Response({'error': f'Failed to send campaign: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def send_test(self, request, pk=None):
        """Send a test email of the campaign to a specified address"""
        campaign = self.get_object()
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            signer = TimestampSigner()
            recipient, _ = NewsletterRecipient.objects.get_or_create(
                campaign=campaign,
                email=email,
                defaults={'is_test': True, 'token': signer.sign(f"{campaign.id}:{email}:test")}
            )
            if not recipient.token:
                recipient.token = signer.sign(f"{campaign.id}:{email}:test")
                recipient.is_test = True
                recipient.save(update_fields=['token', 'is_test'])

            html_content = campaign.content.replace('{{email}}', email)
            footer_html = f"""
            <hr style='border:none;border-top:1px solid #eee;margin:20px 0;'/>
            <div style='font-size:12px;color:#666'>
              This is a test email preview of your campaign.
              <br/>
              <a href="/unsubscribe?email={email}">Unsubscribe</a>
            </div>
            """
            # Append tracking pixel (open)
            pixel_url = request.build_absolute_uri(
                reverse('newsletter:campaign-open', args=[campaign.id])
            )
            tracking_pixel = f'<img src="{pixel_url}?t={recipient.token}" width="1" height="1" style="display:none" alt="." />'
            # Rewrite links to pass through click tracker
            click_base = request.build_absolute_uri(
                reverse('newsletter:campaign-click', args=[campaign.id])
            )
            def _rewrite_link(match: re.Match) -> str:
                href = match.group(1)
                if href.startswith('http://') or href.startswith('https://'):
                    return f'href="{click_base}?t={recipient.token}&u={href}"'
                return f'href="{href}"'
            html_content = re.sub(r'href="([^"]+)"', _rewrite_link, html_content)
            html_content = f"{html_content}{tracking_pixel}{footer_html}"
            plain_content = strip_tags(html_content)

            msg = EmailMultiAlternatives(
                subject=f"[TEST] {campaign.subject}",
                body=plain_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            return Response({'message': f'Test email sent to {email}'})
        except Exception as e:
            return Response({'error': f'Failed to send test email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _one_by_one_transparent_gif() -> bytes:
    # Minimal 1x1 transparent GIF
    return (
        b"GIF89a"          # Header
        b"\x01\x00\x01\x00"  # Width=1, Height=1
        b"\x80"            # Global Color Table Flag set (2 colors)
        b"\x00"            # Background Color Index
        b"\x00"            # Pixel aspect ratio
        b"\x00\x00\x00"    # Color #0: black
        b"\xff\xff\xff"    # Color #1: white
        b"\x21\xf9\x04\x01\x00\x00\x00\x00"  # Graphics Control Extension (no delay)
        b"\x2c\x00\x00\x00\x00\x01\x01\x00\x00"  # Image Descriptor
        b"\x02\x02\x44\x01\x00"  # Image Data
        b"\x3b"            # Trailer
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def campaign_open_pixel(request, pk: int):
    """1x1 tracking pixel to count opens for a campaign per recipient (dedup)."""
    token = request.GET.get('t', '').strip()
    if token:
        try:
            recipient = NewsletterRecipient.objects.get(campaign_id=pk, token=token)
            now = timezone.now()
            if recipient.open_count == 0 and not recipient.is_test:
                NewsletterCampaign.objects.filter(pk=pk).update(opened_count=F('opened_count') + 1)
                recipient.first_opened_at = now
            recipient.open_count = F('open_count') + 1
            recipient.last_opened_at = now
            recipient.save(update_fields=['open_count', 'first_opened_at', 'last_opened_at'])
        except NewsletterRecipient.DoesNotExist:
            pass
    gif = _one_by_one_transparent_gif()
    resp = HttpResponse(gif, content_type="image/gif")
    resp['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    resp['Pragma'] = 'no-cache'
    return resp


@api_view(['GET'])
@permission_classes([AllowAny])
def campaign_click_redirect(request, pk: int):
    """Click redirect to count clicks per recipient (dedup), then redirect."""
    target = request.GET.get('u', '').strip()
    token = request.GET.get('t', '').strip()
    if not target:
        return Response({'error': 'Missing target url'}, status=status.HTTP_400_BAD_REQUEST)
    if token:
        try:
            recipient = NewsletterRecipient.objects.get(campaign_id=pk, token=token)
            now = timezone.now()
            if recipient.click_count == 0 and not recipient.is_test:
                NewsletterCampaign.objects.filter(pk=pk).update(clicked_count=F('clicked_count') + 1)
                recipient.first_clicked_at = now
            recipient.click_count = F('click_count') + 1
            recipient.last_clicked_at = now
            recipient.save(update_fields=['click_count', 'first_clicked_at', 'last_clicked_at'])
        except NewsletterRecipient.DoesNotExist:
            pass
    return HttpResponseRedirect(target)
