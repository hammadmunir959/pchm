from __future__ import annotations

from typing import Iterable, Sequence

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags


class EmailService:
    """Utility wrapper around Django's email utilities for common project messages."""

    def __init__(self) -> None:
        self.from_email = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER

    def _send(
        self,
        *,
        subject: str,
        template: str,
        context: dict,
        recipients: Sequence[str],
        fail_silently: bool = False,
    ) -> None:
        html_body = render_to_string(template, context)
        text_body = strip_tags(html_body)

        message = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=self.from_email,
            to=list(recipients),
        )
        message.attach_alternative(html_body, "text/html")
        message.send(fail_silently=fail_silently)

    def send_otp_email(self, email: str, otp_code: str, *, purpose: str = "verification") -> None:
        template = (
            "emails/otp_email.html"
            if purpose == "verification"
            else "emails/password_reset_email.html"
        )
        subject = (
            "OTP Verification Code"
            if purpose == "verification"
            else "Password Reset Code"
        )
        self._send(
            subject=subject,
            template=template,
            context={
                "otp_code": otp_code,
                "site_name": settings.SITE_NAME,
            },
            recipients=[email],
        )

    def send_claim_confirmation(self, email: str, claim) -> None:
        self._send(
            subject="Claim Submitted Successfully",
            template="emails/claim_confirmation.html",
            context={
                "claim": claim,
                "site_name": settings.SITE_NAME,
            },
            recipients=[email],
            fail_silently=True,
        )

    def notify_inquiry_team(self, inquiry) -> None:
        support_email = settings.SUPPORT_EMAIL or self.from_email
        self._send(
            subject="New Inquiry Received",
            template="emails/inquiry_notification.html",
            context={
                "inquiry": inquiry,
                "site_name": settings.SITE_NAME,
            },
            recipients=[support_email],
            fail_silently=True,
        )

    def send_inquiry_acknowledgement(self, inquiry) -> None:
        self._send(
            subject="We received your inquiry",
            template="emails/inquiry_acknowledgement.html",
            context={
                "inquiry": inquiry,
                "site_name": settings.SITE_NAME,
            },
            recipients=[inquiry.email],
            fail_silently=True,
        )

    def send_inquiry_reply(self, inquiry, *, reply_message: str) -> None:
        self._send(
            subject=f"Re: {inquiry.subject}",
            template="emails/inquiry_reply.html",
            context={
                "inquiry": inquiry,
                "reply_message": reply_message,
                "site_name": settings.SITE_NAME,
            },
            recipients=[inquiry.email],
        )

    def notify_super_admin_of_admin_request(
        self,
        *,
        super_admin_email: str,
        admin_email: str,
        admin_name: str,
    ) -> None:
        self._send(
            subject="New admin awaiting your approval",
            template="emails/admin_pending_approval.html",
            context={
                "admin_email": admin_email,
                "admin_name": admin_name,
                "site_name": settings.SITE_NAME,
            },
            recipients=[super_admin_email],
            fail_silently=True,
        )

    def notify_purchase_request_team(self, purchase_request) -> None:
        support_email = settings.SUPPORT_EMAIL or self.from_email
        self._send(
            subject="New vehicle purchase request",
            template="emails/purchase_request_notification.html",
            context={
                "request": purchase_request,
                "site_name": settings.SITE_NAME,
            },
            recipients=[support_email],
            fail_silently=True,
        )

    def send_purchase_request_acknowledgement(self, purchase_request) -> None:
        self._send(
            subject="We received your purchase request",
            template="emails/purchase_request_acknowledgement.html",
            context={
                "request": purchase_request,
                "site_name": settings.SITE_NAME,
            },
            recipients=[purchase_request.email],
            fail_silently=True,
        )

    def notify_sell_request_team(self, sell_request) -> None:
        support_email = settings.SUPPORT_EMAIL or self.from_email
        self._send(
            subject="New vehicle sell request",
            template="emails/sell_request_notification.html",
            context={
                "request": sell_request,
                "site_name": settings.SITE_NAME,
            },
            recipients=[support_email],
            fail_silently=True,
        )

    def send_sell_request_acknowledgement(self, sell_request) -> None:
        # Only send email if email is provided
        if not sell_request.email:
            return
        self._send(
            subject="We received your sell request",
            template="emails/sell_request_acknowledgement.html",
            context={
                "request": sell_request,
                "site_name": settings.SITE_NAME,
            },
            recipients=[sell_request.email],
            fail_silently=True,
        )


email_service = EmailService()


def send_otp_email(email: str, otp_code: str, *, purpose: str = "verification") -> None:
    email_service.send_otp_email(email, otp_code, purpose=purpose)


def send_claim_confirmation(email: str, claim_data) -> None:
    email_service.send_claim_confirmation(email, claim_data)


def notify_inquiry_team(inquiry) -> None:
    email_service.notify_inquiry_team(inquiry)


def send_inquiry_acknowledgement(inquiry) -> None:
    email_service.send_inquiry_acknowledgement(inquiry)


def send_inquiry_reply(inquiry, *, reply_message: str) -> None:
    email_service.send_inquiry_reply(
        inquiry,
        reply_message=reply_message,
    )


def notify_super_admin_of_admin_request(*, super_admin_email: str, admin_email: str, admin_name: str) -> None:
    email_service.notify_super_admin_of_admin_request(
        super_admin_email=super_admin_email,
        admin_email=admin_email,
        admin_name=admin_name,
    )


def notify_purchase_request_team(purchase_request) -> None:
    email_service.notify_purchase_request_team(purchase_request)


def send_purchase_request_acknowledgement(purchase_request) -> None:
    email_service.send_purchase_request_acknowledgement(purchase_request)


def notify_sell_request_team(sell_request) -> None:
    email_service.notify_sell_request_team(sell_request)


def send_sell_request_acknowledgement(sell_request) -> None:
    email_service.send_sell_request_acknowledgement(sell_request)