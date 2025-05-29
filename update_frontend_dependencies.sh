#!/bin/bash

# Скрипт для проверки и обновления зависимостей frontend

cd "$(dirname "$0")/frontend"

# Цветовые коды для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Проверка зависимостей frontend ====${NC}"

# Проверка наличия node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${RED}Директория node_modules не найдена. Устанавливаем зависимости...${NC}"
    npm install --legacy-peer-deps
fi

# Проверка наличия пакетов MUI
echo -e "${YELLOW}Проверка наличия пакетов MUI...${NC}"
if ! npm list @mui/material > /dev/null 2>&1 || ! npm list @mui/icons-material > /dev/null 2>&1; then
    echo -e "${RED}Пакеты MUI не установлены. Устанавливаем...${NC}"
    npm install --save @mui/material @mui/icons-material @emotion/react @emotion/styled --legacy-peer-deps
fi

# Проверка наличия критических уязвимостей
echo -e "${YELLOW}Проверка наличия критических уязвимостей...${NC}"
CRITICAL_VULNERABILITIES=$(npm audit --json 2>/dev/null | grep -c '"severity":"critical"' || echo "0")

if [ "$CRITICAL_VULNERABILITIES" -gt 0 ]; then
    echo -e "${RED}ВНИМАНИЕ: Обнаружены критические уязвимости в зависимостях!${NC}"
    echo -e "${YELLOW}Выполняем 'npm audit fix' для их устранения...${NC}"
    npm audit fix --legacy-peer-deps
else
    echo -e "${GREEN}Критических уязвимостей не обнаружено.${NC}"
fi

# Проверка наличия устаревших зависимостей
echo -e "${YELLOW}Проверка наличия устаревших зависимостей...${NC}"
OUTDATED_COUNT=$(npm outdated --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")

if [ "$OUTDATED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}Обнаружены устаревшие зависимости:${NC}"
    npm outdated
    
    read -p "Хотите обновить зависимости? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Обновляем зависимости...${NC}"
        npm update --legacy-peer-deps
    fi
else
    echo -e "${GREEN}Устаревших зависимостей не обнаружено.${NC}"
fi

# Проверка наличия дубликатов зависимостей
echo -e "${YELLOW}Проверка наличия дубликатов зависимостей...${NC}"
if command -v npm-check > /dev/null 2>&1; then
    npm-check
else
    echo -e "${YELLOW}Для проверки дубликатов рекомендуется установить npm-check:${NC}"
    echo -e "${YELLOW}npm install -g npm-check${NC}"
fi

echo -e "${GREEN}=== Проверка зависимостей завершена ====${NC}"