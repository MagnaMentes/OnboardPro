# 🚀 Руководство по развертыванию

## 🐳 Развертывание с помощью Docker (рекомендуется)

### 📋 Предварительные требования

- Docker 20.10+
- docker-compose 1.29+
- 2 ГБ ОЗУ минимум
- 10 ГБ свободного места на диске

### 🔧 Настройка окружения

1. **Клонируйте репозиторий:**

```bash
git clone https://github.com/MagnaMentes/OnboardPro.git
cd OnboardPro
```

2. **Настройте переменные окружения:**

```bash
cp backend/.env.example backend/.env
```

Отредактируйте `.env` файл:

```
DATABASE_URL=sqlite:///onboardpro.db
SECRET_KEY=your-secure-secret-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
GOOGLE_CREDENTIALS_PATH=/app/credentials.json
WORKABLE_API_KEY=your-workable-api-key
```

3. **Подготовьте Google Calendar интеграцию:**

- Скопируйте файл credentials.json в директорию backend/
- Добавьте путь к файлу в .env: GOOGLE_CREDENTIALS_PATH=/app/credentials.json

### 🚀 Запуск

1. **Запустите контейнеры:**

```bash
docker-compose up -d
```

2. **Проверьте работоспособность:**

- Фронтенд: http://localhost:3000
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

### 📊 Мониторинг

- **Логи контейнеров:**

```bash
docker-compose logs -f
```

- **Статус контейнеров:**

```bash
docker-compose ps
```

### 🔄 Обновление

1. **Получите последние изменения:**

```bash
git pull origin main
```

2. **Пересоберите контейнеры:**

```bash
docker-compose up -d --build
```

## 🖥 Локальное развертывание (для разработки)

### 📋 Предварительные требования

- Python 3.8+
- Node.js 14+
- npm 6+
- SQLite 3

### 🔧 Настройка бэкенда

1. **Создайте виртуальное окружение:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/macOS
# или
venv\Scripts\activate     # Windows
```

2. **Установите зависимости:**

```bash
pip install -r requirements.txt
```

3. **Настройте переменные окружения:**
   Создайте и отредактируйте `.env` файл как описано выше.

### 🎨 Настройка фронтенда

1. **Установите зависимости:**

```bash
cd frontend
npm install
```

2. **Скомпилируйте стили:**

```bash
npm run build
```

### 🚀 Запуск для разработки

1. **Запустите бэкенд:**

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

2. **Запустите фронтенд в режиме разработки:**

```bash
cd frontend
npm run watch
```

## 🔐 SSL/HTTPS настройка

Для продакшен-окружения рекомендуется настроить SSL-сертификаты:

1. **Получите SSL сертификаты** (например, через Let's Encrypt)

2. **Обновите nginx конфигурацию:**

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ... остальные настройки ...
}
```

3. **Обновите docker-compose.yml:**

```yaml
services:
  frontend:
    volumes:
      - ./ssl:/etc/nginx/ssl
    ports:
      - "443:443"
```

## 🔧 Обслуживание

### 📦 Бэкапы

1. **База данных:**

```bash
# Создание бэкапа
docker-compose exec backend sqlite3 onboardpro.db ".backup '/backups/backup.db'"

# Восстановление
docker-compose exec backend sqlite3 onboardpro.db ".restore '/backups/backup.db'"
```

2. **Логи:**

```bash
# Архивация логов
tar -czf logs_backup.tar.gz logs/
```

### 🔍 Мониторинг здоровья

Проверка статуса API:

```bash
curl http://localhost:8000/health
```

### 🔄 Ротация логов

Настройте logrotate для управления логами:

```
/var/log/onboardpro/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 640 nginx nginx
}
```

## 🚨 Устранение неполадок

### 🔍 Проверка статуса сервисов

```bash
docker-compose ps
docker-compose logs -f [service_name]
```

### 🔄 Перезапуск сервисов

```bash
docker-compose restart [service_name]
```

### 🧹 Очистка

```bash
# Удаление неиспользуемых ресурсов
docker-compose down
docker system prune -a
```
