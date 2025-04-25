#!/bin/bash
echo "Проверяем Docker..."
docker --version || { echo "Docker не установлен"; exit 1; }
echo "Проверяем onboardpro.db..."
[ -f /Users/magna_mentes/Desktop/Projects/OnboardPro/backend/onboardpro.db ] || { echo "onboardpro.db отсутствует"; exit 1; }
echo "Настройка валидна!"