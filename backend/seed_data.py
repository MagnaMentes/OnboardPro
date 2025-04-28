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
                "role": "hr",
                "department": "HR"
            },
            {
                "email": "manager@onboardpro.com",
                "password": pwd_context.hash("test123"),
                "role": "manager",
                "department": "Engineering"
            },
            {
                "email": "employee@onboardpro.com",
                "password": pwd_context.hash("test123"),
                "role": "employee",
                "department": "Engineering"
            }
        ]

        # Проверяем, существуют ли уже пользователи с такими email
        for user_data in users:
            existing_user = db.query(User).filter(
                User.email == user_data["email"]).first()
            if existing_user:
                print(
                    f"Пользователь с email {user_data['email']} уже существует, обновляем пароль")
                existing_user.password = user_data["password"]
            else:
                print(f"Создаем нового пользователя: {user_data['email']}")
                user = User(**user_data)
                db.add(user)
        db.commit()

        # Получаем созданных пользователей для дальнейшего использования
        db_users = []
        for user_data in users:
            user = db.query(User).filter(
                User.email == user_data["email"]).first()
            if user:
                db_users.append(user)

        # Create onboarding plans
        plans = [
            {
                "role": "employee",
                "title": "New Employee Onboarding Plan"
            },
            {
                "role": "manager",
                "title": "New Manager Onboarding Plan"
            }
        ]

        # Проверка существования планов онбординга и создание только новых
        db_plans = []
        for plan_data in plans:
            existing_plan = db.query(OnboardingPlan).filter(
                OnboardingPlan.role == plan_data["role"],
                OnboardingPlan.title == plan_data["title"]
            ).first()

            if existing_plan:
                print(
                    f"План онбординга '{plan_data['title']}' для роли '{plan_data['role']}' уже существует")
                db_plans.append(existing_plan)
            else:
                print(f"Создаем новый план онбординга: {plan_data['title']}")
                plan = OnboardingPlan(**plan_data)
                db.add(plan)
                db_plans.append(plan)
        db.commit()

        # Проверяем, что есть планы онбординга для создания задач
        if not db_plans or len(db_plans) < 2:
            print("Недостаточно планов онбординга для создания задач")
            db_plans = db.query(OnboardingPlan).all()[:2]

        # Create tasks with unique constraints
        task_definitions = [
            {
                "plan_role": "employee",
                "user_role": "employee",
                "title": "Complete Company Profile",
                "description": "Fill out your company profile and upload necessary documents",
                "priority": "high",
                "days_to_deadline": 7,
                "status": "pending"
            },
            {
                "plan_role": "employee",
                "user_role": "employee",
                "title": "Meet Your Team",
                "description": "Schedule and attend team introduction meetings",
                "priority": "medium",
                "days_to_deadline": 3,
                "status": "in_progress"
            },
            {
                "plan_role": "manager",
                "user_role": "manager",
                "title": "Review Team Structure",
                "description": "Review and understand your team's structure and responsibilities",
                "priority": "high",
                "days_to_deadline": 5,
                "status": "completed"
            },
            {
                "plan_role": "employee",
                "user_role": "employee",
                "title": "Complete Training Modules",
                "description": "Complete all required training modules in the LMS",
                "priority": "high",
                "days_to_deadline": 14,
                "status": "not_started"
            },
            {
                "plan_role": "manager",
                "user_role": "manager",
                "title": "Set Up Development Environment",
                "description": "Install and configure all necessary development tools",
                "priority": "medium",
                "days_to_deadline": 2,
                "status": "in_progress"
            },
            {
                "plan_role": "employee",
                "user_role": "employee",
                "title": "First Code Review",
                "description": "Submit your first code for review",
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

        # Создаем только уникальные задачи (проверяем по плану, пользователю и названию)
        db_tasks = []
        for task_data in tasks:
            existing_task = db.query(Task).filter(
                Task.plan_id == task_data["plan_id"],
                Task.user_id == task_data["user_id"],
                Task.title == task_data["title"]
            ).first()

            if existing_task:
                print(
                    f"Задача '{task_data['title']}' для пользователя ID={task_data['user_id']} уже существует")
                db_tasks.append(existing_task)
            else:
                print(f"Создаем новую задачу: {task_data['title']}")
                task = Task(**task_data)
                db.add(task)
                db_tasks.append(task)
        db.commit()

        # Убедимся, что у нас есть задачи перед созданием обратной связи
        if not db_tasks or len(db_tasks) < 3:
            print("Недостаточно задач для создания обратной связи")
            db_tasks = db.query(Task).all()[:6]

        # Create feedback with unique constraints
        feedback_definitions = [
            {
                "sender_role": "manager",
                "recipient_role": "employee",
                "task_index": 0,
                "message": "Great job on completing your profile! Keep up the good work."
            },
            {
                "sender_role": "employee",
                "recipient_role": "manager",
                "task_index": 2,
                "message": "Thank you for the detailed team structure overview. It was very helpful!"
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
                # Проверяем существование обратной связи
                existing_feedback = db.query(Feedback).filter(
                    Feedback.sender_id == sender.id,
                    Feedback.recipient_id == recipient.id,
                    Feedback.task_id == task.id,
                    Feedback.message == feedback_def["message"]
                ).first()

                if existing_feedback:
                    print(
                        f"Обратная связь от {sender.email} к {recipient.email} для задачи ID={task.id} уже существует")
                else:
                    print(
                        f"Создаем новую обратную связь от {sender.email} к {recipient.email}")
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
                "user_role": "employee",
                "metric": "task_completion_rate",
                "value": 0.5
            },
            {
                "user_role": "manager",
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
                # Проверяем существование записи аналитики
                existing_analytics = db.query(Analytics).filter(
                    Analytics.user_id == user.id,
                    Analytics.metric == analytics_def["metric"]
                ).first()

                if existing_analytics:
                    print(
                        f"Запись аналитики '{analytics_def['metric']}' для пользователя {user.email} уже существует")
                    # Обновим значение метрики
                    existing_analytics.value = analytics_def["value"]
                else:
                    print(
                        f"Создаем новую запись аналитики: {analytics_def['metric']} для {user.email}")
                    analytics = Analytics(
                        user_id=user.id,
                        metric=analytics_def["metric"],
                        value=analytics_def["value"]
                    )
                    db.add(analytics)
        db.commit()

        print("Database seeded successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
