#!/bin/bash

# Скрипт для запуска Vite с автоматической проверкой зависимостей

# Запускаем расширенную проверку зависимостей, если установлена переменная CHECK_DEPENDENCIES
if [ "$CHECK_DEPENDENCIES" = "true" ]; then
    echo "Запуск расширенной проверки зависимостей..."
    if [ -f "./check-dependencies.sh" ]; then
        ./check-dependencies.sh
    else
        echo "ВНИМАНИЕ: Скрипт check-dependencies.sh не найден!"
    fi
fi

# Проверяем наличие критических уязвимостей
echo "Проверка наличия критических уязвимостей..."
CRITICAL_VULNERABILITIES=$(npm audit --json 2>/dev/null | grep -c '"severity":"critical"' || echo "0")

if [ "$CRITICAL_VULNERABILITIES" -gt 0 ]; then
    echo "ВНИМАНИЕ: Обнаружены критические уязвимости в зависимостях!"
    echo "Рекомендуется выполнить 'npm audit fix' для их устранения."
    echo "Для автоматического исправления уязвимостей установите переменную AUTO_FIX_VULNERABILITIES=true"
    
    # Если установлена переменная AUTO_FIX_VULNERABILITIES, автоматически исправляем уязвимости
    if [ "$AUTO_FIX_VULNERABILITIES" = "true" ]; then
        echo "Автоматическое исправление уязвимостей..."
        npm audit fix --legacy-peer-deps
    fi
fi

# Проверяем наличие устаревших зависимостей
echo "Проверка наличия устаревших зависимостей..."
OUTDATED_DEPENDENCIES=$(npm outdated --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")

if [ "$OUTDATED_DEPENDENCIES" -gt 0 ]; then
    echo "ВНИМАНИЕ: Обнаружены устаревшие зависимости!"
    echo "Рекомендуется выполнить 'npm update' для их обновления."
    echo "Для автоматического обновления зависимостей установите переменную AUTO_UPDATE_DEPENDENCIES=true"
    
    # Если установлена переменная AUTO_UPDATE_DEPENDENCIES, автоматически обновляем зависимости
    if [ "$AUTO_UPDATE_DEPENDENCIES" = "true" ]; then
        echo "Автоматическое обновление зависимостей..."
        npm update --legacy-peer-deps
    fi
fi

# Устанавливаем зависимости, если node_modules не существует
if [ ! -d "node_modules" ]; then
    echo "Устанавливаем зависимости..."
    npm install --legacy-peer-deps
fi

# Запускаем Vite в режиме разработки
echo "Запускаем Vite в режиме разработки..."
exec npm run dev -- --host 0.0.0.0 --strictPort
