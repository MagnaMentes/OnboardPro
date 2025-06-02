# Добавляем отладочный middleware для вывода ответов API
from django.utils.deprecation import MiddlewareMixin
import json
import logging

logger = logging.getLogger('django.request')

class ResponseDebugMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if 'dashboard-data' in request.path and hasattr(response, 'content'):
            try:
                content = response.content.decode('utf-8')
                data = json.loads(content)
                logger.error(f"API RESPONSE DEBUG: {json.dumps(data, indent=2)}")
            except Exception as e:
                logger.error(f"Failed to log response: {str(e)}")
        return response
