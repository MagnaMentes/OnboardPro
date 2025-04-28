from sqlalchemy import func
from database import SessionLocal
from models import OnboardingPlan, Task, Feedback, Analytics


def remove_duplicates():
    """
    Скрипт для удаления дублирующихся записей из базы данных.
    Сохраняет только самую раннюю запись из каждого набора дубликатов.
    """
    db = SessionLocal()
    try:
        print("Начинаем очистку дублирующихся данных...")

        # Очистка планов онбординга
        print("\nОчистка дублирующихся планов онбординга:")
        # Находим все планы онбординга с одинаковыми ролью и названием
        duplicate_plans = db.query(OnboardingPlan.role, OnboardingPlan.title, func.count(OnboardingPlan.id))\
            .group_by(OnboardingPlan.role, OnboardingPlan.title)\
            .having(func.count(OnboardingPlan.id) > 1)\
            .all()

        plans_deleted = 0
        for role, title, count in duplicate_plans:
            print(
                f"Найдено {count} дубликатов плана '{title}' для роли '{role}'")
            # Получаем все дубликаты, отсортированные по ID (сохраняем самый первый)
            duplicate_entries = db.query(OnboardingPlan)\
                .filter(OnboardingPlan.role == role, OnboardingPlan.title == title)\
                .order_by(OnboardingPlan.id)\
                .all()

            # Оставляем первую запись, удаляем остальные
            for entry in duplicate_entries[1:]:
                # Проверяем, есть ли задачи, связанные с этим планом
                linked_tasks = db.query(Task).filter(
                    Task.plan_id == entry.id).all()

                # Обновляем задачи, ссылающиеся на удаляемый план, на первый план
                for task in linked_tasks:
                    task.plan_id = duplicate_entries[0].id

                # Удаляем дублирующийся план
                db.delete(entry)
                plans_deleted += 1

        print(f"Удалено дублирующихся планов: {plans_deleted}")
        db.commit()

        # Очистка задач
        print("\nОчистка дублирующихся задач:")
        # Находим все задачи с одинаковыми план_id, user_id и названием
        duplicate_tasks = db.query(Task.plan_id, Task.user_id, Task.title, func.count(Task.id))\
            .group_by(Task.plan_id, Task.user_id, Task.title)\
            .having(func.count(Task.id) > 1)\
            .all()

        tasks_deleted = 0
        for plan_id, user_id, title, count in duplicate_tasks:
            print(
                f"Найдено {count} дубликатов задачи '{title}' для плана ID={plan_id} и пользователя ID={user_id}")
            # Получаем все дубликаты, отсортированные по ID (сохраняем самый первый)
            duplicate_entries = db.query(Task)\
                .filter(Task.plan_id == plan_id, Task.user_id == user_id, Task.title == title)\
                .order_by(Task.id)\
                .all()

            # Оставляем первую запись, удаляем остальные
            for entry in duplicate_entries[1:]:
                # Проверяем, есть ли отзывы, связанные с этой задачей
                linked_feedback = db.query(Feedback).filter(
                    Feedback.task_id == entry.id).all()

                # Обновляем отзывы, ссылающиеся на удаляемую задачу, на первую задачу
                for feedback in linked_feedback:
                    feedback.task_id = duplicate_entries[0].id

                # Удаляем дублирующуюся задачу
                db.delete(entry)
                tasks_deleted += 1

        print(f"Удалено дублирующихся задач: {tasks_deleted}")
        db.commit()

        # Очистка отзывов
        print("\nОчистка дублирующихся отзывов:")
        # Находим все отзывы с одинаковыми sender_id, recipient_id, task_id и сообщением
        duplicate_feedback = db.query(Feedback.sender_id, Feedback.recipient_id, Feedback.task_id, Feedback.message, func.count(Feedback.id))\
            .group_by(Feedback.sender_id, Feedback.recipient_id, Feedback.task_id, Feedback.message)\
            .having(func.count(Feedback.id) > 1)\
            .all()

        feedback_deleted = 0
        for sender_id, recipient_id, task_id, message, count in duplicate_feedback:
            print(
                f"Найдено {count} дубликатов отзыва от ID={sender_id} к ID={recipient_id} для задачи ID={task_id}")
            # Получаем все дубликаты, отсортированные по ID (сохраняем самый первый)
            duplicate_entries = db.query(Feedback)\
                .filter(Feedback.sender_id == sender_id, Feedback.recipient_id == recipient_id,
                        Feedback.task_id == task_id, Feedback.message == message)\
                .order_by(Feedback.id)\
                .all()

            # Оставляем первую запись, удаляем остальные
            for entry in duplicate_entries[1:]:
                db.delete(entry)
                feedback_deleted += 1

        print(f"Удалено дублирующихся отзывов: {feedback_deleted}")
        db.commit()

        # Очистка аналитики
        print("\nОчистка дублирующихся записей аналитики:")
        # Находим все записи аналитики с одинаковыми user_id и метрикой
        duplicate_analytics = db.query(Analytics.user_id, Analytics.metric, func.count(Analytics.id))\
            .group_by(Analytics.user_id, Analytics.metric)\
            .having(func.count(Analytics.id) > 1)\
            .all()

        analytics_deleted = 0
        for user_id, metric, count in duplicate_analytics:
            print(
                f"Найдено {count} дубликатов метрики '{metric}' для пользователя ID={user_id}")
            # Получаем все дубликаты, отсортированные по ID (сохраняем самый первый)
            duplicate_entries = db.query(Analytics)\
                .filter(Analytics.user_id == user_id, Analytics.metric == metric)\
                .order_by(Analytics.id)\
                .all()

            # Оставляем первую запись, удаляем остальные
            for entry in duplicate_entries[1:]:
                db.delete(entry)
                analytics_deleted += 1

        print(f"Удалено дублирующихся записей аналитики: {analytics_deleted}")
        db.commit()

        print("\nОчистка дублирующихся данных завершена успешно!")
        print(
            f"Итого удалено записей: {plans_deleted + tasks_deleted + feedback_deleted + analytics_deleted}")

    except Exception as e:
        print(f"Произошла ошибка при удалении дубликатов: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    remove_duplicates()
