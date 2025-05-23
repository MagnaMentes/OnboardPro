from django.contrib import admin
from .models import UserLevel, UserReward


@admin.register(UserLevel)
class UserLevelAdmin(admin.ModelAdmin):
    list_display = ('user', 'level', 'points', 'updated_at')
    list_filter = ('level',)
    search_fields = ('user__email',)
    raw_id_fields = ('user',)


@admin.register(UserReward)
class UserRewardAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'reward_type', 'icon', 'achievement_id')
    list_filter = ('reward_type',)
    search_fields = ('user__email', 'title', 'achievement_id')
    raw_id_fields = ('user',)
