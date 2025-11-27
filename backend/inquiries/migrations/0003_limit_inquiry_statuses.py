from django.db import migrations, models


STATUS_MAP_FORWARD = {
    'new': 'unread',
    'seen': 'unread',
    'in_progress': 'unread',
    'in_replied': 'replied',
    'resolved': 'resolved',
    'closed': 'resolved',
}

STATUS_MAP_BACKWARD = {
    'unread': 'new',
    'replied': 'in_replied',
    'resolved': 'resolved',
}


def migrate_statuses_forward(apps, schema_editor):
    Inquiry = apps.get_model('inquiries', 'Inquiry')
    for old_status, new_status in STATUS_MAP_FORWARD.items():
        Inquiry.objects.filter(status=old_status).update(status=new_status)


def migrate_statuses_backward(apps, schema_editor):
    Inquiry = apps.get_model('inquiries', 'Inquiry')
    for new_status, old_status in STATUS_MAP_BACKWARD.items():
        Inquiry.objects.filter(status=new_status).update(status=old_status)


class Migration(migrations.Migration):

    dependencies = [
        ('inquiries', '0002_inquiry_add_in_replied_status'),
    ]

    operations = [
        migrations.RunPython(migrate_statuses_forward, migrate_statuses_backward),
        migrations.AlterField(
            model_name='inquiry',
            name='status',
            field=models.CharField(
                choices=[
                    ('unread', 'Unread'),
                    ('replied', 'Replied'),
                    ('resolved', 'Resolved'),
                ],
                default='unread',
                max_length=20,
            ),
        ),
    ]

