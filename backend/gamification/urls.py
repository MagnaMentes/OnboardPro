from django.urls import path
from .views import GamificationProfileView, GamificationAchievementsView, TrackEventView

urlpatterns = [
    # Профиль геймификации пользователя
    path("gamification/profile/", GamificationProfileView.as_view(),
         name="gamification-profile"),

    # Список достижений
    path("gamification/achievements/",
         GamificationAchievementsView.as_view(), name="gamification-achievements"),

    # Трекинг событий
    path("gamification/events/", TrackEventView.as_view(),
         name="gamification-events"),
]
