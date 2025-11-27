from io import BytesIO

from django.core.files.base import ContentFile
from django.db import models
from PIL import Image


class GalleryImage(models.Model):
    """Gallery image model"""
    CATEGORY_CHOICES = [
        ('vehicles', 'Vehicles'),
        ('office', 'Office'),
        ('events', 'Events'),
        ('testimonials', 'Testimonials'),
        ('general', 'General'),
    ]

    title = models.CharField(max_length=200)
    image = models.ImageField(upload_to='gallery/')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['display_order', '-uploaded_at']
        verbose_name = 'Gallery Image'
        verbose_name_plural = 'Gallery Images'

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        should_optimize = False

        if self.image:
            if not self.pk:
                should_optimize = True
            else:
                try:
                    original = GalleryImage.objects.get(pk=self.pk)
                except GalleryImage.DoesNotExist:
                    should_optimize = True
                else:
                    if original.image.name != self.image.name or original.image.size != self.image.size:
                        should_optimize = True

        if should_optimize:
            self._optimize_image()

        super().save(*args, **kwargs)

    def _optimize_image(self):
        """Reduce file size while maintaining reasonable quality."""
        if not self.image:
            return

        self.image.open()
        image = Image.open(self.image)
        image_format = image.format or 'JPEG'

        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
            image_format = 'JPEG'

        buffer = BytesIO()
        image.save(buffer, format=image_format, optimize=True, quality=85)
        buffer.seek(0)

        optimized_file = ContentFile(buffer.read())
        filename = self.image.name
        self.image.save(filename, optimized_file, save=False)
