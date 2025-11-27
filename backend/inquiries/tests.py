from django.test import TestCase

from .models import Inquiry


class InquiryModelTests(TestCase):
    def test_string_representation(self):
        inquiry = Inquiry.objects.create(
            name='Sam Customer',
            email='sam@example.com',
            subject='Need a replacement vehicle',
            message='Please help after my accident.',
        )

        self.assertIn('Need a replacement vehicle', str(inquiry))
