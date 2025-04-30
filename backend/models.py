from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)  # Имя
    last_name = Column(String, nullable=True)   # Фамилия
    middle_name = Column(String, nullable=True)  # Отчество
    phone = Column(String, nullable=True)       # Номер телефона
    role = Column(String, default="employee")  # employee, manager, hr
    department = Column(String, nullable=True)
    telegram_id = Column(String, nullable=True)
    # Флаг для блокировки пользователя
    disabled = Column(Boolean, default=False)
    # Путь к фотографии пользователя
    photo = Column(String, nullable=True)

    tasks = relationship("Task", back_populates="assignee")
    sent_feedback = relationship("Feedback",
                                 back_populates="sender",
                                 foreign_keys="[Feedback.sender_id]")
    received_feedback = relationship("Feedback",
                                     back_populates="recipient",
                                     foreign_keys="[Feedback.recipient_id]")


class OnboardingPlan(Base):
    __tablename__ = "plans"
    id = Column(Integer, primary_key=True)
    role = Column(String, nullable=False)  # employee, manager, hr
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)  # Добавляем описание плана
    created_at = Column(DateTime, server_default=func.now())


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    plan_id = Column(Integer, ForeignKey("plans.id"))
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String, nullable=False, index=True)
    deadline = Column(DateTime, nullable=False, index=True)
    # pending, in_progress, completed, blocked
    status = Column(String, default="pending", index=True)
    created_at = Column(DateTime, server_default=func.now())

    # Используем lazy="joined" для автоматической загрузки связанного пользователя
    # при запросе задач, что решает проблему N+1
    assignee = relationship("User", back_populates="tasks", lazy="joined")


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    sender = relationship(
        "User", back_populates="sent_feedback", foreign_keys=[sender_id])
    recipient = relationship(
        "User", back_populates="received_feedback", foreign_keys=[recipient_id])


class Analytics(Base):
    __tablename__ = "analytics"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    # e.g., task_completion_rate, feedback_count
    metric = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    recorded_at = Column(DateTime, server_default=func.now())
