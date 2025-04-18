# Руководство по установке и развертыванию

## Локальная разработка

### Требования к окружению
- Python 3.13+
- Docker и Docker Compose
- PostgreSQL 15
- Node.js 18+ и npm
- Git

### Пошаговая установка

1. **Подготовка окружения**
```bash
# Клонирование репозитория
git clone https://github.com/MagnaMentes/OnboardPro.git
cd OnboardPro

# Создание виртуального окружения Python
cd backend
python -m venv venv
source venv/bin/activate  # Linux/MacOS
# или
.\venv\Scripts\activate  # Windows

# Установка зависимостей Python
pip install -r requirements.txt
```

2. **Настройка базы данных**
```bash
# Запуск PostgreSQL через Docker
docker-compose up -d

# Применение миграций
python manage.py migrate
```

3. **Настройка переменных окружения**
Создайте файл `.env` в корневой директории:
```
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=onboardpro_db
DB_USER=onboardpro
DB_PASSWORD=securepassword
DB_HOST=localhost
DB_PORT=5433
```

## Производственное развертывание

### Требования к серверу
- Ubuntu 22.04 LTS
- 2+ CPU
- 4+ GB RAM
- 20+ GB SSD
- Nginx
- Домен и SSL-сертификат

### Настройка сервера

1. **Установка системных зависимостей**
```bash
sudo apt update
sudo apt install -y python3-pip python3-venv docker.io docker-compose nginx
```

2. **Настройка Nginx**
```nginx
server {
    listen 80;
    server_name onboardpro.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static/ {
        alias /var/www/onboardpro/static/;
    }

    location /media/ {
        alias /var/www/onboardpro/media/;
    }
}
```

3. **Настройка SSL с Certbot**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d onboardpro.com
```

4. **Настройка Gunicorn**
Создайте systemd сервис `/etc/systemd/system/onboardpro.service`:
```ini
[Unit]
Description=OnboardPro Gunicorn daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/onboardpro/backend
ExecStart=/var/www/onboardpro/backend/venv/bin/gunicorn onboardpro.wsgi:application -w 4 -b 127.0.0.1:8000

[Install]
WantedBy=multi-user.target
```

### Развертывание обновлений

1. **Автоматизация развертывания**
```bash
#!/bin/bash
# deploy.sh

# Pull changes
git pull origin main

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Apply migrations
python manage.py migrate

# Restart services
sudo systemctl restart onboardpro
sudo systemctl restart nginx
```

2. **Мониторинг**
- Настройка Prometheus для метрик
- Grafana для визуализации
- Sentry для отслеживания ошибок

### Резервное копирование

1. **База данных**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/var/backups/onboardpro"

# Backup PostgreSQL
pg_dump onboardpro_db > "$BACKUP_DIR/db_$DATE.sql"

# Compress
gzip "$BACKUP_DIR/db_$DATE.sql"

# Cleanup old backups (keep last 30 days)
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +30 -delete
```

2. **Медиафайлы**
```bash
#!/bin/bash
# backup_media.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/var/backups/onboardpro"

# Backup media files
tar -czf "$BACKUP_DIR/media_$DATE.tar.gz" /var/www/onboardpro/media

# Cleanup old backups
find "$BACKUP_DIR" -name "media_*.tar.gz" -mtime +30 -delete
```

## Безопасность

1. **Файрвол (UFW)**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **Настройка fail2ban**
```bash
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

3. **Регулярные обновления**
```bash
# Автоматические обновления безопасности
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Масштабирование

1. **Горизонтальное масштабирование**
- Настройка нескольких серверов приложений
- Балансировка нагрузки через Nginx
- Redis для кеширования и сессий

2. **Вертикальное масштабирование**
- Увеличение ресурсов сервера
- Оптимизация настроек PostgreSQL
- Настройка пулов соединений

## Поддержка

### Контакты технической поддержки
- Email: support@onboardpro.com
- Телефон: +7 (XXX) XXX-XX-XX
- Время работы: 24/7

### Полезные ресурсы
- Документация: https://docs.onboardpro.com
- API Reference: https://api.onboardpro.com/docs
- GitHub: https://github.com/MagnaMentes/OnboardPro