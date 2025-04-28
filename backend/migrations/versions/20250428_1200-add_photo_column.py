"""Add photo column to users table

Revision ID: 20250428_1200
Revises: 20250426_2112-625fbe5f5d51
Create Date: 2025-04-28 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20250428_1200'
down_revision: Union[str, None] = '20250426_2112-625fbe5f5d51'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add photo column to users table"""
    # Check if column already exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [column['name'] for column in inspector.get_columns('users')]
    
    if 'photo' not in columns:
        op.add_column('users', sa.Column('photo', sa.String(), nullable=True))


def downgrade() -> None:
    """Remove photo column from users table"""
    op.drop_column('users', 'photo')
