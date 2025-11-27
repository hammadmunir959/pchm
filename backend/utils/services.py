"""
Service layer pattern implementation.
Base service classes for business logic separation.
"""
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar

from django.db import models

ModelType = TypeVar('ModelType', bound=models.Model)


class BaseService(Generic[ModelType]):
    """
    Base service class for business logic operations.
    
    This class provides a foundation for implementing service layer pattern,
    separating business logic from views and models.
    """
    
    def __init__(self, model: Type[ModelType]):
        """
        Initialize service with model class.
        
        Args:
            model: Django model class
        """
        self.model = model
    
    def get_by_id(self, pk: int) -> Optional[ModelType]:
        """
        Get object by primary key.
        
        Args:
            pk: Primary key
        
        Returns:
            Model instance or None
        """
        try:
            return self.model.objects.get(pk=pk)
        except self.model.DoesNotExist:
            return None
    
    def get_all(self, **filters: Any) -> List[ModelType]:
        """
        Get all objects matching filters.
        
        Args:
            **filters: Filter parameters
        
        Returns:
            List of model instances
        """
        return list(self.model.objects.filter(**filters))
    
    def create(self, **data: Any) -> ModelType:
        """
        Create new object.
        
        Args:
            **data: Object data
        
        Returns:
            Created model instance
        """
        return self.model.objects.create(**data)
    
    def update(self, instance: ModelType, **data: Any) -> ModelType:
        """
        Update existing object.
        
        Args:
            instance: Model instance to update
            **data: Update data
        
        Returns:
            Updated model instance
        """
        for key, value in data.items():
            setattr(instance, key, value)
        instance.save()
        return instance
    
    def delete(self, instance: ModelType) -> None:
        """
        Delete object.
        
        Args:
            instance: Model instance to delete
        """
        instance.delete()
    
    def exists(self, **filters: Any) -> bool:
        """
        Check if object exists.
        
        Args:
            **filters: Filter parameters
        
        Returns:
            True if exists, False otherwise
        """
        return self.model.objects.filter(**filters).exists()


class UserService(BaseService):
    """
    Service for user-related business logic.
    """
    
    def __init__(self):
        """Initialize user service."""
        from accounts.models import User
        super().__init__(User)
        self.User = User
    
    def get_active_admins(self) -> List[Any]:
        """
        Get all active admin users.
        
        Returns:
            List of active admin users
        """
        return self.get_all(
            admin_type__in=[self.User.ROLE_ADMIN, self.User.ROLE_SUPER_ADMIN],
            status=self.User.STATUS_ACTIVE,
            is_email_verified=True
        )
    
    def get_pending_admins(self) -> List[Any]:
        """
        Get all pending admin users.
        
        Returns:
            List of pending admin users
        """
        return self.get_all(
            admin_type=self.User.ROLE_ADMIN,
            status=self.User.STATUS_PENDING,
            is_email_verified=True
        )
    
    def activate_admin(self, user: Any) -> Any:
        """
        Activate an admin user.
        
        Args:
            user: User to activate
        
        Returns:
            Updated user instance
        """
        return self.update(user, status=self.User.STATUS_ACTIVE)
    
    def suspend_user(self, user: Any) -> Any:
        """
        Suspend a user.
        
        Args:
            user: User to suspend
        
        Returns:
            Updated user instance
        """
        return self.update(user, status=self.User.STATUS_SUSPENDED)

