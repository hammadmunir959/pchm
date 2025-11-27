"""
Add database indexes for performance optimization.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS blog_status_idx ON blog_blogpost(status);",
                "CREATE INDEX IF NOT EXISTS blog_created_at_idx ON blog_blogpost(created_at DESC);",
                "CREATE INDEX IF NOT EXISTS blog_author_idx ON blog_blogpost(author_id);",
                "CREATE INDEX IF NOT EXISTS blog_slug_idx ON blog_blogpost(slug);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS blog_status_idx;",
                "DROP INDEX IF EXISTS blog_created_at_idx;",
                "DROP INDEX IF EXISTS blog_author_idx;",
                "DROP INDEX IF EXISTS blog_slug_idx;",
            ]
        ),
    ]

