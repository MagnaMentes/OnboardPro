# Развертывание OnboardPro

## Требования к системе

### Минимальные требования

- CPU: 1 ядро
- RAM: 1 GB
- Диск: 10 GB
- OS: Ubuntu 20.04 LTS или новее

### Рекомендуемые требования

- CPU: 2 ядра
- RAM: 2 GB
- Диск: 20 GB
- OS: Ubuntu 22.04 LTS

## Подготовка сервера

1. Обновление системы:

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. Установка зависимостей:

   ```bash
   sudo apt install python3.8 python3.8-venv python3-pip nodejs npm nginx -y
   ```

3. Настройка firewall:
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo ufw allow OpenSSH
   sudo ufw enable
   ```

## Развертывание бэкенда

1. Клонирование репозитория:

   ```bash
   git clone https://github.com/MagnaMentes/OnboardPro.git
   cd OnboardPro
   ```

2. Настройка Python окружения:

   ```bash
   cd backend
   python3.8 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. Настройка переменных окружения:

   ```bash
   cp .env.example .env
   # Отредактируйте .env:
   # - Установите сложный SECRET_KEY
   # - Настройте DATABASE_URL
   ```

4. Настройка systemd сервиса:

   ```ini
   [Unit]
   Description=OnboardPro FastAPI Backend
   After=network.target

   [Service]
   User=onboardpro
   Group=onboardpro
   WorkingDirectory=/path/to/OnboardPro/backend
   Environment="PATH=/path/to/OnboardPro/backend/venv/bin"
   ExecStart=/path/to/OnboardPro/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000

   [Install]
   WantedBy=multi-user.target
   ```

## Развертывание фронтенда

1. Установка зависимостей:

   ```bash
   cd frontend
   npm install
   ```

2. Сборка проекта:

   ```bash
   npm run build
   ```

3. Настройка Nginx:

   ```nginx
   server {
       listen 80;
       server_name your_domain.com;

       location / {
           root /path/to/OnboardPro/frontend;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## SSL/TLS с Let's Encrypt

1. Установка Certbot:

   ```bash
   sudo snap install --classic certbot
   ```

2. Получение сертификата:
   ```bash
   sudo certbot --nginx -d your_domain.com
   ```

## Мониторинг

### Логи

- Systemd логи: `journalctl -u onboardpro.service`
- Nginx логи: `/var/log/nginx/{access,error}.log`

### Проверка статуса

```bash
systemctl status onboardpro
nginx -t
```

## Резервное копирование

1. База данных:

   ```bash
   # Создание резервной копии SQLite
   sqlite3 onboardpro.db ".backup 'backup.db'"
   ```

2. Файлы приложения:
   ```bash
   tar -czf onboardpro-backup.tar.gz /path/to/OnboardPro
   ```

## Обновление

1. Остановка сервисов:

   ```bash
   sudo systemctl stop onboardpro
   ```

2. Обновление кода:

   ```bash
   git pull origin main
   ```

3. Обновление зависимостей:

   ```bash
   # Бэкенд
   cd backend
   source venv/bin/activate
   pip install -r requirements.txt

   # Фронтенд
   cd ../frontend
   npm install
   npm run build
   ```

4. Запуск сервисов:
   ```bash
   sudo systemctl start onboardpro
   sudo nginx -s reload
   ```

## Troubleshooting

### Проблемы с правами доступа

```bash
sudo chown -R onboardpro:onboardpro /path/to/OnboardPro
chmod -R 755 /path/to/OnboardPro
```

### Проблемы с сетью

```bash
netstat -tulpn | grep 8000  # Проверка порта бэкенда
curl -I http://localhost:8000/docs  # Проверка API
```

### Очистка кеша

```bash
sudo nginx -s reload  # Перезагрузка конфигурации Nginx
sudo systemctl restart onboardpro  # Перезапуск бэкенда
```
