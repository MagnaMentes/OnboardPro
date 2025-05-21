# Система аутентификации (Frontend)

## Общая архитектура

Система аутентификации на фронтенде OnboardPro реализована с использованием:

- React Router для маршрутизации и защиты маршрутов
- Zustand для управления состоянием аутентификации
- Axios для HTTP-запросов и интерсепторов
- localStorage для хранения токенов и данных пользователя

## Аутентификация и хранение состояния

Управление состоянием аутентификации реализовано с помощью Zustand-хранилища (`authStore.ts`), которое:

- Хранит данные о пользователе, токены и статус аутентификации
- Предоставляет методы для входа, выхода и обновления данных пользователя
- Синхронизирует состояние с localStorage

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
}
```

## Интеграция с API

Для взаимодействия с API аутентификации используется модуль `auth.ts`, который содержит методы:

- `login`: Аутентификация пользователя
- `refreshToken`: Обновление токена доступа
- `getCurrentUser`: Получение данных текущего пользователя

При успешной авторизации данные сохраняются в хранилище и localStorage:

```typescript
login: (accessToken, refreshToken, user) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));

  set({
    accessToken,
    refreshToken,
    user,
    isAuthenticated: true,
  });
};
```

## Axios и интерсепторы

Создан кастомный экземпляр Axios (`client.ts`), который:

1. Добавляет токен к каждому запросу:

```typescript
axiosInstance.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = localStorage.getItem("accessToken");

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

2. Обрабатывает ошибки 401 (Unauthorized) и автоматически обновляет токен:

```typescript
if (error.response?.status === 401 && !originalRequest._retry) {
  // Запрос на обновление токена и повторная отправка запроса
}
```

3. Управляет очередью запросов при обновлении токена

## Защита маршрутов

Для защиты маршрутов, требующих аутентификации, используется компонент `ProtectedRoute.tsx`:

```tsx
const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  // Перенаправление неаутентифицированных пользователей
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Проверка ролей (если требуется)
  if (requiredRole && user && !requiredRole.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
```

В основном компоненте приложения определены защищенные маршруты с проверкой ролей:

```tsx
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>

<Route element={<ProtectedRoute requiredRole={["admin"]} />}>
  {/* Маршруты только для администраторов */}
</Route>

<Route element={<ProtectedRoute requiredRole={["admin", "hr"]} />}>
  {/* Маршруты для HR и администраторов */}
</Route>
```

## Инициализация сессии

При загрузке приложения проверяется наличие сохраненных токенов и данных пользователя в localStorage. Если они найдены, выполняется запрос к API `/users/me/` для проверки валидности токена:

```tsx
useEffect(() => {
  const storedAccessToken = localStorage.getItem("accessToken");
  const storedRefreshToken = localStorage.getItem("refreshToken");
  const storedUser = localStorage.getItem("user");

  if (storedAccessToken && storedRefreshToken && storedUser) {
    setTokens(storedAccessToken, storedRefreshToken);
    setUser(JSON.parse(storedUser));

    // Проверка валидности сессии
    authApi.getCurrentUser().catch(() => {
      // Очистка при ошибке
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setTokens(null, null);
      setUser(null);
    });
  }
}, []);
```
