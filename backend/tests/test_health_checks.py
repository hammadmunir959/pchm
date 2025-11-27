"""
Tests for health check utilities.
"""
import pytest
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.core.cache import cache

from utils.health_checks import (
    check_database,
    check_cache,
    check_celery,
    check_disk_space,
    get_health_status,
    get_readiness_status,
)


class TestHealthChecks(TestCase):
    """Test health check functions."""
    
    def test_check_database(self):
        """Test database health check."""
        result = check_database()
        assert 'status' in result
        assert result['status'] in ['healthy', 'unhealthy']
        if result['status'] == 'healthy':
            assert 'response_time_ms' in result
    
    def test_check_cache(self):
        """Test cache health check."""
        result = check_cache()
        assert 'status' in result
        assert result['status'] in ['healthy', 'unhealthy']
        if result['status'] == 'healthy':
            assert 'response_time_ms' in result
    
    @patch('utils.health_checks.current_app')
    def test_check_celery_with_workers(self, mock_app):
        """Test Celery check with active workers."""
        mock_inspect = MagicMock()
        mock_inspect.active.return_value = {'worker1': []}
        mock_app.control.inspect.return_value = mock_inspect
        
        result = check_celery()
        assert result['status'] == 'healthy'
        assert result['workers'] == 1
    
    @patch('utils.health_checks.current_app')
    def test_check_celery_no_workers(self, mock_app):
        """Test Celery check with no workers."""
        mock_inspect = MagicMock()
        mock_inspect.active.return_value = None
        mock_app.control.inspect.return_value = mock_inspect
        
        result = check_celery()
        assert result['status'] == 'degraded'
    
    def test_check_disk_space(self):
        """Test disk space check."""
        result = check_disk_space()
        assert 'status' in result
        assert result['status'] in ['healthy', 'warning', 'critical', 'unknown']
        if result['status'] != 'unknown':
            assert 'free_gb' in result
            assert 'total_gb' in result
            assert 'used_percent' in result
    
    def test_get_health_status(self):
        """Test overall health status."""
        health = get_health_status()
        assert 'status' in health
        assert 'timestamp' in health
        assert 'checks' in health
        assert 'database' in health['checks']
        assert 'cache' in health['checks']
    
    def test_get_readiness_status(self):
        """Test readiness status."""
        readiness = get_readiness_status()
        assert 'status' in readiness
        assert readiness['status'] in ['ready', 'not_ready']
        assert 'checks' in readiness

