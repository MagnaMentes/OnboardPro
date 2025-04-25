FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Установка всех зависимостей
RUN npm install --legacy-peer-deps
RUN npm install -D tailwindcss postcss@^8 autoprefixer@^10

# Копируем исходный код и конфигурационные файлы
COPY . .

# Запуск приложения
EXPOSE 3000
CMD ["npm", "start"]