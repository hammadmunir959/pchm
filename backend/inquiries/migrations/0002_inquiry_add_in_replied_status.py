# pyright: reportMissingImports=false
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inquiries', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='inquiry',
            name='status',
            field=models.CharField(
                choices=[
                    ('new', 'New'),
                    ('seen', 'Seen'),
                    ('in_progress', 'In Progress'),
                    ('in_replied', 'In Replied'),
                    ('resolved', 'Resolved'),
                    ('closed', 'Closed'),
                ],
                default='new',
                max_length=20,
            ),
        ),
    ]

