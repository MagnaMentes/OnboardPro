"""
Кастомный ViewSet для работы с уведомлениями, который исправляет проблемы с настройками DRF
"""
from rest_framework import viewsets
from rest_framework.settings import api_settings


class SafeModelViewSet(viewsets.ModelViewSet):
    """
    Кастомный ViewSet, который безопасно работает с настройками DRF
    """
    
    def get_format_suffix(self, **kwargs):
        """
        Безопасно получает формат суффикса
        """
        format_kwarg = kwargs.get(api_settings.FORMAT_SUFFIX_KWARG, None)
        if format_kwarg:
            return format_kwarg
        return None
    
    def get_exception_handler(self):
        """
        Безопасно получает обработчик исключений
        """
        from rest_framework.views import exception_handler
        return exception_handler
