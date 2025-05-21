# OnboardPro

OnboardPro - платформа для автоматизации процесса онбординга новых сотрудников в организации.

## Возможности

- Создание и управление программами онбординга
- Назначение программ пользователям
- Отслеживание прогресса выполнения шагов онбординга
- Встроенная система обучения (LMS) с модулями и тестами
- Сбор обратной связи от сотрудников
- Аналитика и визуализация прогресса онбординга
- Управление пользователями с ролевой моделью
- Защищенный REST API
- Современный веб-интерфейс

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
- [Система обратной связи](KnowledgeStorage/backend_feedback.md)
- [LMS (обучающие модули)](KnowledgeStorage/backend_lms.md)
- [Аналитика онбординга](KnowledgeStorage/backend_analytics.md)

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

- **Sprint 0.7**: Добавлено аналитическое API для мониторинга прогресса онбординга
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
