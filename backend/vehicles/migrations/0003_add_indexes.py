"""
Add database indexes for performance optimization.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vehicles', '0002_vehicle_additional_fields'),
    ]

    operations = [
        migrations.RunSQL(
            # Add indexes for frequently queried fields
            sql=[
                "CREATE INDEX IF NOT EXISTS vehicles_status_idx ON vehicles_vehicle(status);",
                "CREATE INDEX IF NOT EXISTS vehicles_type_idx ON vehicles_vehicle(type);",
                "CREATE INDEX IF NOT EXISTS vehicles_created_at_idx ON vehicles_vehicle(created_at DESC);",
                "CREATE INDEX IF NOT EXISTS vehicles_registration_idx ON vehicles_vehicle(registration);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS vehicles_status_idx;",
                "DROP INDEX IF EXISTS vehicles_type_idx;",
                "DROP INDEX IF EXISTS vehicles_created_at_idx;",
                "DROP INDEX IF EXISTS vehicles_registration_idx;",
            ]
        ),
    ]

