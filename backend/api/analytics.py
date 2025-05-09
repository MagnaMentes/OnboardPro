from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, Dict, Any, List
import time
import hashlib
import json
from io import StringIO
import csv
from fastapi.responses import StreamingResponse

import models
import auth
from database import get_db

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# Оптимизированная система кэширования
_analytics_cache = {}
_analytics_cache_timestamp = {}
_analytics_global_version = 0  # Глобальная версия кэша
_cache_hit_count = 0  # Счетчик использования кэша
_cache_miss_count = 0  # Счетчик промахов кэша

# Настройки кэширования
CACHE_EXPIRATION_TIME = 10  # Время жизни кэша в секундах при низкой нагрузке
# Время жизни кэша в секундах при высокой нагрузке (1000+ запросов/мин)
HIGH_LOAD_CACHE_TIME = 60
REQUEST_WINDOW_TIME = 60  # Время окна для подсчета запросов (секунды)
HIGH_LOAD_THRESHOLD = 1000  # Порог запросов в минуту для определения высокой нагрузки
MAX_CACHE_ENTRIES = 1000  # Максимальное количество элементов в кэше

# Метрики и мониторинг для адаптивного кэширования
_request_timestamps = []  # Временные метки запросов для подсчета нагрузки


def generate_cache_key(endpoint: str, params: Dict[str, Any]) -> str:
    """Генерация ключа кэша на основе параметров запроса"""
    # Сортируем параметры для консистентности ключа
    sorted_params = sorted([(k, str(v))
                           for k, v in params.items() if v is not None])
    params_str = json.dumps(sorted_params)
    # Создаем хеш для получения короткого ключа
    key = hashlib.md5(f"{endpoint}:{params_str}".encode()).hexdigest()
    return key


def get_current_load() -> int:
    """Возвращает текущую нагрузку в запросах/мин"""
    global _request_timestamps
    current_time = time.time()

    # Удаляем устаревшие временные метки
    _request_timestamps = [
        ts for ts in _request_timestamps if current_time - ts < REQUEST_WINDOW_TIME]

    # Возвращаем количество запросов в текущем окне
    return len(_request_timestamps)


def register_request() -> None:
    """Регистрирует запрос для подсчета нагрузки"""
    global _request_timestamps
    _request_timestamps.append(time.time())


def get_cache_expiration_time() -> int:
    """Возвращает время жизни кэша в зависимости от нагрузки"""
    current_load = get_current_load()
    return HIGH_LOAD_CACHE_TIME if current_load >= HIGH_LOAD_THRESHOLD else CACHE_EXPIRATION_TIME


def maintain_cache_size() -> None:
    """Удаляет старые записи из кэша, если превышен максимальный размер"""
    global _analytics_cache, _analytics_cache_timestamp
    if len(_analytics_cache) > MAX_CACHE_ENTRIES:
        # Сортируем по времени последнего доступа и удаляем старые записи
        cache_items = list(_analytics_cache_timestamp.items())
        cache_items.sort(key=lambda x: x[1])  # Сортировка по времени доступа

        # Удаляем самые старые записи (30% от максимального размера)
        items_to_remove = int(MAX_CACHE_ENTRIES * 0.3)
        for i in range(items_to_remove):
            if i < len(cache_items):
                key_to_remove = cache_items[i][0]
                if key_to_remove in _analytics_cache:
                    del _analytics_cache[key_to_remove]
                if key_to_remove in _analytics_cache_timestamp:
                    del _analytics_cache_timestamp[key_to_remove]


