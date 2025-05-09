"""add_task_templates_table

Revision ID: 27c45fe8a1c4
Revises: 20250428_1200_add_photo_column_
Create Date: 2025-05-02 10:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '27c45fe8a1c4'
down_revision = '20250428_1200_add_photo_column_'
branch_labels = None
depends_on = None


def upgrade():
    # Создание таблицы шаблонов задач
    op.create_table('task_templates',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('title', sa.String(), nullable=False),
                    sa.Column('description', sa.Text(), nullable=True),
                    sa.Column('priority', sa.String(), nullable=False),
                    sa.Column('duration_days', sa.Integer(), nullable=False),
                    sa.Column('role', sa.String(), nullable=False),
                    sa.Column('department', sa.String(), nullable=True),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text(
                        '(CURRENT_TIMESTAMP)'), nullable=True),
                    sa.Column('updated_at', sa.DateTime(), server_default=sa.text(
                        '(CURRENT_TIMESTAMP)'), nullable=True),
                    sa.PrimaryKeyConstraint('id')
                    )

    # Создание индексов для оптимизации поиска
    op.create_index(op.f('ix_task_templates_priority'),
                    'task_templates', ['priority'], unique=False)
    op.create_index(op.f('ix_task_templates_role'),
                    'task_templates', ['role'], unique=False)
    op.create_index(op.f('ix_task_templates_department'),
                    'task_templates', ['department'], unique=False)

    # Добавление поля template_id в таблицу tasks
    op.add_column('tasks',
                  sa.Column('template_id', sa.Integer(), nullable=True)
                  )

    # Создание внешнего ключа
    op.create_foreign_key(
        'fk_tasks_template_id_task_templates',
        'tasks', 'task_templates',
        ['template_id'], ['id']
    )

    # Добавление индекса для поля template_id
    op.create_index(op.f('ix_tasks_template_id'), 'tasks',
                    ['template_id'], unique=False)


def downgrade():
    # Удаление индекса template_id в таблице tasks
    op.drop_index(op.f('ix_tasks_template_id'), table_name='tasks')

    # Удаление внешнего ключа
    op.drop_constraint('fk_tasks_template_id_task_templates',
                       'tasks', type_='foreignkey')

    # Удаление колонки template_id из таблицы tasks
    op.drop_column('tasks', 'template_id')

    # Удаление индексов
    op.drop_index(op.f('ix_task_templates_department'),
                  table_name='task_templates')
    op.drop_index(op.f('ix_task_templates_role'), table_name='task_templates')
    op.drop_index(op.f('ix_task_templates_priority'),
                  table_name='task_templates')

    # Удаление таблицы task_templates
    op.drop_table('task_templates')
