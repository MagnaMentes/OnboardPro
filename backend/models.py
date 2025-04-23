from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="employee")  # employee, manager, hr
    department = Column(String, nullable=True)


class OnboardingPlan(Base):
    __tablename__ = "plans"
    id = Column(Integer, primary_key=True)
    role = Column(String, nullable=False)  # employee, manager, hr
    title = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    plan_id = Column(Integer, ForeignKey("plans.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String, nullable=False)  # low, medium, high
    deadline = Column(DateTime, nullable=False)
    # pending, in_progress, completed
    status = Column(String, default="pending")
    created_at = Column(DateTime, server_default=func.now())