def get_cached_analytics(cache_key: str, max_age_seconds: int = None) -> Optional[Dict[str, Any]]:
    """Получение кэшированных данных аналитики, если они не устарели"""
    global _analytics_cache, _analytics_cache_timestamp, _cache_hit_count, _cache_miss_count
    current_time = time.time()

    if cache_key in _analytics_cache and cache_key in _analytics_cache_timestamp:
        cache_age = current_time - _analytics_cache_timestamp[cache_key]
        # Используем переданный параметр max_age_seconds или вычисляем адаптивное время жизни кэша
        expiration_time = max_age_seconds if max_age_seconds is not None else get_cache_expiration_time()

        # Проверяем как возраст кэша, так и его версию
        if cache_age < expiration_time and _analytics_cache[cache_key].get("metadata", {}).get("version", 0) == _analytics_global_version:
            # Обновляем временную метку для отметки последнего использования
            _analytics_cache_timestamp[cache_key] = current_time
            _cache_hit_count += 1
            return _analytics_cache[cache_key]

    _cache_miss_count += 1
    return None


def set_analytics_cache(cache_key: str, data: Dict[str, Any]) -> None:
    """Сохранение данных аналитики в кэш с версией"""
    global _analytics_cache, _analytics_cache_timestamp

    # Проверяем и поддерживаем размер кэша
    maintain_cache_size()

    # Добавляем текущую глобальную версию к метаданным, если их еще нет
    if "metadata" not in data:
        data["metadata"] = {}

    # Обновляем метаданные
    data["metadata"]["version"] = _analytics_global_version
    data["metadata"]["cached_at"] = datetime.now().isoformat()
    data["metadata"]["cache_stats"] = {
        "hits": _cache_hit_count,
        "misses": _cache_miss_count,
        "ratio": _cache_hit_count / (_cache_hit_count + _cache_miss_count) if (_cache_hit_count + _cache_miss_count) > 0 else 0
    }
    data["metadata"]["current_load"] = get_current_load()

    # Сохраняем данные и временную метку
    _analytics_cache[cache_key] = data
    _analytics_cache_timestamp[cache_key] = time.time()


def invalidate_analytics_cache():
    """
    Инвалидирует кеш аналитики путем обновления глобальной версии.
    Эта функция должна вызываться при любых изменениях, которые могут повлиять на аналитические данные.
    """
    global _analytics_global_version
    global _analytics_cache

    # Полностью очищаем кеш вместо инкремента версии
    _analytics_cache.clear()

    # Увеличиваем глобальный счетчик версий для принудительного обновления данных
    _analytics_global_version += 1

    # Выводим лог для отладки кеширования
    print(
        f"[DEBUG] Аналитический кеш инвалидирован. Новая версия: {_analytics_global_version}")

    # Возвращаем новую версию
    return _analytics_global_version


def get_cache_stats() -> Dict[str, Any]:
    """Возвращает статистику использования кэша"""
    total_requests = _cache_hit_count + _cache_miss_count
    hit_ratio = _cache_hit_count / total_requests if total_requests > 0 else 0

    return {
        "hits": _cache_hit_count,
        "misses": _cache_miss_count,
        "total": total_requests,
        "hit_ratio": hit_ratio,
        "cache_entries": len(_analytics_cache),
        "current_version": _analytics_global_version,
        "current_load": get_current_load(),
        "high_load_threshold": HIGH_LOAD_THRESHOLD
    }


def get_cached_data(prefix: str, params: Dict[str, Any], max_age_seconds: int = None) -> Optional[Dict[str, Any]]:
    """
    Получает данные из кэша по префиксу и параметрам.
    Генерирует ключ кэша и обращается к get_cached_analytics.
    """
    key = generate_cache_key(prefix, params)
    return get_cached_analytics(key, max_age_seconds)


def cache_data(endpoint: str, params: Dict[str, Any], data: Dict[str, Any]) -> None:
    """Обертка для сохранения данных в кэш - для обратной совместимости"""
    cache_key = generate_cache_key(endpoint, params)
    set_analytics_cache(cache_key, data)


