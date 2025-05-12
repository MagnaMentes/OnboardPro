#!/bin/bash

# Скрипт для публикации изменений UX в репозиторий

echo "=== Подготовка изменений UX для публикации ==="

# Добавляем новые файлы и измененные файлы
echo "Добавление новых и измененных файлов..."
git add \
  CHANGELOG.md \
  README.md \
  frontend/src/utils/userUtils.js \
  frontend/src/components/TaskModal.jsx \
  frontend/src/components/DepartmentForm.jsx \
  frontend/src/pages/ManagerDashboard.jsx \
  MyKnowledge/user_display_standards.md \
  MyKnowledge/user_display_summary_20250512.md \
  MyKnowledge/ux_improvements_20250512.md \
  MyKnowledge/log.md \
  MyKnowledge/log_entry_20250512.md

# Создаем коммит
echo "Создание коммита..."
git commit -m "UX: Стандартизация отображения данных пользователей

- Создан модуль userUtils.js с утилитарными функциями для работы с данными пользователей
- Исправлено отображение имен пользователей в компонентах TaskModal, ManagerDashboard и DepartmentForm
- Создана подробная документация стандартов отображения пользовательских данных
- Обновлен README.md и создан CHANGELOG.md для отслеживания изменений"

echo "Коммит создан успешно!"
echo "Для отправки изменений в репозиторий выполните: git push origin main"
