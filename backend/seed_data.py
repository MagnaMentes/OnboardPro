from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import User, OnboardingPlan, Task, Feedback, Analytics
from auth import pwd_context
from database import SessionLocal


def seed_database():
    db = SessionLocal()
    try:
        # Create test users
        users = [
            {
                "email": "hr@onboardpro.com",
                "password": pwd_context.hash("test123"),
                "role": "HR",
                "department": "HR",
                "first_name": "Марина",
                "last_name": "Швидченко",
                "middle_name": "",
                "phone": "+380 50 123 45 67",
                "disabled": False
            },
            {
                "email": "manager@onboardpro.com",
                "password": pwd_context.hash("test123"),
                "role": "Manager",
                "department": "Коммерческий отдел",
                "first_name": "Ирина",
                "last_name": "Червона",
                "middle_name": "",
                "phone": "+380 67 234 56 78",
                "disabled": False
            },
            {
                "email": "employee@onboardpro.com",
                "password": pwd_context.hash("test123"),
                "role": "Employee",
                "department": "Коммерческий отдел",
                "first_name": "Ганна",
                "last_name": "Нечипуренко",
                "middle_name": "",
                "phone": "+380 73 345 67 89",
                "disabled": False
            }
        ]

        # Сначала очищаем все существующие данные
        print("Удаление существующих данных...")
        db.query(Feedback).delete()
        db.query(Analytics).delete()
        db.query(Task).delete()
        db.query(OnboardingPlan).delete()
        db.query(User).delete()
        db.commit()
        print("Все существующие данные удалены")

        # Создаем новых пользователей
        db_users = []
        for user_data in users:
            print(
                f"Создаем пользователя: {user_data['last_name']} {user_data['first_name']} ({user_data['role']})")
            user = User(**user_data)
            db.add(user)
            db_users.append(user)
        db.commit()

        # Create onboarding plans
        plans = [
            {
                "role": "Employee",
                "title": "План онбординга для новых сотрудников"
            },
            {
                "role": "Manager",
                "title": "План онбординга для руководителей"
            }
        ]

        # Создаем планы онбординга
        db_plans = []
        for plan_data in plans:
            print(f"Создаем план онбординга: {plan_data['title']}")
            plan = OnboardingPlan(**plan_data)
            db.add(plan)
            db_plans.append(plan)
        db.commit()

        # Create tasks with unique constraints
        task_definitions = [
            {
                "plan_role": "Employee",
                "user_role": "Employee",
                "title": "Заполнить профиль компании",
                "description": "Заполните свой профиль компании и загрузите необходимые документы",
                "priority": "high",
                "days_to_deadline": 7,
                "status": "pending"
            },
            {
                "plan_role": "Employee",
                "user_role": "Employee",
                "title": "Познакомиться с командой",
                "description": "Запланировать и провести встречи-знакомства с командой",
                "priority": "medium",
                "days_to_deadline": 3,
                "status": "in_progress"
            },
            {
                "plan_role": "Manager",
                "user_role": "Manager",
                "title": "Ознакомиться со структурой команды",
                "description": "Изучить структуру команды и обязанности сотрудников",
                "priority": "high",
                "days_to_deadline": 5,
                "status": "completed"
            },
            {
                "plan_role": "Employee",
                "user_role": "Employee",
                "title": "Пройти обучающие модули",
                "description": "Завершить все необходимые модули обучения в системе LMS",
                "priority": "high",
                "days_to_deadline": 14,
                "status": "not_started"
            },
            {
                "plan_role": "Manager",
                "user_role": "Manager",
                "title": "Настроить среду разработки",
                "description": "Установить и настроить все необходимые инструменты разработки",
                "priority": "medium",
                "days_to_deadline": 2,
                "status": "in_progress"
            },
            {
                "plan_role": "Employee",
                "user_role": "Employee",
                "title": "Первый код-ревью",
                "description": "Отправить первый код на рецензию",
                "priority": "low",
                "days_to_deadline": 10,
                "status": "not_started"
            }
        ]

        # Преобразование определений задач в конкретные объекты с ID
        tasks = []
        for task_def in task_definitions:
            # Найдем план с соответствующей ролью
            plan = next((p for p in db_plans if p.role ==
                        task_def["plan_role"]), None)

            # Найдем пользователя с соответствующей ролью
            user = next((u for u in db_users if u.role ==
                        task_def["user_role"]), None)

            if plan and user:
                tasks.append({
                    "plan_id": plan.id,
                    "user_id": user.id,
                    "title": task_def["title"],
                    "description": task_def["description"],
                    "priority": task_def["priority"],
                    "deadline": datetime.now() + timedelta(days=task_def["days_to_deadline"]),
                    "status": task_def["status"]
                })

        # Создаем задачи
        db_tasks = []
        for task_data in tasks:
            print(f"Создаем задачу: {task_data['title']}")
            task = Task(**task_data)
            db.add(task)
            db_tasks.append(task)
        db.commit()

        # Create feedback with unique constraints
        feedback_definitions = [
            {
                "sender_role": "Manager",
                "recipient_role": "Employee",
                "task_index": 0,
                "message": "Отлично справились с заполнением профиля! Продолжайте в том же духе."
            },
            {
                "sender_role": "Employee",
                "recipient_role": "Manager",
                "task_index": 2,
                "message": "Спасибо за подробное описание структуры команды. Это было очень полезно!"
            }
        ]

        # Преобразуем определения в конкретные объекты с ID
        for feedback_def in feedback_definitions:
            # Находим отправителя и получателя по ролям
            sender = next((u for u in db_users if u.role ==
                          feedback_def["sender_role"]), None)
            recipient = next((u for u in db_users if u.role ==
                             feedback_def["recipient_role"]), None)

            task_index = min(feedback_def["task_index"], len(db_tasks) - 1)
            task = db_tasks[task_index] if task_index >= 0 else None

            if sender and recipient and task:
                print(
                    f"Создаем обратную связь от {sender.email} к {recipient.email}")
                feedback = Feedback(
                    sender_id=sender.id,
                    recipient_id=recipient.id,
                    task_id=task.id,
                    message=feedback_def["message"]
                )
                db.add(feedback)
        db.commit()

        # Create analytics with unique constraints
        analytics_definitions = [
            {
                "user_role": "Employee",
                "metric": "task_completion_rate",
                "value": 0.5
            },
            {
                "user_role": "Manager",
                "metric": "feedback_count",
                "value": 2.0
            }
        ]

        # Преобразуем определения в конкретные объекты с ID
        for analytics_def in analytics_definitions:
            # Находим пользователя по роли
            user = next((u for u in db_users if u.role ==
                        analytics_def["user_role"]), None)

            if user:
                print(
                    f"Создаем запись аналитики: {analytics_def['metric']} для {user.email}")
                analytics = Analytics(
                    user_id=user.id,
                    metric=analytics_def["metric"],
                    value=analytics_def["value"]
                )
                db.add(analytics)
        db.commit()

        print("База данных успешно заполнена!")

    except Exception as e:
        print(f"Ошибка при заполнении базы данных: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
