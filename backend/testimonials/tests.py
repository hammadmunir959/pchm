from django.test import TestCase

from .models import Testimonial
from .serializers import TestimonialCreateSerializer


class TestimonialModelTests(TestCase):
    def test_string_representation(self):
        testimonial = Testimonial.objects.create(
            name='Jane Doe',
            feedback='Great service',
            rating=5,
        )
        self.assertEqual(str(testimonial), 'Jane Doe (5/5)')


class TestimonialSerializerTests(TestCase):
    def test_rating_validation(self):
        serializer = TestimonialCreateSerializer(
            data={'name': 'John', 'feedback': 'Nice', 'rating': 6}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('rating', serializer.errors)
