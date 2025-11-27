# Generated manually - Create Theme model and update Event model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('theming', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Theme',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.SlugField(help_text="Unique identifier for the theme (e.g., 'summer_2024')", max_length=120, unique=True)),
                ('name', models.CharField(help_text='Display name for the theme', max_length=200)),
                ('primary_color', models.CharField(default='#0b5cff', help_text='Primary theme color in hex format', max_length=7)),
                ('secondary_color', models.CharField(default='#00d4ff', help_text='Secondary theme color in hex format', max_length=7)),
                ('background_color', models.CharField(blank=True, default='', help_text='Background color for the website in hex format', max_length=7)),
                ('text_color', models.CharField(blank=True, default='', help_text='Main text color in hex format', max_length=7)),
                ('accent_color', models.CharField(blank=True, default='', help_text='Accent color for buttons and highlights in hex format', max_length=7)),
                ('banner', models.CharField(blank=True, default='', help_text='Path to banner image', max_length=500)),
                ('hero_background', models.CharField(blank=True, default='', help_text='Hero section background (image URL or color)', max_length=500)),
                ('icons_path', models.CharField(blank=True, default='', help_text='Path to icons directory', max_length=500)),
                ('animations', models.JSONField(blank=True, default=list, help_text='List of animation names')),
                ('popup_title', models.CharField(blank=True, max_length=200, null=True)),
                ('popup_content', models.TextField(blank=True, null=True)),
                ('landing_popup_enabled', models.BooleanField(default=True)),
                ('landing_popup_title', models.CharField(blank=True, default='', max_length=200)),
                ('landing_popup_subtitle', models.CharField(blank=True, default='', max_length=200)),
                ('landing_popup_description', models.TextField(blank=True, default='')),
                ('landing_popup_button_text', models.CharField(blank=True, default='', max_length=200)),
                ('landing_popup_image_url', models.CharField(blank=True, default='', max_length=500)),
                ('landing_popup_overlay_text', models.CharField(blank=True, default='', max_length=200)),
                ('is_custom', models.BooleanField(default=True, help_text='True for user-created themes, False for system defaults')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Theme',
                'verbose_name_plural': 'Themes',
                'ordering': ['name'],
            },
        ),
        migrations.RemoveField(
            model_name='event',
            name='theme',
        ),
        migrations.AddField(
            model_name='event',
            name='theme_key',
            field=models.CharField(default='default', help_text='Theme key (can be from predefined themes or custom themes)', max_length=120),
            preserve_default=False,
        ),
    ]
