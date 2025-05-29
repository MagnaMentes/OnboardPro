#!/bin/sh
# Запускаем Vite с доступом извне контейнера и расширенной конфигурацией для горячей перезагрузки
cd /app/frontend
echo "Устанавливаем зависимости..."
npm install --no-package-lock --legacy-peer-deps
echo "Запускаем Vite в режиме разработки..."
npm run dev -- --host 0.0.0.0 --strictPort
