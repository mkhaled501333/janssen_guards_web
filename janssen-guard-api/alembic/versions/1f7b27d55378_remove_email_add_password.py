"""remove_email_add_password

Revision ID: 1f7b27d55378
Revises: 0e1ae48958da
Create Date: 2025-12-10 11:18:33.100547

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1f7b27d55378'
down_revision = '0e1ae48958da'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if email column exists and drop it
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'email' in columns:
        op.drop_column('users', 'email')
    
    # Check if password column exists, if not add it
    if 'password' not in columns:
        op.add_column('users', sa.Column('password', sa.String(255), nullable=False, server_default=''))
    
    # Check if unique constraint on guard_name already exists
    constraints = inspector.get_unique_constraints('users')
    guard_name_unique_exists = any(
        'guard_name' in constraint['column_names'] for constraint in constraints
    )
    
    if not guard_name_unique_exists:
        op.create_unique_constraint('uq_users_guard_name', 'users', ['guard_name'])


def downgrade() -> None:
    # Remove unique constraint from guard_name
    op.drop_constraint('uq_users_guard_name', 'users', type_='unique')
    
    # Remove password column
    op.drop_column('users', 'password')
    
    # Add email column back
    op.add_column('users', sa.Column('email', sa.String(255), nullable=True))
    # Note: You may need to populate email data manually if downgrading

