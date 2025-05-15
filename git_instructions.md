# Команды для отправки изменений в репозиторий

# 1. Создание новой ветки для изменений
git checkout -b fix/editable-card-components

# 2. Добавление измененных файлов
git add frontend/src/pages/Dashboard.jsx
git add frontend/src/pages/Profiles.jsx
git add MyKnowledge/fixing_editable_card_components.md
git add MyKnowledge/log.md
git add docs/technical_documentation_ru.md

# 3. Создание коммита с понятным описанием
git commit -m "Исправление компонента EditableCard для корректного открытия карточек"

# 4. Отправка изменений в удаленный репозиторий
git push origin fix/editable-card-components

# 5. После этого можно создать Pull Request через интерфейс GitHub/GitLab/Bitbucket
# и запросить ревью у других членов команды

# Примечание: если вы работаете с основной веткой напрямую (не рекомендуется, но бывает),
# то можно просто выполнить:
# git add .
# git commit -m "Исправление компонента EditableCard для корректного открытия карточек"
# git push origin main  # или master, в зависимости от настройки репозитория

