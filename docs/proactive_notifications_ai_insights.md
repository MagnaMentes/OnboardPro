# Проактивные уведомления о критических инсайтах

## Обзор

Система проактивных уведомлений — необходимое расширение функциональности Smart Insights Hub, позволяющее оперативно информировать пользователей о критически важных инсайтах, требующих внимания и действий. Уведомления будут интегрированы с существующей системой нотификаций OnboardPro, но будут иметь специфические настройки для инсайтов высокого приоритета.

## Архитектура системы уведомлений

### 1. Типы уведомлений

- **Мгновенные уведомления** — отправляются немедленно при обнаружении критического инсайта
- **Сводные уведомления** — отправляются по расписанию, содержат сводку важных инсайтов
- **Эскалационные уведомления** — отправляются при отсутствии реакции на критические инсайты

### 2. Каналы доставки

- Внутрисистемные уведомления (в интерфейсе OnboardPro)
- Email-уведомления
- Уведомления в мессенджеры (опционально: Slack, MS Teams)
- Push-уведомления в мобильном приложении (для будущей реализации)

### 3. Целевая аудитория

- HR-специалисты
- Руководители отделов
- Менторы
- Сами сотрудники (для некоторых типов инсайтов)

## Технические компоненты

### 1. Расширение моделей

Дополним существующую модель инсайтов полями для настройки уведомлений:

```python
class AIInsight(models.Model):
    # Существующие поля...

    # Поля для уведомлений
    require_notification = models.BooleanField(default=False)
    notification_sent = models.BooleanField(default=False)
    notification_sent_at = models.DateTimeField(null=True, blank=True)
    notification_level = models.CharField(
        max_length=20,
        choices=[
            ('instant', 'Мгновенное'),
            ('daily', 'Ежедневное'),
            ('weekly', 'Еженедельное')
        ],
        default='instant'
    )
```

### 2. Сервис отправки уведомлений

Создадим специализированный сервис для отправки уведомлений о критических инсайтах:

```python
# backend/ai_insights/services/notification_service.py

from django.conf import settings
from django.utils import timezone
from notifications.signals import notify
from core.email_sender import send_email_notification
from ..models import AIInsight, InsightLevel

class InsightNotificationService:
    @staticmethod
    def send_insight_notification(insight):
        """
        Отправляет уведомление о критическом инсайте соответствующим пользователям
        """
        if not insight.require_notification:
            return

        recipients = InsightNotificationService._get_recipients(insight)

        # Отправляем внутрисистемные уведомления
        for recipient in recipients:
            notify.send(
                sender=insight,
                recipient=recipient,
                verb='требует внимания',
                target=insight,
                level='critical' if insight.level == InsightLevel.CRITICAL else 'warning',
                description=f'Инсайт "{insight.title}" требует вашего внимания.',
                action_url=f'/admin/ai/insights/{insight.id}'
            )

        # Отправляем email уведомления для критических инсайтов
        if insight.level == InsightLevel.CRITICAL:
            for recipient in recipients:
                send_email_notification(
                    recipient_email=recipient.email,
                    subject=f'[КРИТИЧНО] Обнаружен критический инсайт: {insight.title}',
                    template='emails/critical_insight_notification.html',
                    context={
                        'recipient_name': recipient.get_full_name(),
                        'insight': insight,
                        'action_url': f'{settings.FRONTEND_URL}/admin/ai/insights/{insight.id}'
                    }
                )

        # Обновляем статус отправки уведомления
        insight.notification_sent = True
        insight.notification_sent_at = timezone.now()
        insight.save(update_fields=['notification_sent', 'notification_sent_at'])

    @staticmethod
    def _get_recipients(insight):
        """
        Определяет получателей уведомления на основе инсайта
        """
        recipients = set()

        # HR и администраторы всегда получают уведомления о критических инсайтах
        if insight.level == InsightLevel.CRITICAL:
            from users.models import User
            recipients.update(User.objects.filter(role__in=['hr', 'admin']))

        # Добавляем руководителя отдела
        if insight.department and insight.department.manager:
            recipients.add(insight.department.manager)

        # Если это инсайт о пользователе, добавляем его ментора
        if insight.user and hasattr(insight.user, 'mentor') and insight.user.mentor:
            recipients.add(insight.user.mentor)

        # Для некоторых типов инсайтов сам пользователь может быть получателем
        if insight.user and insight.insight_type in ['feedback', 'training']:
            recipients.add(insight.user)

        return list(recipients)
```

### 3. Интеграция с фоновыми задачами

Используем Celery для обработки отправки уведомлений:

```python
# backend/ai_insights/tasks.py

from celery import shared_task
from .services.notification_service import InsightNotificationService
from .models import AIInsight, InsightLevel

@shared_task
def send_critical_insight_notification(insight_id):
    """
    Отправляет уведомление о критическом инсайте
    """
    try:
        insight = AIInsight.objects.get(id=insight_id)
        InsightNotificationService.send_insight_notification(insight)
        return f"Notification sent for insight {insight_id}"
    except AIInsight.DoesNotExist:
        return f"Insight {insight_id} not found"

@shared_task
def send_daily_insight_summary():
    """
    Отправляет ежедневную сводку важных инсайтов
    """
    # Находим все важные инсайты за последние 24 часа
    from django.utils import timezone
    from datetime import timedelta

    yesterday = timezone.now() - timedelta(days=1)
    insights = AIInsight.objects.filter(
        created_at__gte=yesterday,
        level__in=[InsightLevel.CRITICAL, InsightLevel.HIGH],
        notification_level='daily'
    )

    # Группируем инсайты по получателям
    recipient_insights = {}

    for insight in insights:
        recipients = InsightNotificationService._get_recipients(insight)
        for recipient in recipients:
            if recipient.id not in recipient_insights:
                recipient_insights[recipient.id] = {
                    'recipient': recipient,
                    'insights': []
                }
            recipient_insights[recipient.id]['insights'].append(insight)

    # Отправляем сводные уведомления
    from core.email_sender import send_email_notification

    for recipient_data in recipient_insights.values():
        recipient = recipient_data['recipient']
        insights_list = recipient_data['insights']

        if insights_list:
            send_email_notification(
                recipient_email=recipient.email,
                subject='Ежедневная сводка важных инсайтов',
                template='emails/daily_insights_summary.html',
                context={
                    'recipient_name': recipient.get_full_name(),
                    'insights': insights_list,
                    'insights_count': len(insights_list),
                    'critical_count': sum(1 for i in insights_list if i.level == InsightLevel.CRITICAL),
                    'high_count': sum(1 for i in insights_list if i.level == InsightLevel.HIGH),
                    'action_url': f'{settings.FRONTEND_URL}/admin/ai/hub'
                }
            )

    return f"Daily summaries sent, {len(recipient_insights)} recipients"
```

### 4. Расписание задач

Настроим планировщик задач Celery Beat:

```python
# backend/config/celery.py

from celery.schedules import crontab

app.conf.beat_schedule = {
    # ... другие задачи ...

    # Отправка ежедневных сводок инсайтов в 9:00 утра
    'send-daily-insight-summary': {
        'task': 'ai_insights.tasks.send_daily_insight_summary',
        'schedule': crontab(hour=9, minute=0),
    },

    # Отправка еженедельных сводок инсайтов в понедельник в 9:30 утра
    'send-weekly-insight-summary': {
        'task': 'ai_insights.tasks.send_weekly_insight_summary',
        'schedule': crontab(hour=9, minute=30, day_of_week=1),
    },

    # Проверка просроченных критических инсайтов каждые 12 часов
    'check-overdue-critical-insights': {
        'task': 'ai_insights.tasks.check_overdue_critical_insights',
        'schedule': crontab(hour='*/12', minute=0),
    },
}
```

### 5. Автоматическое включение уведомлений

Добавим логику для автоматического включения уведомлений при создании критических инсайтов:

```python
# backend/ai_insights/models.py

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=AIInsight)
def setup_insight_notifications(sender, instance, created, **kwargs):
    """
    Автоматически настраивает уведомления для новых критических инсайтов
    """
    if created and instance.level in [InsightLevel.CRITICAL, InsightLevel.HIGH]:
        # Включаем уведомления для важных инсайтов
        if not instance.require_notification:
            instance.require_notification = True

            # Критические инсайты требуют мгновенных уведомлений
            if instance.level == InsightLevel.CRITICAL:
                instance.notification_level = 'instant'
            # Высокоприоритетные инсайты включаются в ежедневные сводки
            else:
                instance.notification_level = 'daily'

            instance.save(update_fields=['require_notification', 'notification_level'])

            # Отправляем мгновенное уведомление для критических инсайтов
            if instance.level == InsightLevel.CRITICAL:
                from .tasks import send_critical_insight_notification
                send_critical_insight_notification.delay(instance.id)
```

## Frontend-компоненты

### 1. Индикаторы уведомлений

Добавим компонент для отображения счетчика непрочитанных уведомлений в шапке приложения:

```tsx
// frontend/src/components/layout/NotificationIndicator.tsx

import { useEffect, useState } from "react";
import { Badge, IconButton, Box, useColorModeValue } from "@chakra-ui/react";
import { FiBell } from "react-icons/fi";
import { getUnreadNotificationsCount } from "../../services/notifications";

export const NotificationIndicator = () => {
  const [count, setCount] = useState(0);

  const fetchNotificationsCount = async () => {
    try {
      const count = await getUnreadNotificationsCount();
      setCount(count);
    } catch (error) {
      console.error("Error fetching notifications count:", error);
    }
  };

  useEffect(() => {
    fetchNotificationsCount();

    // Обновляем счетчик каждую минуту
    const interval = setInterval(fetchNotificationsCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box position="relative" display="inline-block">
      <IconButton
        aria-label="Уведомления"
        icon={<FiBell />}
        variant="ghost"
        size="md"
      />
      {count > 0 && (
        <Badge
          position="absolute"
          top="-2px"
          right="-2px"
          colorScheme="red"
          borderRadius="full"
          minW="1.5rem"
          fontSize="xs"
        >
          {count > 99 ? "99+" : count}
        </Badge>
      )}
    </Box>
  );
};
```

### 2. Всплывающие уведомления

Создадим систему всплывающих уведомлений для критических инсайтов:

```tsx
// frontend/src/components/AIInsights/CriticalInsightToast.tsx

import { useEffect } from "react";
import { Box, HStack, VStack, Text, Icon, CloseButton } from "@chakra-ui/react";
import { FiAlertCircle } from "react-icons/fi";
import { useHistory } from "react-router-dom";
import toast from "react-hot-toast";

interface CriticalInsightToastProps {
  id: number;
  title: string;
  onClose: () => void;
}

export const CriticalInsightToast = ({
  id,
  title,
  onClose,
}: CriticalInsightToastProps) => {
  const history = useHistory();

  const handleClick = () => {
    history.push(`/admin/ai/insights/${id}`);
    onClose();
  };

  return (
    <Box
      bg="red.100"
      color="red.800"
      p={3}
      borderRadius="md"
      borderLeft="4px solid"
      borderColor="red.500"
      cursor="pointer"
      onClick={handleClick}
      _hover={{ bg: "red.50" }}
      maxW="350px"
    >
      <HStack justify="space-between" align="start">
        <HStack align="start" spacing={3}>
          <Icon as={FiAlertCircle} w={5} h={5} color="red.500" mt={0.5} />
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold" fontSize="sm">
              Критический инсайт
            </Text>
            <Text fontSize="sm">{title}</Text>
          </VStack>
        </HStack>
        <CloseButton
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        />
      </HStack>
    </Box>
  );
};

// Функция для вызова всплывающего уведомления
export const showCriticalInsightToast = (insight: {
  id: number;
  title: string;
}) => {
  return toast.custom(
    (t) => (
      <CriticalInsightToast
        id={insight.id}
        title={insight.title}
        onClose={() => toast.dismiss(t.id)}
      />
    ),
    {
      duration: 10000, // 10 секунд
      position: "top-right",
    }
  );
};
```

### 3. Интеграция с WebSockets для мгновенных уведомлений

Настроим WebSocket-соединение для получения уведомлений в реальном времени:

```tsx
// frontend/src/services/webSocketService.ts

import { showCriticalInsightToast } from "../components/AIInsights/CriticalInsightToast";

export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(private token: string) {}

  connect() {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = new WebSocket(
      `${process.env.REACT_APP_WS_URL}/ws/notifications/?token=${this.token}`
    );

    this.socket.onopen = () => {
      console.log("WebSocket connection established");
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.socket.onclose = (event) => {
      if (!event.wasClean) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.disconnect();
      this.attemptReconnect();
    };
  }

  private handleMessage(data: any) {
    // Обрабатываем разные типы сообщений
    switch (data.type) {
      case "critical_insight":
        showCriticalInsightToast({
          id: data.insight_id,
          title: data.insight_title,
        });
        break;

      case "notification_update":
        // Обновляем счетчик уведомлений через событие
        const event = new CustomEvent("notifications_update", {
          detail: data.count,
        });
        window.dispatchEvent(event);
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Attempting to reconnect in ${timeout / 1000} seconds...`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, timeout);
  }
}

// Экспортируем синглтон для использования в приложении
export const webSocketService = new WebSocketService("");

