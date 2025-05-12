# Техническая документация: Улучшение отображения планов адаптации

## Версия 2.3.1 (12.05.2025)

### Обзор изменений

В данном документе описаны технические аспекты изменений, внесенных в компонент `ManagerDashboard.jsx` для улучшения отображения карточек планов адаптации. Изменения направлены на повышение информативности и наглядности интерфейса панели менеджера.

### Технические детали реализации

#### Изменения в компоненте ManagerDashboard.jsx

1. **Добавлен импорт компонента UserCircleIcon**:

   ```jsx
   import {
     // существующие импорты
     UserCircleIcon,
   } from "@heroicons/react/24/outline";
   ```

2. **Изменена структура заголовка карточки плана**:

   - Добавлен блок для отображения фотографии пользователя
   - Изменен контент заголовка для отображения имени пользователя вместо названия плана
   - Сохранена функциональность кнопок редактирования и удаления

3. **Логика отображения фотографии**:

   - Проверяется наличие пользователя, назначенного на план: `assignedUser`
   - Проверяется наличие фотографии у пользователя: `users.find(u => u.id === assignedUser)?.photo`
   - В зависимости от результата проверок отображается либо фотография, либо иконка-заглушка

4. **Логика отображения имени**:
   - Используется функция `getDisplayName(assignedUser)` из `userUtils.js`
   - Если `assignedUser` отсутствует, используется оригинальное название плана `plan.title`

#### Описание изменений в разметке

Оригинальная разметка:

```jsx
<div className="flex justify-between items-start mb-2">
  <h3
    className="text-lg font-medium text-gray-900 line-clamp-1"
    title={plan.title}
  >
    {plan.title}
  </h3>
  {hasRole(userRole, ["hr"]) && (
    <div className="flex space-x-1">
      <button
        onClick={() => handleEditPlan(plan)}
        className="text-blue-600 hover:text-blue-900 focus:outline-none p-1 hover:bg-blue-50 rounded"
        title="Редактировать план"
      >
        <PencilIcon className="h-4 w-4" />
      </button>
      <button
        onClick={() => openDeletePlanModal(plan)}
        className="text-red-600 hover:text-red-900 focus:outline-none p-1 hover:bg-red-50 rounded"
        title="Удалить план"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  )}
</div>
```

Новая разметка:

```jsx
<div className="flex justify-between items-start mb-2">
  {/* Заголовок с именем сотрудника и фото */}
  <div className="flex items-center">
    {/* Фото пользователя */}
    {assignedUser && users.find((u) => u.id === assignedUser)?.photo ? (
      <div className="h-8 w-8 rounded-full overflow-hidden mr-3 border border-gray-200 flex-shrink-0">
        <img
          src={`${getApiBaseUrl()}${
            users.find((u) => u.id === assignedUser)?.photo
          }`}
          alt="Фото"
          className="h-full w-full object-cover"
        />
      </div>
    ) : (
      <div className="h-8 w-8 rounded-full overflow-hidden mr-3 bg-gray-200 flex items-center justify-center flex-shrink-0">
        <UserCircleIcon className="h-6 w-6 text-gray-500" />
      </div>
    )}

    {/* Имя сотрудника */}
    <h3
      className="text-lg font-medium text-gray-900 line-clamp-1"
      title={assignedUser ? getDisplayName(assignedUser) : plan.title}
    >
      {assignedUser ? getDisplayName(assignedUser) : plan.title}
    </h3>
  </div>

  {hasRole(userRole, ["hr"]) && (
    <div className="flex space-x-1">
      <button
        onClick={() => handleEditPlan(plan)}
        className="text-blue-600 hover:text-blue-900 focus:outline-none p-1 hover:bg-blue-50 rounded"
        title="Редактировать план"
      >
        <PencilIcon className="h-4 w-4" />
      </button>
      <button
        onClick={() => openDeletePlanModal(plan)}
        className="text-red-600 hover:text-red-900 focus:outline-none p-1 hover:bg-red-50 rounded"
        title="Удалить план"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  )}
</div>
```

### Используемые CSS классы и компоненты

1. **Контейнеры и расположение**:

   - `flex items-center` - для горизонтального выравнивания фото и текста
   - `flex-shrink-0` - предотвращает сжатие контейнера с фото

2. **Стилизация фотографии**:

   - `h-8 w-8` - высота и ширина аватара
   - `rounded-full` - круглая форма
   - `overflow-hidden` - отсечение выступающих частей изображения
   - `border border-gray-200` - тонкая серая рамка вокруг фото

3. **Стили для изображения**:

   - `object-cover` - сохранение пропорций и заполнение контейнера

4. **Стили для заглушки**:
   - `bg-gray-200` - серый фон для заглушки
   - `flex items-center justify-center` - центрирование иконки

### Зависимости

1. **Компоненты**:

   - `UserCircleIcon` из библиотеки Heroicons
   - Функция `getDisplayName()` из `userUtils.js`
   - Функция `getApiBaseUrl()` из `config/api.js`

2. **Данные**:
   - Массив `users` с информацией о пользователях
   - Свойство `photo` в объекте пользователя

### Примечания по производительности

1. **Оптимизация поиска**:

   - Используется повторный вызов `users.find(u => u.id === assignedUser)`, что может влиять на производительность при большом количестве пользователей
   - Оптимизация: можно было бы вынести поиск пользователя в отдельную переменную перед использованием

2. **Оптимизация отрисовки**:
   - Используется условный рендеринг для выбора между фотографией и заглушкой
   - Используется классы TailwindCSS для стилизации, что минимизирует размер CSS

### Предложения по дальнейшему улучшению

1. Вынести логику поиска пользователя в переменную для устранения повторных поисковых операций
2. Рассмотреть возможность создания отдельного компонента для аватара пользователя
3. Добавить обработку ошибок для случаев, когда URL изображения недействителен

### Тестирование

Компонент был успешно протестирован в следующих сценариях:

1. Отображение карточки плана с назначенным пользователем, имеющим фото
2. Отображение карточки плана с назначенным пользователем без фото
3. Отображение карточки плана без назначенного пользователя
