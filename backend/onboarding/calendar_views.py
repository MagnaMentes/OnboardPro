from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ics import Calendar, Event
from django.http import HttpResponse
from django.utils import timezone
from onboarding.models import VirtualMeetingSlot
import pytz
import uuid
from datetime import datetime


class MeetingCalendarExportView(APIView):
    """
    Представление для экспорта встреч пользователя в формате iCalendar (.ics)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Экспортирует все встречи текущего пользователя в формате .ics (iCalendar)
        """
        user = request.user

        # Получаем все встречи пользователя
        meetings = VirtualMeetingSlot.objects.filter(
            assigned_user=user).order_by('start_time')

        if not meetings:
            # Если нет встреч, возвращаем пустой календарь
            return HttpResponse(
                str(Calendar()),
                content_type="text/calendar",
                headers={
                    "Content-Disposition": "attachment; filename=onboardpro_meetings.ics"}
            )

        # Создаем календарь
        calendar = Calendar()
        calendar.creator = f"OnboardPro - {user.email}"

        # Добавляем каждую встречу как событие календаря
        for meeting in meetings:
            event = Event()
            event.name = f"{meeting.step.name}"
            event.begin = meeting.start_time
            event.end = meeting.end_time

            # Устанавливаем описание события
            event.description = f"Встреча в рамках программы онбординга: {meeting.step.program.name}"

            # Добавляем информацию об организаторе
            event.organizer = "OnboardPro Team"

            # Если есть ссылка на встречу, добавляем URL
            if meeting.meeting_link:
                event.url = meeting.meeting_link

            # Генерируем уникальный идентификатор события
            event.uid = str(uuid.uuid4())

            # Добавляем событие в календарь
            calendar.events.add(event)

        # Возвращаем ответ с календарем и правильным типом содержимого
        response = HttpResponse(
            str(calendar),
            content_type="text/calendar",
        )
        response['Content-Disposition'] = 'attachment; filename=onboardpro_meetings.ics'

        return response
