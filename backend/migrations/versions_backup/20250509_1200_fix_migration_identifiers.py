"""Fix migration identifiers

Revision ID: 20250509_1200
Revises: 27c45fe8a1c4
Create Date: 2025-05-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20250509_1200'
down_revision: Union[str, None] = '27c45fe8a1c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Выполняем консолидацию всех изменений схемы, чтобы исправить проблему с миграциями
    # Добавляем отсутствующие столбцы, которые были обнаружены при проверке
    op.add_column('feedback', sa.Column('content', sa.Text(), nullable=True))
    op.add_column('feedback', sa.Column('rating', sa.String(), nullable=True))
    
    op.add_column('tasks', sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True))
    
    op.add_column('users', sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True))
    op.add_column('users', sa.Column('session_id', sa.String(), nullable=True))
    
    op.add_column('plans', sa.Column('department', sa.String(), nullable=True))
    op.add_column('plans', sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True))
    op.add_column('plans', sa.Column('created_by', sa.Integer(), nullable=True))
    op.add_column('plans', sa.Column('duration_days', sa.Integer(), nullable=True))
    op.add_column('plans', sa.Column('target_role', sa.String(), nullable=True))
    
    op.add_column('task_templates', sa.Column('created_by', sa.Integer(), nullable=True))
    
    op.add_column('analytics', sa.Column('metadata', sa.JSON(), nullable=True))
    op.add_column('analytics', sa.Column('timestamp', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True))
    
    # Добавляем индексы для оптимизации
    op.create_index(op.f('ix_users_created_at'), 'users', ['created_at'], unique=False)
    op.create_index(op.f('ix_plans_department'), 'plans', ['department'], unique=False)
    op.create_index(op.f('ix_plans_target_role'), 'plans', ['target_role'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Удаляем индексы
    op.drop_index(op.f('ix_plans_target_role'), table_name='plans')
    op.drop_index(op.f('ix_plans_department'), table_name='plans')
    op.drop_index(op.f('ix_users_created_at'), table_name='users')
    
    # Удаляем добавленные столбцы
    op.drop_column('analytics', 'timestamp')
    op.drop_column('analytics', 'metadata')
    
    op.drop_column('task_templates', 'created_by')
    
    op.drop_column('plans', 'target_role')
    op.drop_column('plans', 'duration_days')
    op.drop_column('plans', 'created_by')
    op.drop_column('plans', 'updated_at')
    op.drop_column('plans', 'department')
    
    op.drop_column('users', 'session_id')
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'created_at')
    
    op.drop_column('tasks', 'updated_at')
    
    op.drop_column('feedback', 'rating')
    op.drop_column('feedback', 'content')
