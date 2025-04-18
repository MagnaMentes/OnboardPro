FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

# Создаем необходимые директории
RUN mkdir -p /app/staticfiles /frontend/dist /frontend/src /app/static

# Копируем файлы проекта
COPY . .

# Копируем frontend файлы
COPY ../frontend/dist/* /app/staticfiles/
COPY ../frontend/src/* /app/staticfiles/

# Устанавливаем правильные разрешения
RUN chmod -R 755 /app/staticfiles