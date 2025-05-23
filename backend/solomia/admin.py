from django.contrib import admin
from .models import AIChatMessage


@admin.register(AIChatMessage)
class AIChatMessageAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'short_message',
                    'step_progress', 'created_at')
    list_filter = ('role', 'created_at')
    search_fields = ('user__email', 'message')
    date_hierarchy = 'created_at'

    def short_message(self, obj):
        """Сокращенное сообщение для отображения в админке"""
        if len(obj.message) > 50:
            return f"{obj.message[:47]}..."
        return obj.message

    short_message.short_description = 'Сообщение'
