"""add_username_column

Revision ID: bf2308c4694e
Revises: 1f7b27d55378
Create Date: 2025-12-11 16:55:37.375584

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bf2308c4694e'
down_revision = '1f7b27d55378'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if username column already exists
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'username' not in columns:
        # Add username column (nullable initially to allow existing data)
        op.add_column('users', sa.Column('username', sa.String(100), nullable=True))
        
        # Create unique constraint on username
        # Note: MySQL allows multiple NULL values in unique constraints
        op.create_unique_constraint('uq_users_username', 'users', ['username'])
        
        # Optionally, you can populate username from guard_name for existing users
        # op.execute("UPDATE users SET username = guard_name WHERE username IS NULL")


def downgrade() -> None:
    # Drop unique constraint first
    op.drop_constraint('uq_users_username', 'users', type_='unique')
    
    # Drop username column
    op.drop_column('users', 'username')

