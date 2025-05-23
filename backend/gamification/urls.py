from django.urls import path
from .views import GamificationProfileView, GamificationAchievementsView, TrackEventView

urlpatterns = [
    # Профиль геймификации пользователя
    path("api/gamification/profile/", GamificationProfileView.as_view(),
         name="gamification-profile"),

    # Список достижений
    path("api/gamification/achievements/",
         GamificationAchievementsView.as_view(), name="gamification-achievements"),

    # Трекинг событий
    path("api/gamification/events/", TrackEventView.as_view(),
         name="gamification-events"),
]