// Функция для обновления токена (вызывается после логина)
export const updateWebSocketToken = (token: string) => {
  webSocketService.disconnect();
  // @ts-ignore
  webSocketService.token = token;
  webSocketService.connect();
};
```

## Дизайн email-шаблонов

### 1. Шаблон для критического инсайта

```html
<!-- backend/templates/emails/critical_insight_notification.html -->
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        width: 600px;
        margin: 0 auto;
      }
      .header {
        background-color: #e53e3e;
        color: white;
        padding: 20px;
        text-align: center;
      }
      .content {
        padding: 20px;
      }
      .insight-card {
        border-left: 4px solid #e53e3e;
        background-color: #fff5f5;
        padding: 15px;
        margin-bottom: 20px;
      }
      .button {
        display: inline-block;
        background-color: #3182ce;
        color: white;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Критический инсайт требует внимания</h1>
      </div>
      <div class="content">
        <p>Здравствуйте, {{ recipient_name }}!</p>

        <p>Обнаружен критический инсайт, который требует вашего внимания:</p>

        <div class="insight-card">
          <h2>{{ insight.title }}</h2>
          <p>{{ insight.description }}</p>
          <p><strong>Уровень:</strong> {{ insight.level_display }}</p>
          <p><strong>Тип:</strong> {{ insight.insight_type_display }}</p>
          <p>
            <strong>Обнаружено:</strong> {{ insight.created_at|date:"d.m.Y H:i"
            }}
          </p>
        </div>

        <p>
          Пожалуйста, ознакомьтесь с деталями и примите необходимые меры как
          можно скорее.
        </p>

        <p>
          <a href="{{ action_url }}" class="button">Просмотреть инсайт</a>
        </p>

        <p>
          С уважением,<br />
          Система Smart Insights Hub
        </p>
      </div>
    </div>
  </body>
</html>
```

### 2. Шаблон для ежедневной сводки

```html
<!-- backend/templates/emails/daily_insights_summary.html -->
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        width: 600px;
        margin: 0 auto;
      }
      .header {
        background-color: #3182ce;
        color: white;
        padding: 20px;
        text-align: center;
      }
      .content {
        padding: 20px;
      }
      .stats {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      .stat-box {
        flex: 1;
        padding: 15px;
        text-align: center;
        border-radius: 4px;
        margin: 0 5px;
      }
      .critical {
        background-color: #fff5f5;
        color: #e53e3e;
      }
      .high {
        background-color: #feebc8;
        color: #dd6b20;
      }
      .total {
        background-color: #e6fffa;
        color: #319795;
      }
      .insight-list {
        margin: 20px 0;
      }
      .insight-item {
        padding: 10px;
        border-left: 4px solid;
        margin-bottom: 10px;
      }
      .critical-item {
        border-color: #e53e3e;
        background-color: #fff5f5;
      }
      .high-item {
        border-color: #dd6b20;
        background-color: #feebc8;
      }
      .button {
        display: inline-block;
        background-color: #3182ce;
        color: white;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Ежедневная сводка инсайтов</h1>
      </div>
      <div class="content">
        <p>Здравствуйте, {{ recipient_name }}!</p>

        <p>
          За последние 24 часа в системе было обнаружено {{ insights_count }}
          важных инсайтов, которые могут требовать вашего внимания.
        </p>

        <div class="stats">
          <div class="stat-box critical">
            <h3>Критические</h3>
            <h2>{{ critical_count }}</h2>
          </div>
          <div class="stat-box high">
            <h3>Высокий приоритет</h3>
            <h2>{{ high_count }}</h2>
          </div>
          <div class="stat-box total">
            <h3>Всего</h3>
            <h2>{{ insights_count }}</h2>
          </div>
        </div>

        <div class="insight-list">
          <h3>Список инсайтов:</h3>
          {% for insight in insights %}
          <div
            class="insight-item {% if insight.level == 'critical' %}critical-item{% else %}high-item{% endif %}"
          >
            <h4>{{ insight.title }}</h4>
            <p>{{ insight.description|truncatewords:30 }}</p>
            <p><strong>Уровень:</strong> {{ insight.level_display }}</p>
            <p><strong>Тип:</strong> {{ insight.insight_type_display }}</p>
            <p>
              <a
                href="{{ settings.FRONTEND_URL }}/admin/ai/insights/{{ insight.id }}"
                >Просмотреть детали</a
              >
            </p>
          </div>
          {% endfor %}
        </div>

        <p>
          <a href="{{ action_url }}" class="button"
            >Открыть Smart Insights Hub</a
          >
        </p>

        <p>
          С уважением,<br />
          Система Smart Insights Hub
        </p>
      </div>
    </div>
  </body>
</html>
```

## План внедрения

1. **Разработка Backend**:

   - Расширение модели инсайтов полями для уведомлений
   - Создание сервиса отправки уведомлений
   - Настройка Celery задач для отправки уведомлений
   - Разработка Django сигналов для автоматической обработки критических инсайтов
   - Создание шаблонов email-уведомлений

2. **Разработка Frontend**:

   - Создание компонента индикатора уведомлений
   - Реализация всплывающих уведомлений
   - Настройка WebSocket-соединения для получения уведомлений в реальном времени

3. **Тестирование**:

   - Ручное тестирование функциональности
   - Написание unit-тестов для backend
   - Написание интеграционных тестов для проверки отправки уведомлений

4. **Документация**:
   - Обновление технической документации
   - Создание руководства пользователя по работе с уведомлениями
   - Обновление API-документации
