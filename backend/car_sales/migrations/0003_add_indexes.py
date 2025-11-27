"""
Add database indexes for performance optimization.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('car_sales', '0002_carsellrequest'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS car_sales_status_idx ON car_sales_carlisting(status);",
                "CREATE INDEX IF NOT EXISTS car_sales_created_at_idx ON car_sales_carlisting(created_at DESC);",
                "CREATE INDEX IF NOT EXISTS car_sales_make_model_idx ON car_sales_carlisting(make, model);",
                "CREATE INDEX IF NOT EXISTS car_sales_price_idx ON car_sales_carlisting(price);",
                "CREATE INDEX IF NOT EXISTS car_sales_featured_idx ON car_sales_carlisting(featured) WHERE featured = true;",
                "CREATE INDEX IF NOT EXISTS car_sales_purchase_status_idx ON car_sales_carpurchaserequest(status);",
                "CREATE INDEX IF NOT EXISTS car_sales_purchase_created_idx ON car_sales_carpurchaserequest(created_at DESC);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS car_sales_status_idx;",
                "DROP INDEX IF EXISTS car_sales_created_at_idx;",
                "DROP INDEX IF EXISTS car_sales_make_model_idx;",
                "DROP INDEX IF EXISTS car_sales_price_idx;",
                "DROP INDEX IF EXISTS car_sales_featured_idx;",
                "DROP INDEX IF EXISTS car_sales_purchase_status_idx;",
                "DROP INDEX IF EXISTS car_sales_purchase_created_idx;",
            ]
        ),
    ]

