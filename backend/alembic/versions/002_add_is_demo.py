"""Add is_demo flag to users and cases — marks seeded demo/presentation data
so it can be identified and cleaned up separately from real production data.

Revision ID: 002_add_is_demo
Revises: 001_initial
Create Date: 2026-07-16 18:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '002_add_is_demo'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_demo', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('cases', sa.Column('is_demo', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column('cases', 'is_demo')
    op.drop_column('users', 'is_demo')
