# OnboardPro

OnboardPro — современное веб-приложение, разработанное для автоматизации и оптимизации процесса онбординга сотрудников. Оно предоставляет комплексную платформу для HR-менеджеров, позволяющую создавать и управлять планами онбординга, а сотрудникам — отслеживать свой прогресс в выполнении различных задач онбординга.

## Возможности

- **Управление пользователями**
  - Контроль доступа на основе ролей (Сотрудник, Менеджер, HR)
  - Безопасная аутентификация с использованием JWT
  - Управление профилями пользователей

- **Планы онбординга**
  - Создание и управление шаблонами онбординга
  - Назначение задач для конкретных ролей
  - Отслеживание прогресса выполнения
  - Установка сроков и приоритетов

- **Управление задачами**
  - Создание и назначение задач
  - Отслеживание статуса задач
  - Установка сроков и напоминаний
  - Мониторинг прогресса

- **Современный интерфейс**
  - Адаптивный дизайн
  - Интуитивная навигация
  - Обновления в реальном времени
  - Компоненты Material Design

## Технологический стек

### Backend
- Django 4.2
- Django REST Framework
- PostgreSQL
- JWT Аутентификация
- Celery
- Redis

### Frontend
- React 18
- Material-UI
- Redux Toolkit
- React Router
- Axios

## Предварительные требования

- Python 3.11+
- Node.js 18+
- Docker и Docker Compose
- PostgreSQL 15+

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/onboardpro.git
cd onboardpro
```

2. Настройка backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # На Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

3. Настройка frontend:
```bash
cd frontend
npm install
```

4. Настройка переменных окружения:
   - Скопируйте `.env.example` в `.env` в обоих директориях (backend и frontend)
   - Обновите переменные в соответствии с вашей конфигурацией

## Разработка

### Запуск с использованием Docker

1. Сборка и запуск контейнеров:
```bash
docker-compose up --build
```

2. Доступ к приложению:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Документация API: http://localhost:8000/api/docs/

### Локальный запуск

1. Запуск backend сервера:
```bash
cd backend
python manage.py migrate
python manage.py runserver
```

2. Запуск frontend сервера разработки:
```bash
cd frontend
npm start
```

## Тестирование

### Тесты Backend
```bash
cd backend
python manage.py test
```

### Тесты Frontend
```bash
cd frontend
npm test
```

## Документация API

Подробная документация API доступна в файле [Документация API](docs/api.md).

## Архитектура

Архитектура системы и решения по дизайну документированы в файле [Документация по архитектуре](docs/architecture.md).

## Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для вашей функции (`git checkout -b feature/AmazingFeature`)
3. Зафиксируйте ваши изменения (`git commit -m 'Добавлена новая функция'`)
4. Отправьте изменения в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## Лицензия

Этот проект лицензирован под лицензией MIT - подробности в файле [LICENSE](LICENSE).

## Поддержка

Для получения поддержки, пожалуйста, создайте issue в репозитории GitHub или свяжитесь с командой разработки.

## Благодарности

- Django REST Framework
- React
- Material-UI
- Все контрибьюторы и поддерживающие проект
