# OnboardPro

OnboardPro - платформа для автоматизации процесса онбординга новых сотрудников в организации.

## Возможности

- Создание и управление программами онбординга
- Назначение программ пользователям
- Отслеживание прогресса выполнения шагов онбординга
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

## Доступ к системе

- Frontend: http://localhost:80
- Backend API: http://localhost:8000/api/
- API документация: http://localhost:8000/api/docs/
- Административная панель: http://localhost:8000/admin/