@router.get("/summary")
async def get_analytics_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    department: Optional[str] = None,
    refresh: bool = False,  # Параметр для принудительного обновления
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получение сводной аналитики для HR-дашборда с фильтрами по дате и отделу.
    Оптимизировано для высоких нагрузок (1000+ запросов/мин).
    """
    # Регистрируем запрос для мониторинга нагрузки
    register_request()

    if current_user.role.lower() != "hr":  # Изменено: проверка не зависит от регистра
        raise HTTPException(
            status_code=403, detail="Only HR can view analytics"
        )

    # Пропускаем кэш, если запрошено принудительное обновление
    if not refresh:
        # Проверяем кэш перед выполнением запроса
        cache_params = {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        }

        # Пытаемся получить данные из кэша
        cache_key = generate_cache_key("analytics_summary", cache_params)
        cached_data = get_cached_analytics(cache_key)
        if cached_data:
            # Если данные найдены в кэше и не устарели, возвращаем их
            return cached_data

    # Если кэш не найден или запрошено обновление, выполняем запрос к БД
    # Используем более эффективные запросы

    # При высокой нагрузке ограничим время выполнения запроса
    current_load = get_current_load()
    if current_load >= HIGH_LOAD_THRESHOLD and not refresh:
        # В случае высокой нагрузки возвращаем заглушку
        result = {
            "notice": "High server load detected. Please try again later or use refresh=true parameter.",
            "metadata": {
                "high_load": True,
                "requests_per_minute": current_load,
                "generated_at": datetime.now().isoformat(),
                "version": _analytics_global_version
            }
        }
        return result

    # Оптимизированные запросы к БД для аналитики
    # Базовый запрос для задач с оптимизацией
    task_query = db.query(models.Task)

    # Применяем фильтрацию по датам к задачам, если указаны
    if start_date:
        task_query = task_query.filter(models.Task.created_at >= start_date)
    if end_date:
        task_query = task_query.filter(models.Task.created_at <= end_date)

    # Фильтрация по отделу требует join с таблицей пользователей
    user_join_applied = False
    if department:
        task_query = task_query.join(models.User, models.Task.user_id == models.User.id) \
            .filter(models.User.department == department)
        user_join_applied = True

    # Получаем статистику по задачам с применёнными фильтрами
    # Оптимизируем: выполняем один запрос с агрегацией вместо нескольких
    from sqlalchemy import case

    # Оптимизированный запрос с использованием case для подсчета задач в разных статусах
    task_stats = db.query(
        func.count(models.Task.id).label('total'),
        func.sum(case((models.Task.status == 'completed', 1), else_=0)
                 ).label('completed'),
        func.sum(case((models.Task.status == 'in_progress', 1), else_=0)).label(
            'in_progress'),
        func.sum(case((models.Task.status == 'pending', 1), else_=0)
                 ).label('pending')
    )

    # Применяем те же фильтры, что и для основного запроса
    if start_date:
        task_stats = task_stats.filter(models.Task.created_at >= start_date)
    if end_date:
        task_stats = task_stats.filter(models.Task.created_at <= end_date)
    if department and not user_join_applied:
        task_stats = task_stats.join(models.User, models.Task.user_id == models.User.id) \
            .filter(models.User.department == department)

    # Выполняем запрос
    task_stats_result = task_stats.first()
    total_tasks = task_stats_result.total or 0
    completed_tasks = task_stats_result.completed or 0
    # Добавлено: получаем количество задач в процессе
    in_progress_tasks = task_stats_result.in_progress or 0
    # Добавлено: получаем количество ожидающих задач
    pending_tasks = task_stats_result.pending or 0
    completion_rate = completed_tasks / total_tasks if total_tasks > 0 else 0

    # Статистика по приоритетам задач - оптимизированный запрос
    priority_stats = {}
    for priority in ["low", "medium", "high"]:
        priority_query = task_query.filter(models.Task.priority == priority)

        # Для каждого приоритета выполняем один запрос с агрегацией
        priority_data = db.query(
            func.count(models.Task.id).label('total'),
            func.sum(case((models.Task.status == 'completed', 1), else_=0)).label(
                'completed')
        ).filter(models.Task.priority == priority)

        # Применяем те же фильтры
        if start_date:
            priority_data = priority_data.filter(
                models.Task.created_at >= start_date)
        if end_date:
            priority_data = priority_data.filter(
                models.Task.created_at <= end_date)
        if department and not user_join_applied:
            priority_data = priority_data.join(models.User, models.Task.user_id == models.User.id) \
                .filter(models.User.department == department)

        priority_result = priority_data.first()
        priority_stats[priority] = {
            "total": priority_result.total or 0,
            "completed": priority_result.completed or 0
        }

    # Статистика по отзывам с учётом фильтров
    feedback_query = db.query(func.count(models.Feedback.id))

    if start_date or end_date or department:
        feedback_query = feedback_query.join(
            models.User, models.Feedback.recipient_id == models.User.id)

    if start_date:
        feedback_query = feedback_query.filter(
            models.Feedback.created_at >= start_date)
    if end_date:
        feedback_query = feedback_query.filter(
            models.Feedback.created_at <= end_date)
    if department:
        feedback_query = feedback_query.filter(
            models.User.department == department)

    total_feedback = feedback_query.scalar() or 0

    # Средний рейтинг отзывов по пользователям
    users_count_query = db.query(func.count(models.User.id))
    if department:
        users_count_query = users_count_query.filter(
            models.User.department == department)
    users_count = users_count_query.scalar() or 0

    avg_feedback_per_user = total_feedback / users_count if users_count > 0 else 0

    # Подготавливаем результат с метаданными версионирования
    timestamp = datetime.now().isoformat()
    result = {
        "task_stats": {
            "total": total_tasks,
            "completed": completed_tasks,
            "in_progress": in_progress_tasks,  # Добавлено: задачи в процессе
            "pending": pending_tasks,  # Добавлено: ожидающие задачи
            "completion_rate": completion_rate,
            "priority": priority_stats
        },
        "feedback_stats": {
            "total": total_feedback,
            "avg_per_user": avg_feedback_per_user
        },
        "filters_applied": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        },
        "metadata": {
            "generated_at": timestamp,
            "fresh_data": True,
            "global_version": _analytics_global_version,
            "cache_stats": get_cache_stats()
        }
    }

    # Сохраняем результат в кэш только если не было запроса на обновление
    if not refresh:
        cache_params = {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        }
        cache_key = generate_cache_key("analytics_summary", cache_params)
        set_analytics_cache(cache_key, result)

    return result


@router.get("/tasks")
async def get_task_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    department: Optional[str] = None,
    export_csv: bool = False,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получение аналитики по задачам с возможностью экспорта в CSV.
    Оптимизировано для высоких нагрузок.
    """
    # Регистрируем запрос для мониторинга нагрузки
    register_request()

    if current_user.role.lower() != "hr":  # Изменено: проверка не зависит от регистра
        raise HTTPException(
            status_code=403, detail="Only HR can view task analytics"
        )

    # Для CSV экспорта мы не используем кэширование
    if not export_csv:
        # Проверяем кэш перед выполнением запроса
        cache_params = {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        }

        cache_key = generate_cache_key("analytics_tasks", cache_params)
        cached_data = get_cached_analytics(cache_key)
        if cached_data:
            # Если данные найдены в кэше, возвращаем их
            return cached_data

    # При высокой нагрузке и не-принудительном обновлении ограничиваем запрос
    current_load = get_current_load()
    if current_load >= HIGH_LOAD_THRESHOLD and not export_csv:
        # В случае высокой нагрузки возвращаем заглушку
        result = {
            "notice": "High server load detected. Please try again later or use refresh=true parameter.",
            "metadata": {
                "high_load": True,
                "requests_per_minute": current_load,
                "generated_at": datetime.now().isoformat(),
                "version": _analytics_global_version
            }
        }
        return result

    # Оптимизированный запрос с использованием joinedload для избежания проблемы N+1
    query = db.query(models.Task).options(
        joinedload(models.Task.assignee)
    )

    # Применяем фильтры
    if start_date:
        query = query.filter(models.Task.created_at >= start_date)
    if end_date:
        query = query.filter(models.Task.created_at <= end_date)
    if department:
        query = query.join(models.User, models.Task.user_id == models.User.id)\
            .filter(models.User.department == department)

    # Лимитируем количество результатов для предотвращения перегрузок
    MAX_TASKS_IN_RESPONSE = 500

    # Для экспорта CSV убираем лимит, иначе применяем
    if not export_csv:
        query = query.limit(MAX_TASKS_IN_RESPONSE)

    # Получаем все задачи одним запросом (избегаем N+1 проблему)
    tasks = query.all()

    # Подготавливаем данные для ответа или экспорта
    tasks_data = []
    for task in tasks:
        # Используем уже загруженную связь с assignee (нет дополнительных запросов)
        assignee = task.assignee
        task_data = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "priority": task.priority,
            "status": task.status,
            "deadline": task.deadline.isoformat() if task.deadline else None,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "assignee_id": task.user_id,
            "assignee_name": f"{assignee.first_name} {assignee.last_name}" if assignee and assignee.first_name and assignee.last_name else assignee.email if assignee else "Не назначен",
            "department": assignee.department if assignee else "Неизвестно",
            "plan_id": task.plan_id
        }
        tasks_data.append(task_data)

    # Экспорт в CSV если запрошено
    if export_csv and tasks_data:
        output = StringIO()
        writer = csv.DictWriter(
            output, fieldnames=tasks_data[0].keys() if tasks_data else []
        )
        writer.writeheader()
        writer.writerows(tasks_data)

        response = StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv"
        )
        response.headers[
            "Content-Disposition"] = f"attachment; filename=tasks_analytics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return response

    # Дополнительная аналитика для JSON-ответа
    total_tasks = len(tasks_data)
    completed_tasks = sum(
        1 for task in tasks_data if task["status"] == "completed"
    )

    # Статистика по приоритетам
    priority_counts = {"low": 0, "medium": 0, "high": 0}
    for task in tasks_data:
        if task["priority"] in priority_counts:
            priority_counts[task["priority"]] += 1

    # Статистика по отделам
    department_stats = {}
    for task in tasks_data:
        dept = task["department"]
        if dept not in department_stats:
            department_stats[dept] = {"total": 0, "completed": 0}

        department_stats[dept]["total"] += 1
        if task["status"] == "completed":
            department_stats[dept]["completed"] += 1

    # Рассчитываем процент выполнения для каждого отдела
    for dept in department_stats:
        total = department_stats[dept]["total"]
        completed = department_stats[dept]["completed"]
        department_stats[dept]["completion_rate"] = completed / \
            total if total > 0 else 0

    # Подготавливаем результат с метаданными
    timestamp = datetime.now().isoformat()
    result = {
        "tasks": tasks_data,
        "summary": {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": completed_tasks / total_tasks if total_tasks > 0 else 0,
            "priority_distribution": priority_counts,
            "department_stats": department_stats
        },
        "filters_applied": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        },
        "metadata": {
            "generated_at": timestamp,
            "version": _analytics_global_version,
            "truncated": len(tasks) > MAX_TASKS_IN_RESPONSE,
            "cache_stats": get_cache_stats()
        }
    }

    # Сохраняем результат в кэш (только JSON, не CSV)
    if not export_csv:
        cache_params = {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        }
        cache_key = generate_cache_key("analytics_tasks", cache_params)
        set_analytics_cache(cache_key, result)

    return result


