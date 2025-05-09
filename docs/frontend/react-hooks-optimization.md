# React Hooks и типичные проблемы оптимизации

В проекте OnboardPro используется React с функциональными компонентами и хуками. Эта страница документирует лучшие практики и общие проблемы, связанные с использованием React Hooks для оптимизации производительности.

## Типичные проблемы с хуками и их решения

### 1. Бесконечные циклы обновлений

**Проблема:** Компонент бесконечно перерендеривается, вызывая множественные запросы к API.

**Причины:**
- Отсутствие необходимых зависимостей в массиве `useEffect` или `useMemo`
- Неправильное использование функций в зависимостях без мемоизации
- Изменение состояния в эффекте без условия остановки

**Пример проблемы:**
```jsx
// Создание новой функции при каждом рендере
const fetchData = async () => {
  const data = await apiRequest('/api/data');
  setState(data);
};

// Использование функции в эффекте
useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData меняется при каждом рендере
```

**Решение:**
```jsx
// Мемоизация функции
const fetchData = useCallback(async () => {
  const data = await apiRequest('/api/data');
  setState(data);
}, [/* зависимости */]);

// Теперь функция стабильна и не вызывает перерендер
useEffect(() => {
  fetchData();
}, [fetchData]);
```

### 2. Пропущенные зависимости в хуках

**Проблема:** Данные не обновляются при изменении внешних переменных.

**Причины:**
- Отсутствие необходимых переменных в массиве зависимостей
- Использование внешних переменных без включения их в массив зависимостей

**Пример:**
```jsx
// Данные не будут обновляться при изменении userId
useEffect(() => {
  apiRequest(`/api/user/${userId}`).then(setUserData);
}, []); // Отсутствует зависимость userId
```

**Решение:**
```jsx
// Правильное указание зависимостей
useEffect(() => {
  apiRequest(`/api/user/${userId}`).then(setUserData);
}, [userId]); // Эффект выполнится при изменении userId
```

### 3. Чрезмерное количество запросов к API

**Проблема:** Компонент делает слишком много запросов, даже когда они не нужны.

**Причины:**
- Отсутствие механизма дебаунса или тротлинга
- Ненужные зависимости, вызывающие лишние обновления

**Решение:**
```jsx
// Использование useDebounce для предотвращения частых запросов
const debouncedSearchTerm = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearchTerm) {
    apiRequest(`/api/search?q=${debouncedSearchTerm}`).then(setResults);
  }
}, [debouncedSearchTerm]);
```

### 4. Проблемы с рефересными типами в зависимостях

**Проблема:** Объекты и массивы создаются заново при каждом рендере, вызывая избыточные обновления.

**Решение:**
```jsx
// Мемоизация объекта конфигурации
const config = useMemo(() => ({
  endpoint: `/api/${type}`,
  params: { id, filter }
}), [id, type, filter]);

useEffect(() => {
  apiRequest(config.endpoint, config.params).then(setData);
}, [config]); // Теперь зависимость стабильна
```

## Рекомендации по оптимизации

### 1. Всегда мемоизируйте функции и объекты

Используйте `useCallback` для функций и `useMemo` для объектов, которые передаются в дочерние компоненты или используются в зависимостях хуков:

```jsx
// Для функций
const handleClick = useCallback(() => {
  // обработка клика
}, [необходимые зависимости]);

// Для объектов
const options = useMemo(() => ({
  // свойства объекта
}), [необходимые зависимости]);
```

### 2. Правильно управляйте зависимостями хуков

- Включайте все переменные, используемые внутри эффекта
- Избегайте нестабильных ссылок (объекты и функции без мемоизации)
- Используйте линтеры для проверки зависимостей

### 3. Используйте кастомные хуки для повторяющейся логики

Создавайте кастомные хуки для выделения повторяющейся логики и обеспечения единого поведения в приложении:

```jsx
function useDataFetching(endpoint, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiRequest(endpoint)
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, dependencies);

  return { data, loading, error };
}

// Использование
const { data, loading, error } = useDataFetching(`/api/users/${userId}`, [userId]);
```

### 4. Избегайте избыточных рендеров с React.memo

Используйте `React.memo` для предотвращения ненужных перерендеров компонентов:

```jsx
const UserCard = React.memo(function UserCard({ user, onEdit }) {
  // компонент карточки пользователя
});
```

## Практический пример: исправление проблемы в HR Dashboard

В компоненте HR Dashboard была устранена проблема с бесконечным циклом обновлений путем:

1. Мемоизации функции загрузки данных:

```jsx
const fetchUpdatedAnalytics = useCallback(async () => {
  // код функции
}, [filters]);
```

2. Добавления корректных зависимостей в хуки:

```jsx
// Добавление analytics в хук useMemo
const chartData = useMemo(() => {
  // формирование данных графика
}, [analytics, taskAnalytics]);

// Добавление fetchUpdatedAnalytics в хук useEffect
useEffect(() => {
  // логика эффекта
}, [wsDisabled, fetchUpdatedAnalytics]);
```

3. Устранения неиспользуемых переменных и импортов для улучшения производительности.

Подробнее о решении этой проблемы можно прочитать в [документации по исправлению HR Dashboard](../MyKnowledge/hr_dashboard_bugfix.md).
