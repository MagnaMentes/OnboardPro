# OnboardPro

OnboardPro - платформа для автоматизации процесса онбординга новых сотрудников в организации.

## Возможности

- Создание и управление программами онбординга
- Назначение программ пользователям
- Отслеживание прогресса выполнения шагов онбординга
- Умное планирование шагов с учётом дедлайнов и рабочих дней
- Встроенная система обучения (LMS) с модулями и тестами
- Сбор обратной связи от сотрудников с автоматической категоризацией и анализом тональности
- Система уведомлений о важных событиях и дедлайнах
- Email-уведомления о виртуальных встречах и напоминания перед встречами
- Экспорт виртуальных встреч в календарь (формат iCalendar)
- Расширенная аналитика и визуализация прогресса онбординга
- BI-аналитика с интерактивными графиками и диаграммами
- Управление пользователями с ролевой моделью
- Защищенный REST API
- Современный веб-интерфейс
- Smart Feedback Loop для автоматического анализа обратной связи
- AI Copilot (Solomia) - интеллектуальный ассистент для сотрудников
- Система геймификации с уровнями, наградами и достижениями для повышения вовлеченности
- AI-аналитика рисков провала онбординга с автоматическим выявлением тревожных трендов
- Metaverse Booking - визуальное бронирование виртуальных встреч внутри онбординга
- Клиентский AI-ассистент - ненавязчивые контекстные подсказки для сотрудников при прохождении шагов

## Структура проекта

- `backend/` - Бэкенд-часть на Django REST Framework
- `frontend/` - Фронтенд-часть на TypeScript/React/Vite
- `KnowledgeStorage/` - Документация по проекту
- `reports/` - Отчеты о спринтах и прогрессе работы

## Документация

- [Документация по бэкенду](backend/README.md)
- [Документация по фронтенду](frontend/README.md)
- [Структура пользователей](KnowledgeStorage/backend_users.md)
- [Модели онбординга](KnowledgeStorage/backend_onboarding_models.md)
- [API онбординга](KnowledgeStorage/backend_onboarding_api.md)
- [Smart Scheduler](KnowledgeStorage/backend_smart_scheduler.md)
- [Система уведомлений](KnowledgeStorage/backend_notifications.md)
- [Система обратной связи](KnowledgeStorage/backend_feedback.md)
- [LMS (обучающие модули)](KnowledgeStorage/backend_lms.md)
- [Аналитика онбординга](KnowledgeStorage/backend_analytics.md)
- [BI-аналитика (Frontend)](KnowledgeStorage/frontend_bi_analytics.md)
- [Smart Feedback Loop (Backend)](KnowledgeStorage/backend_smart_feedback.md)
- [Smart Feedback Loop (Frontend)](KnowledgeStorage/frontend_smart_feedback.md)
- [HR Alerts System](KnowledgeStorage/backend_hr_alerts.md)
- [AI Copilot (Solomia)](KnowledgeStorage/backend_ai_copilot.md)
- [AI Copilot (Frontend)](KnowledgeStorage/frontend_ai_copilot.md)
- [Solomia Chat (Backend)](KnowledgeStorage/backend_solomia_chat.md)
- [Solomia Chat (Frontend)](KnowledgeStorage/frontend_solomia_chat.md)
- [AI Insights (Backend)](KnowledgeStorage/backend_ai_insights.md)
- [AI Insights (Frontend)](KnowledgeStorage/frontend_ai_insights.md)
- [Система геймификации (Backend)](KnowledgeStorage/backend_gamification.md)
- [Система геймификации (Frontend)](KnowledgeStorage/frontend_gamification.md)
- [Metaverse Booking (Backend)](KnowledgeStorage/backend_metaverse_booking.md)
- [Metaverse Booking (Frontend)](KnowledgeStorage/frontend_metaverse_booking.md)
- [Клиентский AI-ассистент (Backend)](KnowledgeStorage/backend_client_assistant.md)
- [Клиентский AI-ассистент (Frontend)](KnowledgeStorage/frontend_client_assistant.md)

## Установка и запуск

Проект настроен для работы через Docker и Docker Compose:

```bash
# Запуск всех компонентов системы
docker-compose up -d

# Применение миграций
docker-compose exec backend python backend/manage.py migrate

# Создание администратора
docker-compose exec backend python backend/manage.py createsuperuser
```

## Последние обновления

- **Sprint 0.19**: Реализована система email-уведомлений и экспорт встреч в календарь:

  - Добавлен сервис EmailNotificationService для email-уведомлений о встречах
  - Отправка уведомлений при назначении новой встречи и напоминаний за 24 часа
  - Реализован экспорт встреч в формате .ics (iCalendar) для импорта в календарные приложения
  - Добавлена кнопка "Экспорт в календарь" и иконки календаря в карточках встреч
  - Добавлена настройка уведомлений в профиле пользователя

- **Май 2025**: Исправлены ошибки интеграции API:
  - Устранены несоответствия в URL эндпоинтов модуля геймификации
  - Исправлены ошибки формирования URL в Solomia Chat API
  - Оптимизирована работа с оповещениями и реактивное обновление данных
  - Улучшена обработка ошибок и автоматические повторные попытки соединения
  - Обновлена документация API для улучшения совместимости фронтенда и бэкенда
