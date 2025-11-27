"""
Bulk operations utilities for efficient batch processing.
"""
from typing import List, TypeVar, Type, Any, Dict, Optional
from django.db import models, transaction
from django.db.models import QuerySet

ModelType = TypeVar('ModelType', bound=models.Model)


class BulkOperationError(Exception):
    """Exception raised during bulk operations."""
    pass


def bulk_create_optimized(
    model: Type[ModelType],
    objects: List[ModelType],
    batch_size: int = 100,
    ignore_conflicts: bool = False
) -> List[ModelType]:
    """
    Optimized bulk create with batching.
    
    Args:
        model: Django model class
        objects: List of model instances to create
        batch_size: Number of objects to create per batch
        ignore_conflicts: Whether to ignore conflicts
    
    Returns:
        List of created objects
    """
    if not objects:
        return []
    
    created_objects = []
    
    with transaction.atomic():
        for i in range(0, len(objects), batch_size):
            batch = objects[i:i + batch_size]
            if ignore_conflicts:
                created = model.objects.bulk_create(
                    batch,
                    batch_size=batch_size,
                    ignore_conflicts=True
                )
            else:
                created = model.objects.bulk_create(
                    batch,
                    batch_size=batch_size
                )
            created_objects.extend(created)
    
    return created_objects


def bulk_update_optimized(
    objects: List[ModelType],
    fields: List[str],
    batch_size: int = 100
) -> int:
    """
    Optimized bulk update with batching.
    
    Args:
        objects: List of model instances to update
        fields: List of field names to update
        batch_size: Number of objects to update per batch
    
    Returns:
        Number of updated objects
    """
    if not objects:
        return 0
    
    updated_count = 0
    
    with transaction.atomic():
        for i in range(0, len(objects), batch_size):
            batch = objects[i:i + batch_size]
            updated = models.Model.objects.bulk_update(
                batch,
                fields,
                batch_size=batch_size
            )
            updated_count += len(batch)
    
    return updated_count


def bulk_delete_optimized(
    queryset: QuerySet[ModelType],
    batch_size: int = 100
) -> int:
    """
    Optimized bulk delete with batching.
    
    Args:
        queryset: QuerySet to delete
        batch_size: Number of objects to delete per batch
    
    Returns:
        Number of deleted objects
    """
    count = queryset.count()
    if count == 0:
        return 0
    
    deleted_count = 0
    
    with transaction.atomic():
        while True:
            batch_ids = list(queryset.values_list('pk', flat=True)[:batch_size])
            if not batch_ids:
                break
            
            deleted, _ = queryset.filter(pk__in=batch_ids).delete()
            deleted_count += deleted
    
    return deleted_count


def bulk_update_fields(
    queryset: QuerySet[ModelType],
    updates: Dict[str, Any],
    batch_size: int = 100
) -> int:
    """
    Bulk update fields for a queryset.
    
    Args:
        queryset: QuerySet to update
        updates: Dictionary of field: value pairs
        batch_size: Number of objects to update per batch
    
    Returns:
        Number of updated objects
    """
    count = queryset.count()
    if count == 0:
        return 0
    
    updated_count = 0
    
    with transaction.atomic():
        for i in range(0, count, batch_size):
            batch = queryset[i:i + batch_size]
            for obj in batch:
                for field, value in updates.items():
                    setattr(obj, field, value)
            
            model = queryset.model
            model.objects.bulk_update(batch, list(updates.keys()), batch_size=batch_size)
            updated_count += len(batch)
    
    return updated_count

