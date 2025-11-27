from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import BlogPost


class BlogPostModelTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='author@example.com',
            password='testpass123',
            username='author@example.com',
        )

    def test_string_representation(self):
        post = BlogPost.objects.create(
            title='New Fleet Update',
            slug='new-fleet-update',
            content='Details about new vehicles',
            author=self.user,
            status='draft',
        )

        self.assertEqual(str(post), 'New Fleet Update')
