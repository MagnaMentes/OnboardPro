# Руководство по развертыванию OnboardPro

## Локальное развертывание

### Предварительные требования

- Docker Desktop
- Docker Compose
- Git

### Шаги по установке

1. Клонируйте репозиторий:

```bash
git clone git@github.com:your-username/onboardpro.git
cd onboardpro
```

2. Запустите Docker контейнеры:

```bash
docker-compose up -d
```

3. Проверьте работоспособность:

```bash
curl http://localhost:8000/api/health
```

### Переменные окружения

В продакшене необходимо настроить следующие переменные:

- `DJANGO_SECRET_KEY`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`

## Развертывание в продакшен (планируется)

### CI/CD

- GitHub Actions для автоматизации сборки
- Автоматические тесты
- Линтинг кода

### Kubernetes

- Helm чарты
- Автомасштабирование
- Мониторинг здоровья

### База данных

- Управляемый PostgreSQL
- Регулярные бэкапы
- Репликация

### Безопасность

- SSL/TLS сертификаты
- Защита от DDoS
- Регулярные обновления зависимостей
