from __future__ import annotations

import logging
from typing import Optional

from celery import shared_task
from django.conf import settings

from utils.backup import (
    backup_database,
    backup_media_files,
    cleanup_old_backups,
    create_backup_archive,
)

logger = logging.getLogger(__name__)


def _backups_enabled() -> bool:
    enabled = getattr(settings, 'BACKUP_ENABLED', True)
    if not enabled:
        logger.info('Backups are disabled via BACKUP_ENABLED setting.')
    return enabled


@shared_task(bind=True)
def run_database_backup(self) -> Optional[str]:
    """Create a PostgreSQL backup using pg_dump."""
    if not _backups_enabled():
        return None

    backup_path = backup_database()
    logger.info('Database backup created at %s', backup_path)
    return backup_path


@shared_task(bind=True)
def run_media_backup(self) -> Optional[str]:
    """Create a compressed archive of the media directory."""
    if not _backups_enabled():
        return None

    media_backup_path = backup_media_files()
    logger.info('Media backup created at %s', media_backup_path)
    return media_backup_path


@shared_task(bind=True)
def run_full_backup(self) -> Optional[str]:
    """Create database and media backups, then bundle them into a single archive."""
    if not _backups_enabled():
        return None

    db_backup_path = backup_database()
    media_backup_path = backup_media_files()
    archive_path = create_backup_archive(db_backup_path, media_backup_path)
    logger.info(
        'Full backup archive created at %s (db=%s, media=%s)',
        archive_path,
        db_backup_path,
        media_backup_path,
    )

    # Perform retention cleanup after successful backup
    retention_days = getattr(settings, 'BACKUP_RETENTION_DAYS', 30)
    cleanup_old_backups(days=retention_days)
    logger.info('Old backups older than %s days cleaned up.', retention_days)
    return archive_path


@shared_task(bind=True)
def cleanup_expired_backups(self) -> None:
    """Standalone task to enforce retention policy even if no new backup runs."""
    if not _backups_enabled():
        return

    retention_days = getattr(settings, 'BACKUP_RETENTION_DAYS', 30)
    cleanup_old_backups(days=retention_days)
    logger.info('Scheduled cleanup removed backups older than %s days.', retention_days)

