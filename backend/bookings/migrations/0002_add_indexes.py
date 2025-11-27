"""
Add database indexes for performance optimization.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings_claim(status);",
                "CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON bookings_claim(created_at DESC);",
                "CREATE INDEX IF NOT EXISTS bookings_assigned_staff_idx ON bookings_claim(assigned_staff_id);",
                "CREATE INDEX IF NOT EXISTS bookings_vehicle_idx ON bookings_claim(vehicle_id);",
                "CREATE INDEX IF NOT EXISTS bookings_email_idx ON bookings_claim(email);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS bookings_status_idx;",
                "DROP INDEX IF EXISTS bookings_created_at_idx;",
                "DROP INDEX IF EXISTS bookings_assigned_staff_idx;",
                "DROP INDEX IF EXISTS bookings_vehicle_idx;",
                "DROP INDEX IF EXISTS bookings_email_idx;",
            ]
        ),
    ]

