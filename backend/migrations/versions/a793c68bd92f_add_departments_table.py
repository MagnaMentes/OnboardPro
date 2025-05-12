"""Add departments table

Revision ID: a793c68bd92f
Revises: 754fe9eecf17
Create Date: 2025-05-09 10:15:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a793c68bd92f'
down_revision = '754fe9eecf17'
branch_labels = None
depends_on = None


def upgrade():
    # Создаем таблицу departments
    op.create_table('departments',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(), nullable=False),
                    sa.Column('manager_id', sa.Integer(), nullable=True),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text(
                        'CURRENT_TIMESTAMP'), nullable=True),
                    sa.ForeignKeyConstraint(['manager_id'], ['users.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_departments_id'),
                    'departments', ['id'], unique=False)
    op.create_index(op.f('ix_departments_name'),
                    'departments', ['name'], unique=True)

    # Добавляем колонку department_id в таблицу users
    op.add_column('users', sa.Column(
        'department_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'users', 'departments',
                          ['department_id'], ['id'])


def downgrade():
    # Удаляем foreign key и колонку department_id из таблицы users
    op.drop_constraint(None, 'users', type_='foreignkey')
    op.drop_column('users', 'department_id')

    # Удаляем таблицу departments
    op.drop_index(op.f('ix_departments_name'), table_name='departments')
    op.drop_index(op.f('ix_departments_id'), table_name='departments')
    op.drop_table('departments')