- **Sprint 0.18**: Реализован AI-ассистент для конечных пользователей:

  - Создана система контекстных подсказок при прохождении шагов онбординга
  - Разработан компонент ClientHintPopover для ненавязчивого отображения подсказок
  - Реализован полный набор API для работы с подсказками и их персонализацией
  - Добавлена возможность скрытия нежелательных подсказок пользователем
  - Интегрирована с системой аналитики для улучшения релевантности подсказок

- **Sprint 0.17**: Реализован MVP Metaverse Booking — визуальное бронирование встреч:

  - Расширена модель OnboardingStep для поддержки виртуальных встреч
  - Создана модель VirtualMeetingSlot для управления слотами встреч
  - Реализовано API для управления виртуальными встречами с валидацией
  - Разработаны интерфейсы для пользователей и HR/Admin
  - Добавлена система контроля пересечений встреч во времени
  - Интегрирована возможность присоединения к виртуальным встречам через ссылки

- **Sprint 0.16**: Внедрена AI-аналитика рисков провала онбординга:
  - Автоматический анализ прогресса, настроения и обратной связи сотрудников
  - Прогнозирование рисков с категоризацией (низкий, средний, высокий)
  - Детализированный анализ причин возникновения рисков
  - Визуализация в интерфейсе HR-менеджера с приоритезацией критичных случаев
  - Интеграция с существующей системой аналитики для мониторинга трендов
  - Автоматическое обновление рисков при изменениях в данных онбординга
  - Отслеживание часто задаваемых вопросов для улучшения материалов онбординга
- **Sprint 0.13**: Внедрен AI Copilot (Solomia) - интеллектуальный ассистент для сотрудников:
  - Генерация контекстуальных подсказок на основе текущего прогресса и предыдущих отзывов
  - Сервис для анализа данных о шагах и формирования релевантных рекомендаций
  - API для работы с интеллектуальными подсказками
  - Интуитивный интерфейс для отображения подсказок в процессе онбординга
  - Возможность персонализации подсказок под конкретного пользователя
- **Sprint 0.12**: Добавлена система HR Alerts для автоматического уведомления о негативной обратной связи:
  - Автоматическое создание уведомлений при негативных отзывах сотрудников
  - Мгновенные оповещения для HR и администраторов о проблемах в процессе онбординга
  - Связь уведомлений с конкретными отзывами для быстрого доступа к деталям
  - Защита от дублирования уведомлений для одного отзыва
  - Подробная информация о сотруднике, программе и шаге в тексте уведомления
- **Sprint 0.11**: Внедрен Smart Feedback Loop для автоматической обработки обратной связи:
  - Автоматический анализ тональности отзывов (sentiment analysis)
  - Автоматическая категоризация отзывов по тегам
  - Визуализация тональности с помощью эмодзи и цветовой индикации
  - Интеграция в систему аналитики для отслеживания динамики настроения сотрудников
  - Приоритизация отзывов с негативной тональностью для быстрой реакции HR
- **Sprint 0.10**: Реализована BI-аналитика на фронтенде:
  - Визуализация ключевых метрик онбординга
  - Интерактивная таблица назначений с сортировкой и фильтрацией
  - График динамики настроения сотрудников с автообновлением
  - Интеграция с существующим аналитическим API
- **Sprint 0.9**: Внедрен Smart Scheduler — система умного планирования и управления дедлайнами:
  - Автоматический расчет дедлайнов с учетом рабочих дней
  - Умное распределение шагов с учетом их важности
  - Система напоминаний и уведомлений о дедлайнах
  - Подготовка к интеграции с внешними календарями
- **Sprint 0.8**: Добавлена система уведомлений для всех событий платформы
- **Sprint 0.7**: Добавлено аналитическое API для мониторинга прогресса онбординга, включая:
  - Общую сводку по сотрудникам и их прогрессу
  - Детальную информацию по каждому назначению
  - Аналитику настроения пользователей по дням
- **Sprint 0.6**: Добавлена система LMS для обучающих шагов онбординга
- **Sprint 0.5**: Реализована система обратной связи
- **Sprint 0.4**: Разработано ядро системы онбординга
- **Sprint 0.3**: Добавлена система аутентификации и ролей
- **Sprint 0.2**: Создана архитектура фронтенда
- **Sprint 0.1**: Разработана архитектура бэкенда

Подробные отчеты о каждом спринте доступны в директории [`reports/`](reports/).

## Доступ к системе

- Frontend: [http://localhost:80](http://localhost:80)
- Backend API: [http://localhost:8000/api/](http://localhost:8000/api/)
- API документация: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
- Административная панель: [http://localhost:8000/admin/](http://localhost:8000/admin/)

## Статус проекта

Проект активно разрабатывается. Последнее обновление: 23 мая 2025 г.

## Команда разработки

Проект разрабатывается с помощью GitHub Copilot и энтузиазма команды разработчиков.
