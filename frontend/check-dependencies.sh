#!/bin/bash

# Скрипт для проверки зависимостей в проекте

# Цветовые коды для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Запуск проверки зависимостей ===${NC}"

# Функция для вывода заголовка секции
function section_header() {
    echo -e "\n${YELLOW}=== $1 ===${NC}"
}

# Проверка наличия неиспользуемых зависимостей с помощью depcheck
section_header "Проверка неиспользуемых зависимостей"
if command -v depcheck > /dev/null 2>&1; then
    echo -e "${BLUE}Запуск depcheck для поиска неиспользуемых зависимостей...${NC}"
    depcheck --json | jq '.dependencies, .devDependencies'
    
    # Подсчет количества неиспользуемых зависимостей
    UNUSED_COUNT=$(depcheck --json | jq '.dependencies, .devDependencies | length')
    
    if [ "$UNUSED_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}Обнаружены неиспользуемые зависимости. Рекомендуется их удалить.${NC}"
    else
        echo -e "${GREEN}Неиспользуемых зависимостей не обнаружено.${NC}"
    fi
else
    echo -e "${RED}Инструмент depcheck не установлен. Установите его с помощью 'npm install -g depcheck'${NC}"
fi

# Проверка дубликатов зависимостей
section_header "Проверка дубликатов зависимостей"
if command -v npm-check > /dev/null 2>&1; then
    echo -e "${BLUE}Запуск npm-check для поиска дубликатов и устаревших зависимостей...${NC}"
    npm-check -s
else
    echo -e "${RED}Инструмент npm-check не установлен. Установите его с помощью 'npm install -g npm-check'${NC}"
fi

# Проверка уязвимостей
section_header "Проверка уязвимостей"
echo -e "${BLUE}Запуск npm audit для поиска уязвимостей...${NC}"
npm audit --json | jq '.metadata.vulnerabilities'

# Проверка размера зависимостей
section_header "Анализ размера зависимостей"
if command -v du > /dev/null 2>&1; then
    echo -e "${BLUE}Анализ размера node_modules...${NC}"
    du -sh node_modules
    echo -e "${BLUE}Топ-10 самых больших пакетов:${NC}"
    du -sh node_modules/* | sort -hr | head -10
fi

# Проверка совместимости зависимостей
section_header "Проверка совместимости зависимостей"
echo -e "${BLUE}Проверка peer dependencies...${NC}"
npm ls --json | jq '.problems'

# Рекомендации по оптимизации
section_header "Рекомендации по оптимизации"
echo -e "${GREEN}1. Регулярно обновляйте зависимости: npm update${NC}"
echo -e "${GREEN}2. Удаляйте неиспользуемые зависимости: npm uninstall <package>${NC}"
echo -e "${GREEN}3. Используйте --production флаг при деплое: npm install --production${NC}"
echo -e "${GREEN}4. Рассмотрите возможность использования pnpm для экономии места${NC}"
echo -e "${GREEN}5. Настройте автоматическую проверку зависимостей в CI/CD pipeline${NC}"

echo -e "\n${BLUE}=== Проверка зависимостей завершена ===${NC}"