# Решение проблем OnboardPro

## Проблема авторизации между фронтендом и бэкендом

### Описание проблемы

**Дата обнаружения:** 28 апреля 2025 г.

**Симптомы:**

- Невозможно войти в приложение через форму авторизации
- В консоли браузера ошибка: `POST http://backend:8000/login net::ERR_NAME_NOT_RESOLVED`
- Токен авторизации не сохраняется в localStorage

**Причина:**
Основная причина проблемы заключалась в том, что фронтенд пытался обратиться к бэкенду по внутреннему имени Docker-сети (`http://backend:8000`), а не по публично доступному адресу. Когда приложение запускалось в браузере, оно не имело доступа к внутренним именам Docker-сети.

В `package.json` фронтенда был настроен прокси `"proxy": "http://backend:8000"`, который работал только в режиме разработки при использовании webpack-dev-server, но не в финальной сборке.

### Решение

Мы выполнили следующие изменения для решения проблемы:

1. **Создали централизованный API-клиент** (`/frontend/src/config/api.js`):

   - Автоматически определяет правильный URL для API запросов
   - Для локальной разработки использует `http://localhost:8000`
   - Предоставляет единый интерфейс для работы с API приложения
   - Автоматически добавляет токены авторизации к запросам
   - Обрабатывает ошибки и невалидные токены

2. **Обновили компоненты для использования нового API-клиента**:

   - Исправили страницу авторизации (`Login.jsx`)
   - Исправили компонент макета (`Layout.js`)

3. **Внедрили интеллектуальное определение базового URL**:

```javascript
const getApiBaseUrl = () => {
  return window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : process.env.REACT_APP_API_URL || "";
};
```

4. **Улучшили обработку токенов и ошибок аутентификации** в централизованном API-клиенте:

```javascript
export const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  // Добавляем токен авторизации, если он есть
  const token = localStorage.getItem("token");
  if (token && !options.headers?.Authorization) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, options);

    // Если ответ не OK (не 2xx), выбрасываем ошибку
    if (!response.ok) {
      // Если ответ 401, значит токен недействителен
      if (response.status === 401) {
        localStorage.removeItem("token"); // Удаляем недействительный токен
      }

      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail || `Ошибка запроса: ${response.status}`
      );
    }

    // Для всех остальных ответов пытаемся распарсить JSON
    return await response.json();
  } catch (error) {
    console.error(`Ошибка API запроса к ${url}:`, error);
    throw error;
  }
};
```

### Результат

После внесенных изменений:

- Авторизация успешно работает
- Frontend корректно обращается к backend по доступному URL
- API запросы имеют единый формат и обработку ошибок
- Улучшена безопасность обработки токенов

### Рекомендации для дальнейшей оптимизации

1. **CORS настройки** - настроить CORS на бэкенде для обработки запросов только с разрешенных доменов

2. **Переменные окружения** - создать файл `.env` с переменными окружения:

```
REACT_APP_API_URL=http://localhost:8000
```

3. **Автоматическое обновление токена** - реализовать механизм refresh token для автоматического обновления истекших токенов

4. **Тестирование разных сред** - создать конфигурации для разных окружений (dev, test, prod)

## Проблема с React Hooks и отсутствующей библиотекой

### Описание проблемы

**Дата обнаружения:** 30 апреля 2025 г.

**Симптомы:**

- В консоли браузера ошибка: `Module not found: Error: Can't resolve 'react-transition-group' in '/app/src/components/common'`
- Ошибки вида `React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render`
- Некорректная работа модальных окон в панели менеджера
- Проблемы с редактированием задач и планов

**Причина:**
Выявлены две основные проблемы:

1. Отсутствовала библиотека `react-transition-group`, которая используется в компонентах модальных окон.
2. Нарушены правила использования React Hooks - хуки `useState` вызывались условно внутри модальных компонентов, что противоречит правилам React Hooks.

### Решение

Мы выполнили следующие изменения для решения проблемы:

1. **Установили отсутствующую библиотеку**:

```bash
npm install react-transition-group
```

