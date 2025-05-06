FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Очистка кэша npm для избежания проблем с поврежденными пакетами
RUN npm cache clean --force

# Установка зависимостей с включенным флагом legacy-peer-deps для решения проблем совместимости
RUN npm install --legacy-peer-deps
RUN npm install -D tailwindcss postcss@^8 autoprefixer@^10

# Явная установка проблемных пакетов
RUN npm install react-beautiful-dnd@13.1.1 --legacy-peer-deps
RUN npm install @tanstack/react-query@5.28.2 --legacy-peer-deps

# Copy source code and configuration files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]