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

        db_plans = []
        # Проверяем существование планов перед созданием
        for plan_data in plans:
            existing_plan = db.query(OnboardingPlan).filter(
                OnboardingPlan.role == plan_data["role"],
                OnboardingPlan.title == plan_data["title"]
            ).first()

            if existing_plan:
                print(
                    f"План '{plan_data['title']}' для роли '{plan_data['role']}' уже существует")
                db_plans.append(existing_plan)
            else:
                print(f"Создаем новый план: {plan_data['title']}")
                plan = OnboardingPlan(**plan_data)
                db.add(plan)
                db.commit()  # Сохраняем, чтобы получить ID
                db_plans.append(plan)

        # Create tasks - определение задач осталось тем же
        tasks = [
            {
                "plan_id": db_plans[0].id,
                "user_id": db_users[2].id,  # employee
                "title": "Complete Company Profile",
                "description": "Fill out your company profile and upload necessary documents",
                "priority": "high",
                "deadline": datetime.now() + timedelta(days=7),
                "status": "pending"
            },
            {
                "plan_id": db_plans[0].id,
                "user_id": db_users[2].id,
                "title": "Meet Your Team",
                "description": "Schedule and attend team introduction meetings",
                "priority": "medium",
                "deadline": datetime.now() + timedelta(days=3),
                "status": "in_progress"
            },
            {
                "plan_id": db_plans[1].id,
                "user_id": db_users[1].id,  # manager
                "title": "Review Team Structure",
                "description": "Review and understand your team's structure and responsibilities",
                "priority": "high",
                "deadline": datetime.now() + timedelta(days=5),
                "status": "completed"
            },
            {
                "plan_id": db_plans[0].id,
                "user_id": db_users[2].id,
                "title": "Complete Training Modules",
                "description": "Complete all required training modules in the LMS",
                "priority": "high",
                "deadline": datetime.now() + timedelta(days=14),
                "status": "not_started"
            },
            {
                "plan_id": db_plans[1].id,
                "user_id": db_users[1].id,
                "title": "Set Up Development Environment",
                "description": "Install and configure all necessary development tools",
                "priority": "medium",
                "deadline": datetime.now() + timedelta(days=2),
                "status": "in_progress"
            },
            {
                "plan_id": db_plans[0].id,
                "user_id": db_users[2].id,
                "title": "First Code Review",
                "description": "Submit your first code for review",
                "priority": "low",
                "deadline": datetime.now() + timedelta(days=10),
                "status": "not_started"
            }
        ]

        db_tasks = []
        # Проверяем существование задач перед созданием
        for task_data in tasks:
            existing_task = db.query(Task).filter(
                Task.plan_id == task_data["plan_id"],
                Task.user_id == task_data["user_id"],
                Task.title == task_data["title"]
            ).first()

            if existing_task:
                print(f"Задача '{task_data['title']}' уже существует")
                db_tasks.append(existing_task)
            else:
                print(f"Создаем новую задачу: {task_data['title']}")
                task = Task(**task_data)
                db.add(task)
                db.commit()  # Сохраняем, чтобы получить ID
                db_tasks.append(task)

        # Create feedback
        feedback_items = [
            {
                "sender_id": db_users[1].id,  # manager
                "recipient_id": db_users[2].id,  # employee
                "task_id": db_tasks[0].id,
                "message": "Great job on completing your profile! Keep up the good work."
            },
            {
                "sender_id": db_users[2].id,  # employee
                "recipient_id": db_users[1].id,  # manager
                "task_id": db_tasks[2].id,
                "message": "Thank you for the detailed team structure overview. It was very helpful!"
            }
        ]

        # Проверяем существование обратной связи перед созданием
        for feedback_data in feedback_items:
            existing_feedback = db.query(Feedback).filter(
                Feedback.sender_id == feedback_data["sender_id"],
                Feedback.recipient_id == feedback_data["recipient_id"],
                Feedback.task_id == feedback_data["task_id"],
                Feedback.message == feedback_data["message"]
            ).first()

            if existing_feedback:
                print(
                    f"Отзыв от ID:{feedback_data['sender_id']} к ID:{feedback_data['recipient_id']} уже существует")
            else:
                print(
                    f"Создаем новый отзыв от ID:{feedback_data['sender_id']} к ID:{feedback_data['recipient_id']}")
                feedback = Feedback(**feedback_data)
                db.add(feedback)
        db.commit()

        # Create analytics
        analytics_items = [
            {
                "user_id": db_users[2].id,
                "metric": "task_completion_rate",
                "value": 0.5
            },
            {
                "user_id": db_users[1].id,
                "metric": "feedback_count",
                "value": 2.0
            }
        ]

        # Проверяем существование аналитики перед созданием
        for analytics_data in analytics_items:
            existing_analytics = db.query(Analytics).filter(
                Analytics.user_id == analytics_data["user_id"],
                Analytics.metric == analytics_data["metric"]
            ).first()

            if existing_analytics:
                print(
                    f"Аналитика '{analytics_data['metric']}' для ID:{analytics_data['user_id']} уже существует")
                # Обновляем значение
                existing_analytics.value = analytics_data["value"]
            else:
                print(
                    f"Создаем новую аналитику '{analytics_data['metric']}' для ID:{analytics_data['user_id']}")
                analytics = Analytics(**analytics_data)
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