@router.get("/users")
async def get_user_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    department: Optional[str] = None,
    export_csv: bool = False,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получение аналитики по пользователям с возможностью экспорта в CSV.
    Оптимизировано для высоких нагрузок.
    """
    # Регистрируем запрос для мониторинга нагрузки
    register_request()

    if current_user.role.lower() != "hr":  # Изменено: проверка не зависит от регистра
        raise HTTPException(
            status_code=403, detail="Only HR can view user analytics"
        )

    # Проверяем кэш перед выполнением запроса (кроме экспорта в CSV)
    if not export_csv:
        cache_params = {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        }
        cache_key = generate_cache_key("analytics_users", cache_params)
        cached_data = get_cached_analytics(cache_key)
        if cached_data:
            return cached_data

    # При высокой нагрузке и не-принудительном обновлении ограничиваем запрос
    current_load = get_current_load()
    if current_load >= HIGH_LOAD_THRESHOLD and not export_csv:
        # В случае высокой нагрузки возвращаем заглушку
        result = {
            "notice": "High server load detected. Please try again later or use export_csv=true parameter.",
            "metadata": {
                "high_load": True,
                "requests_per_minute": current_load,
                "generated_at": datetime.now().isoformat(),
                "version": _analytics_global_version
            }
        }
        return result

    # Оптимизируем запросы для пользователей и их задач
    # Используем подзапросы и агрегацию для снижения нагрузки на БД

    # Базовый запрос пользователей с фильтрами и оптимизацией
    users_query = db.query(models.User)

    # Применяем фильтр по отделу, если указан
    if department:
        users_query = users_query.filter(models.User.department == department)

    # Получаем всех пользователей
    users = users_query.all()
    users_data = []

    # Собираем ID пользователей для оптимизированного запроса задач
    user_ids = [user.id for user in users]

    # Оптимизируем: получаем статистику задач одним запросом для всех пользователей
    from sqlalchemy import and_, select

    # Подготавливаем базовые фильтры для задач
    task_filters = []
    if start_date:
        task_filters.append(models.Task.created_at >= start_date)
    if end_date:
        task_filters.append(models.Task.created_at <= end_date)

    # Получаем статистику задач по пользователям одним запросом
    task_stats = {}
    if user_ids:
        # Создаем подзапрос для агрегации задач по пользователям
        task_subquery = select([
            models.Task.user_id,
            func.count(models.Task.id).label('total_tasks'),
            func.sum(case((models.Task.status == 'completed', 1), else_=0)).label(
                'completed_tasks'),
            func.min(models.Task.created_at).label('earliest_task'),
            func.max(case((models.Task.status == 'completed', models.Task.created_at), else_=None)).label(
                'latest_completed')
        ]).where(models.Task.user_id.in_(user_ids))

        # Добавляем фильтры по датам, если указаны
        if task_filters:
            task_subquery = task_subquery.where(and_(*task_filters))

        # Группируем по user_id
        task_subquery = task_subquery.group_by(models.Task.user_id)

        # Выполняем запрос и преобразуем результаты в словарь
        task_stats_results = db.execute(task_subquery).fetchall()
        task_stats = {
            row.user_id: {
                'total_tasks': row.total_tasks,
                'completed_tasks': row.completed_tasks,
                'earliest_task': row.earliest_task,
                'latest_completed': row.latest_completed
            } for row in task_stats_results
        }

    # Формируем данные пользователей с интеграцией статистики задач
    for user in users:
        user_id = user.id
        user_task_stats = task_stats.get(user_id, {
            'total_tasks': 0,
            'completed_tasks': 0,
            'earliest_task': None,
            'latest_completed': None
        })

        # Расчет времени онбординга
        onboarding_time = None
        if user_task_stats['completed_tasks'] > 0 and user_task_stats['total_tasks'] > 0:
            earliest_task = user_task_stats['earliest_task']
            latest_completed = user_task_stats['latest_completed']

            if earliest_task and latest_completed:
                # Расчет времени в днях
                delta = latest_completed - earliest_task
                onboarding_time = delta.days if delta.days >= 0 else None

        # Рассчитываем процент выполнения задач
        tasks_total = user_task_stats['total_tasks']
        tasks_completed = user_task_stats['completed_tasks']
        task_completion_rate = tasks_completed / tasks_total if tasks_total > 0 else 0

        user_data = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "department": user.department,
            "role": user.role,
            "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None,
            "tasks_total": tasks_total,
            "tasks_completed": tasks_completed,
            "task_completion_rate": task_completion_rate,
            "onboarding_time": onboarding_time
        }
        users_data.append(user_data)

    # Для экспорта в CSV
    if export_csv and users_data:
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=users_data[0].keys())
        writer.writeheader()
        writer.writerows(users_data)

        response = StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv"
        )
        response.headers[
            "Content-Disposition"] = f"attachment; filename=users_analytics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return response

    # Статистика по отделам (оптимизированная версия)
    departments = {}
    for user in users_data:
        dept = user["department"] or "Не указан"
        if dept not in departments:
            departments[dept] = {
                "count": 0,
                "completed_tasks": 0,
                "total_tasks": 0
            }
        departments[dept]["count"] += 1
        departments[dept]["completed_tasks"] += user["tasks_completed"]
        departments[dept]["total_tasks"] += user["tasks_total"]

    # Расчет среднего времени онбординга
    users_with_onboarding = [
        user for user in users_data if user["onboarding_time"] is not None
    ]
    avg_onboarding_time = sum(user["onboarding_time"] for user in users_with_onboarding) / \
        len(users_with_onboarding) if users_with_onboarding else 0

    # Формируем результат
    result = {
        "users": users_data,
        "summary": {
            "total_users": len(users_data),
            "avg_onboarding_time": avg_onboarding_time,
            "departments": departments
        },
        "filters_applied": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        },
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "version": _analytics_global_version,
            "cache_stats": get_cache_stats()
        }
    }

    # Сохраняем в кэш только для не-CSV запросов
    if not export_csv:
        cache_params = {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        }
        cache_key = generate_cache_key("analytics_users", cache_params)
        set_analytics_cache(cache_key, result)

    return result


@router.get("/cache-stats")
async def get_analytics_cache_statistics(
    current_user: models.User = Depends(auth.get_current_user)
):
    """Получение статистики использования кэша для мониторинга"""
    if current_user.role.lower() != "hr":  # Изменено: проверка не зависит от регистра
        raise HTTPException(
            status_code=403, detail="Only HR can view cache statistics"
        )

    # Регистрируем запрос для мониторинга нагрузки
    register_request()

    return {
        "cache_stats": get_cache_stats(),
        "cache_settings": {
            "normal_expiration_time": CACHE_EXPIRATION_TIME,
            "high_load_expiration_time": HIGH_LOAD_CACHE_TIME,
            "high_load_threshold": HIGH_LOAD_THRESHOLD,
            "max_cache_entries": MAX_CACHE_ENTRIES
        },
        "current_timestamp": datetime.now().isoformat()
    }


@router.post("/invalidate-cache")
async def invalidate_cache(
    current_user: models.User = Depends(auth.get_current_user)
):
    """Принудительная инвалидация кэша аналитики"""
    if current_user.role.lower() != "hr":  # Изменено: проверка не зависит от регистра
        raise HTTPException(
            status_code=403, detail="Only HR can invalidate cache"
        )

    invalidate_analytics_cache()
    return {
        "message": "Analytics cache invalidated",
        "new_version": _analytics_global_version,
        "timestamp": datetime.now().isoformat()
    }

# Экспортируем функции для использования в других модулях
__all__ = [
    "generate_cache_key",
    "get_cached_analytics",
    "set_analytics_cache",
    "invalidate_analytics_cache",
    "cache_data",
    "get_cached_data",
    "_analytics_global_version"
]