2. **Реорганизовали модальные компоненты** для соблюдения правил хуков React:

   - Переместили все вызовы `useState` в начало функциональных компонентов, вне условных блоков
   - Добавили `useEffect` для синхронизации локального состояния с глобальным при изменении условий
   - Реализовали безопасную инициализацию начальных значений для всех модальных окон

3. **Изменили паттерн использования модальных окон**:

```javascript
// Неправильно (было)
const TaskModal = () => {
  if (!isTaskModalOpen) return null;
  // Здесь вызов useState - нарушение правил React
  const [localData, setLocalData] = useState(...);
  // ...
};

// Правильно (стало)
const TaskModal = () => {
  // Хуки всегда вызываются в начале компонента
  const [localData, setLocalData] = useState(...);

  // Синхронизация с внешним состоянием
  useEffect(() => {
    if (isTaskModalOpen) {
      setLocalData(...);
    }
  }, [isTaskModalOpen]);

  // Возврат null для скрытия модального окна
  if (!isTaskModalOpen) return null;

  // Рендер содержимого компонента...
};
```

### Результат

После внесенных изменений:

- Устранены ошибки в консоли
- Модальные окна работают корректно
- Редактирование задач и планов функционирует без ошибок
- Улучшена структура кода React-компонентов

### Рекомендации для дальнейшей оптимизации

1. **ESLint с плагином React Hooks** - добавить линтер для автоматического обнаружения нарушений правил хуков:

