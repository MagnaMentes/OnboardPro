from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Отношение к менеджеру отдела
    manager = relationship("User", foreign_keys=[
                           manager_id], backref="managed_department")


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
    # Добавлен индекс для поля department
    department = Column(String, nullable=True, index=True)
    # Внешний ключ для связи с таблицей departments
    department_id = Column(Integer, ForeignKey(
        "departments.id"), nullable=True)
    telegram_id = Column(String, nullable=True)
    # Флаг для блокировки пользователя
    disabled = Column(Boolean, default=False)
    # Путь к фотографии пользователя
    photo = Column(String, nullable=True)

    # Отношение к отделу
    department_rel = relationship("Department", foreign_keys=[
                                  department_id], backref="members")

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


class TaskTemplate(Base):
    __tablename__ = "task_templates"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String, nullable=False, index=True)  # low, medium, high
    duration_days = Column(Integer, nullable=False)
    # роль, для которой предназначен шаблон
    role = Column(String, nullable=False, index=True)
    # отдел, для которого предназначен шаблон
    department = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(),
                        onupdate=func.now())

    tasks = relationship("Task", back_populates="template")

    # Создаем композитный индекс по role и department для быстрой фильтрации
    __table_args__ = (
        Index('ix_task_templates_role_department', 'role', 'department'),
    )


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    # Отдельный индекс для plan_id
    plan_id = Column(Integer, ForeignKey("plans.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    template_id = Column(Integer, ForeignKey(
        "task_templates.id"), nullable=True, index=True)
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
    template = relationship(
        "TaskTemplate", back_populates="tasks", lazy="joined")

    # Добавляем составной индекс для оптимизации запросов по плану, статусу и дедлайну
    __table_args__ = (
        Index('ix_tasks_plan_status_deadline',
              'plan_id', 'status', 'deadline'),
    )


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
