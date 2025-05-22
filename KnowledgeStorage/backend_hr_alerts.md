# HR Alerts System

## Обзор

Система HR Alerts предназначена для автоматического уведомления HR-менеджеров и администраторов о негативных отзывах сотрудников. При обнаружении негативной обратной связи система автоматически создает уведомления для всех пользователей с ролями HR и Admin, связанных с данным назначением.

## Критерии срабатывания уведомлений

Уведомления создаются в следующих случаях:

1. При создании `StepFeedback` с `auto_tag` одним из:
   - "negative" (негативный)
   - "delay_warning" (предупреждение о задержке)
   - "unclear_instruction" (неясная инструкция)
2. ИЛИ когда `sentiment_score` < -0.3 (определяется как негативный тон)

## Компоненты реализации

### Модель Notification с расширением для content_object

```python
# в notifications/models.py
class Notification(models.Model):
    # Существующие поля...

    # Связь с другими моделями через ContentType
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name=_('content type')
    )
    object_id = models.PositiveIntegerField(null=True, blank=True, verbose_name=_('object id'))
    content_object = GenericForeignKey('content_type', 'object_id')
```

### Расширение NotificationService

```python
@staticmethod
def send_notification(recipient, title, message, notification_type=NotificationType.INFO, content_object=None):
    """
    Создает и сохраняет новое уведомление

    Args:
        recipient: Пользователь-получатель уведомления
        title: Заголовок уведомления
        message: Текст уведомления
        notification_type: Тип уведомления из NotificationType
        content_object: Связанный объект (например, StepFeedback)

    Returns:
        Notification: Созданное уведомление
    """
    notification = Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type
    )

    # Если передан связанный объект, добавляем связь
    if content_object:
        notification.content_object = content_object
        notification.save()

    return notification

@staticmethod
def get_notifications_by_content_object(content_type, object_id):
    """
    Возвращает уведомления, связанные с указанным объектом
    """
    return Notification.objects.filter(
        content_type=content_type,
        object_id=object_id
    )
```

### SmartFeedbackService с методом notify_hr_on_negative_feedback

```python
@staticmethod
def notify_hr_on_negative_feedback(step_feedback):
    """
    Уведомляет HR и Admin пользователей о негативной обратной связи

    Args:
        step_feedback: Объект StepFeedback с негативным отзывом

    Returns:
        list: Список созданных уведомлений
    """
    # Проверяем, соответствует ли фидбэк критериям для уведомления
    if (step_feedback.auto_tag in ['negative', 'delay_warning', 'unclear_instruction'] or
            (step_feedback.sentiment_score is not None and step_feedback.sentiment_score < -0.3)):

        # Получаем информацию о программе и пользователе
        user_full_name = step_feedback.user.get_full_name()
        step_name = step_feedback.step.name
        program_name = step_feedback.assignment.program.name

        # Формируем сообщение
        title = "Негативный отзыв от сотрудника"
        message = f"Сотрудник {user_full_name} оставил негативный отзыв по шагу '{step_name}' в программе '{program_name}'"

        # Получаем всех HR и Admin пользователей
        hr_admin_users = User.objects.filter(role__in=[UserRole.HR, UserRole.ADMIN])

        notifications = []

        # Проверяем, не было ли уже создано уведомление для этого фидбэка
        content_type = ContentType.objects.get_for_model(step_feedback)
        existing_notifications = list(NotificationService.get_notifications_by_content_object(
            content_type=content_type,
            object_id=step_feedback.id
        ))

        # Если уведомления уже есть, возвращаем их
        if existing_notifications:
            return existing_notifications

        # Создаем уведомления для каждого HR и Admin
        for user in hr_admin_users:
            notification = NotificationService.send_notification(
                recipient=user,
                title=title,
                message=message,
                notification_type=NotificationType.WARNING,
                content_object=step_feedback
            )
            notifications.append(notification)

        return notifications

    return []
```

### Вызов метода при создании фидбэка

```python
# В StepFeedbackCreateView.perform_create
def perform_create(self, serializer):
    # ... существующий код ...
    step_feedback = serializer.save(
        user=self.request.user,
        auto_tag=auto_tag,
        sentiment_score=sentiment_score
    )

    # Вызываем метод для создания уведомлений HR и Admin о негативном отзыве
    SmartFeedbackService.notify_hr_on_negative_feedback(step_feedback)
```

## Форматы уведомлений

### Заголовок уведомления

"Негативный отзыв от сотрудника"

### Текст уведомления

"Сотрудник {full_name} оставил негативный отзыв по шагу '{step_name}' в программе '{program_name}'"

### Тип уведомления

`warning` (предупреждение)

## Тестирование системы

Для тестирования реализованы юнит-тесты, которые проверяют:

1. Создание уведомлений при негативном отзыве
2. Отсутствие уведомлений при нейтральном отзыве
3. Создание уведомлений только один раз для одного отзыва

## Миграции базы данных

Для поддержки нового функционала созданы миграции, добавляющие поля `content_type` и `object_id` к модели `Notification`.