```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

2. **Компонентное тестирование** - внедрить тесты для модальных компонентов

3. **Кастомные хуки для форм** - вынести логику форм в отдельные кастомные хуки для повышения переиспользуемости

4. **Аудит зависимостей** - регулярно проверять и обновлять зависимости проекта для предотвращения подобных проблем в будущем

## Проблема с перенаправлением после выхода из системы

### Описание проблемы

**Дата обнаружения:** 1 мая 2025 г.

**Симптомы:**

- После нажатия кнопки "Выйти из всех сеансов" пользователь остается на странице ManagerDashboard
- Токен удаляется из localStorage, но интерфейс не обновляется
- Попытка доступа к защищенным маршрутам после ручного перехода на страницу логина работает некорректно

**Причина:**
Основная проблема заключалась в том, что при выходе из системы (logout) удаление токена и перенаправление на страницу входа выполнялись корректно, но React Router не перерисовывал компоненты защищённых маршрутов. Компонент `ProtectedRoute` проверял наличие токена только при первом рендере, но не реагировал на его изменение в localStorage.

В результате, хотя состояние пользователя сбрасывалось и выполнялось перенаправление, само приложение не "понимало", что пользователь вышел из системы, и продолжало показывать защищенный контент.

### Решение

Мы выполнили следующие изменения для решения проблемы:

1. **Модифицировали функцию выхода из системы в компоненте Profile.jsx**:

```javascript
const handleLogout = () => {
  // Полноценный выход из системы
  localStorage.removeItem("token");
  setUser(null); // Сброс состояния пользователя
  navigate("/login", { replace: true });
  // Перезагрузка страницы для полного сброса состояния приложения
  window.location.reload();
};
```

2. **Добавили принудительную перезагрузку страницы при выходе**:

   - После удаления токена и перенаправления добавлена команда `window.location.reload()`
   - Это заставляет браузер полностью перезагрузить страницу, что приводит к новой проверке авторизации
   - При перезагрузке система обнаруживает отсутствие токена и корректно отображает страницу входа

### Результат

После внесенных изменений:

- Кнопка выхода из системы работает корректно
- Пользователь перенаправляется на страницу входа после выхода
- Защищённые маршруты больше не доступны после выхода
- Улучшена безопасность системы аутентификации

### Рекомендации для дальнейшей оптимизации

1. **Глобальный контекст аутентификации** - реализовать React Context для управления состоянием аутентификации:

```javascript
// AuthContext.js
const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  const login = (token) => {
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

2. **Улучшенный компонент защищенного маршрута** - обновить `ProtectedRoute` для использования контекста аутентификации:

```javascript
const ProtectedRoute = ({ element }) => {
  const { isAuthenticated } = useContext(AuthContext);

  return isAuthenticated ? element : <Navigate to="/login" replace />;
};
```

3. **Обработчики событий хранилища** - добавить обработку события `storage` для синхронизации состояния между вкладками:

```javascript
useEffect(() => {
  const handleStorageChange = (event) => {
    if (event.key === "token" && !event.newValue) {
      // Токен был удален в другой вкладке
      setIsAuthenticated(false);
      navigate("/login");
    }
  };

  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}, [navigate]);
```

4. **Разделение логики аутентификации** - выделить логику аутентификации в отдельный сервисный слой для лучшей поддержки кода

## Проблема с навигацией в панели менеджера (Manager Dashboard)

### Описание проблемы

**Дата обнаружения:** 2 мая 2025 г.

**Симптомы:**

- Невозможно покинуть страницу Manager Dashboard
- Нажатие на пункты навигации не приводит к переходу на другие страницы
- В консоли браузера ошибка: `TaskModal.jsx:56 Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.`
- Интерфейс становится неотзывчивым при открытии страницы Manager Dashboard

**Причина:**
Выявлены две взаимосвязанные проблемы:

1. В компоненте `TaskModal.jsx` хук `useEffect` включал в массив зависимостей параметр `isOpen`, что приводило к бесконечному циклу обновлений, когда модальное окно открывалось или закрывалось:

```javascript
useEffect(() => {
  // логика инициализации формы
}, [task, isOpen, mode, plans]);
```

2. В компоненте `ManagerDashboard.jsx` при вызове компонентов модальных окон передавались неправильные параметры:

```javascript
<TaskModal
  isOpen={isTaskModalOpen}
  onClose={() => setIsTaskModalOpen(false)}
  onSave={(taskData) => {
    console.log("Task saved:", taskData);
  }}
  employees={users} // неправильное имя параметра
  selectedTask={null} // неправильное имя параметра
  // отсутствовал параметр plans
/>
```

Эти проблемы создавали бесконечный цикл обновлений, который перегружал JavaScript Event Loop, блокируя работу навигации и делая невозможным переход на другие страницы.

### Решение

Мы выполнили следующие изменения для решения проблемы:

1. **Исправили хук useEffect в компоненте TaskModal.jsx**:

```javascript
// Было
useEffect(() => {
  // логика инициализации формы
}, [task, isOpen, mode, plans]);

// Стало
useEffect(() => {
  // логика инициализации формы
}, [task, mode, plans]);
```

2. **Исправили передачу параметров в ManagerDashboard.jsx**:

```javascript
// Исправленные параметры для TaskModal
<TaskModal
  isOpen={isTaskModalOpen}
  onClose={() => setIsTaskModalOpen(false)}
  onSave={(taskData) => {
    console.log("Task saved:", taskData);
  }}
  users={users}  // исправлено
  plans={plans}  // добавлено
  task={null}    // исправлено
  mode="create"  // добавлено для ясности
/>

// Добавлены отсутствующие параметры для EditTaskModal
<EditTaskModal
  // ...существующие параметры...
  employees={users}
  plans={plans}  // добавлено
/>
```

### Результат

После внесенных изменений:

- Навигация между страницами работает корректно
- Отсутствуют ошибки в консоли браузера
- Модальные окна открываются и закрываются без зависаний
- Улучшена производительность страницы Manager Dashboard

### Рекомендации для дальнейшей оптимизации

1. **Внедрение TypeScript** для строгой типизации параметров компонентов:

```typescript
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  users: User[];
  plans: Plan[];
  onSave: (taskData: any) => void;
  mode: "create" | "edit" | "view";
}
```

2. **Использование prop-types** для проверки параметров компонентов в проектах без TypeScript:

```javascript
TaskModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  task: PropTypes.object,
  users: PropTypes.array.isRequired,
  plans: PropTypes.array.isRequired,
  onSave: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["create", "edit", "view"]).isRequired,
};
```

3. **Внедрение eslint-plugin-react-hooks** для автоматического обнаружения проблем с зависимостями хуков:

```bash
npm install eslint-plugin-react-hooks --save-dev
```

4. **Рефакторинг компонентов** для уменьшения количества параметров и улучшения повторного использования
