# Настройка переменных окружения для API

В OnboardPro используются переменные окружения для гибкой настройки URL API и других параметров в различных средах разработки и деплоя.

## Доступные конфигурации

В проекте доступны три файла конфигурации для разных сред:

- `.env.development` - для разработки в Docker
- `.env.local` - для локальной разработки без Docker
- `.env.production` - для продакшн-среды

## Основные переменные

| Переменная       | Описание                   | Пример значения       |
| ---------------- | -------------------------- | --------------------- |
| VITE_API_URL     | Базовый URL-адрес API      | http://localhost:8000 |
| VITE_API_PREFIX  | Префикс для API-эндпоинтов | /api                  |
| VITE_API_TIMEOUT | Тайм-аут запросов (мс)     | 10000                 |

## Использование скрипта настройки

Для удобного переключения между конфигурациями используйте скрипт `setup_env.sh`:

```bash
# Для локальной разработки вне Docker
./setup_env.sh local

# Для разработки в Docker
./setup_env.sh docker

# Для продакшн-конфигурации
./setup_env.sh prod
```

После изменения конфигурации перезапустите приложение для применения изменений.

## Подробная документация

Подробное руководство по настройке API URL доступно в файле [api_url_configuration.md](KnowledgeStorage/api_url_configuration.md).
