# OnboardPro Frontend

Фронтенд-часть платформы для онбординга сотрудников OnboardPro.

## Технологии

- React 18+
- TypeScript
- Vite
- Chakra UI
- React Router v6+
- Zustand
- Axios
- React Hot Toast

## Инструкция по разработке

### Предварительные требования

- Docker и Docker Compose

### Запуск в режиме разработки

Весь проект запускается через Docker Compose:

```bash
# В корневой папке проекта
docker-compose up
```

Это запустит следующие сервисы:

- Backend на порту 8000
- Frontend на порту 3000
- PostgreSQL на порту 5434

### Сборка проекта

```bash
# В корневой папке проекта
docker-compose build frontend
```

### Разработка

Весь код фронтенда находится в папке `frontend/src/` и имеет следующую структуру:

```
src/
├── components/     # Переиспользуемые UI-элементы
├── pages/          # Страницы: Login, Dashboard и т.д.
├── api/            # Axios instance + API-сервисы
├── context/        # Контексты авторизации и пользователя
└── store/          # Zustand-хранилище
```

## Взаимодействие с Backend API

### Настройка API клиента

Axios клиент настроен в файле `src/api/client.ts`:

```typescript
// Пример использования API клиента
import api from "../api/client";

// GET запрос
const fetchData = async () => {
  try {
    const response = await api.get("/endpoint");
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

// POST запрос
const createResource = async (data) => {
  try {
    const response = await api.post("/endpoint", data);
    return response.data;
  } catch (error) {
    console.error("Error creating resource:", error);
    throw error;
  }
};
```

### Аутентификация

Приложение использует JWT-аутентификацию:

1. После успешного входа токен сохраняется в localStorage
2. API-клиент автоматически добавляет токен в заголовки запросов
3. При получении 401 ошибки пользователь перенаправляется на страницу входа

## Docker-интеграция

Frontend работает в отдельном контейнере и обменивается данными с Backend через определенную в Docker Compose сеть.

В production режиме фронтенд собирается в статические файлы и обслуживается через Nginx.

## Полезные команды

```bash
# Открыть оболочку в контейнере frontend
docker-compose exec frontend sh

# Установить новую зависимость
docker-compose exec frontend npm install package-name

# Запустить тесты
docker-compose exec frontend npm test
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```

## BI-аналитика

Модуль BI-аналитики предоставляет административный интерфейс для HR и администраторов для мониторинга процесса онбординга сотрудников.

### Основные функции

- **Ключевые метрики**: визуализация общих показателей онбординга (активные и завершённые назначения, средний прогресс, статистика фидбека и тестов)
- **Таблица назначений**: интерактивная таблица с сортировкой и фильтрацией
- **График настроения**: визуализация динамики настроения сотрудников за последние 14 дней

### Доступ к аналитике

Аналитическая панель доступна по адресу `/admin/analytics` только для пользователей с ролями HR и ADMIN.

### Интеграция с Backend

Модуль использует следующие API эндпоинты бэкенда:

- `GET /api/analytics/summary/` - получение сводных данных
- `GET /api/analytics/assignments/` - получение таблицы назначений
- `GET /api/analytics/feedback-summary/` - данные о настроении для графика

Более подробная информация об аналитике доступна в [frontend_bi_analytics.md](../KnowledgeStorage/frontend_bi_analytics.md)

## AI Copilot (Solomia)

AI Copilot (Solomia) - интеллектуальный ассистент, который помогает сотрудникам проходить этапы онбординга, предоставляя контекстно-зависимые подсказки.

### Основные функции

- Отображение AI-подсказок рядом с описанием шага
- Генерация подсказок с учетом контекста и предыдущего фидбэка
- Интерактивный интерфейс с возможностью запроса новых подсказок

### Компоненты

- **StepAIHintCard**: Основной компонент для отображения подсказок на странице шага онбординга
- **AICopilotService**: Сервис для взаимодействия с API AI Copilot

### Интеграция с Backend

Модуль использует следующие API эндпоинты бэкенда:

- `GET /api/ai/step/{id}/hint/` - получение существующей подсказки для шага
- `POST /api/ai/step/{id}/hint/` - генерация новой подсказки для шага

Более подробная информация об AI Copilot доступна в [frontend_ai_copilot.md](../KnowledgeStorage/frontend_ai_copilot.md)
