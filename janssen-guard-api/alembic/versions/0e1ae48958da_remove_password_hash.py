"""remove_password_hash

Revision ID: 0e1ae48958da
Revises: da9945cf17c8
Create Date: 2025-12-10 11:16:22.027659

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0e1ae48958da'
down_revision = 'da9945cf17c8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop password_hash column from users table
    op.drop_column('users', 'password_hash')


def downgrade() -> None:
    # Add password_hash column back (nullable for downgrade)
    op.add_column('users', sa.Column('password_hash', sa.String(255), nullable=True))

