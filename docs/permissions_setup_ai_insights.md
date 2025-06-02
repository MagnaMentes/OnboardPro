# Настройка прав доступа к API-эндпоинтам Smart Insights Hub

## Обзор

В рамках Sprint 0.30 разработана система персонализированных AI-рекомендаций и Smart Insights Hub. Для обеспечения безопасности и разграничения доступа к API-эндпоинтам необходимо настроить соответствующие права доступа.

## Модель прав

Система разграничения доступа к API-эндпоинтам Smart Insights Hub основана на следующих принципах:

1. **Роли пользователей**:

   - **HR/Admin**: полный доступ ко всем инсайтам и рекомендациям
   - **Руководитель**: доступ к инсайтам и рекомендациям своего отдела
   - **Ментор**: доступ к инсайтам и рекомендациям курируемых сотрудников
   - **Сотрудник**: доступ только к своим инсайтам и рекомендациям

2. **Уровни прав**:
   - **Чтение**: просмотр инсайтов и рекомендаций
   - **Изменение статуса**: принятие, отклонение, маркировка "в работе" и т.д.
   - **Создание**: генерация новых инсайтов и рекомендаций
   - **Администрирование**: настройка системы, управление тегами

## Настройка прав доступа в Django

### 1. Определение прав на уровне модели

В файле `backend/ai_insights/models.py` добавить определения прав для моделей:

```python
class Meta:
    permissions = [
        ("view_all_insights", "Can view all insights in the system"),
        ("manage_insights", "Can manage insights status"),
        ("generate_insights", "Can trigger insights generation"),
        ("view_department_insights", "Can view insights for department"),
        ("view_mentee_insights", "Can view insights for mentees"),
    ]
```

### 2. Настройка DRF Permissions

В файле `backend/ai_insights/permissions.py` определить классы прав:

```python
from rest_framework import permissions

class HasInsightAccess(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user

        # HR/Admin имеет полный доступ
        if user.is_staff or user.role in ['admin', 'hr']:
            return True

        # Руководители имеют доступ к инсайтам своего отдела
        if user.role == 'manager' and user.department == obj.department:
            return True

        # Менторы имеют доступ к инсайтам подопечных
        if user.role == 'mentor' and obj.user in user.mentees.all():
            return True

        # Сотрудники имеют доступ только к своим инсайтам
        return obj.user == user
```

### 3. Применение прав в представлениях

В файле `backend/ai_insights/views_v2.py` применить настройки прав:

```python
from .permissions import HasInsightAccess

class SmartInsightViewSet(viewsets.ModelViewSet):
    serializer_class = SmartInsightSerializer
    permission_classes = [IsAuthenticated, HasInsightAccess]

    def get_queryset(self):
        user = self.request.user

        # HR/Admin видит все инсайты
        if user.is_staff or user.role in ['admin', 'hr']:
            return SmartInsight.objects.all()

        # Руководители видят инсайты своего отдела
        if user.role == 'manager' and user.department:
            return SmartInsight.objects.filter(department=user.department)

        # Менторы видят инсайты своих подопечных
        if user.role == 'mentor':
            mentee_ids = user.mentees.values_list('id', flat=True)
            return SmartInsight.objects.filter(user_id__in=mentee_ids)

        # Сотрудники видят только свои инсайты
        return SmartInsight.objects.filter(user=user)
```

### 4. Декораторы для действий

Для специфических действий с инсайтами и рекомендациями:

```python
@action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, HasInsightManagePermission])
def resolve(self, request, pk=None):
    insight = self.get_object()
    insight.status = InsightStatus.RESOLVED
    insight.resolved_at = timezone.now()
    insight.save()
    return Response(self.get_serializer(insight).data)
```

## Настройка прав доступа на фронтенде

### 1. Проверка прав на уровне маршрутизации

В файле `frontend/src/App.tsx` добавить проверки прав доступа для маршрутов:

```typescript
{
  /* маршруты Smart Insights Hub (только для HR и администраторов) */
}
<Route
  path="/admin/ai/hub"
  element={
    <ProtectedRouteWithRole
      roles={["admin", "hr"]}
      element={<SmartInsightsHub />}
      redirectTo="/dashboard"
    />
  }
/>;
```

### 2. Проверка прав в компонентах

В компонентах UI реализовать проверку прав для отображения элементов управления:

```typescript
const canManageInsights = usePermissions(["manage_insights"]);

return (
  <>{canManageInsights && <Button onClick={handleResolve}>Разрешить</Button>}</>
);
```

### 3. Компонент проверки прав доступа

```typescript
export const PermissionGuard = ({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) => {
  const hasPermission = usePermissions([permission]);

  if (!hasPermission) {
    return null;
  }

  return <>{children}</>;
};
```

## Матрица прав доступа

| Действие                     | HR/Admin | Руководитель | Ментор | Сотрудник |
| ---------------------------- | -------- | ------------ | ------ | --------- |
| Просмотр всех инсайтов       | ✅       | ❌           | ❌     | ❌        |
| Просмотр инсайтов отдела     | ✅       | ✅           | ❌     | ❌        |
| Просмотр инсайтов подопечных | ✅       | ✅           | ✅     | ❌        |
| Просмотр своих инсайтов      | ✅       | ✅           | ✅     | ✅        |
| Изменение статуса инсайтов   | ✅       | ✅\*         | ✅\*   | ❌        |
| Генерация рекомендаций       | ✅       | ✅\*         | ❌     | ❌        |
| Управление тегами            | ✅       | ❌           | ❌     | ❌        |

\* - только для инсайтов, к которым есть доступ

## План реализации

1. Добавить модель прав в `models.py`
2. Создать файл `permissions.py` с классами разрешений
3. Обновить представления в `views_v2.py`
4. Создать сервис проверки прав на фронтенде
5. Добавить проверки прав в маршрутизатор
6. Обновить компоненты UI с учетом прав доступа
