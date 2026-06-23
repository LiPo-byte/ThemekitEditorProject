"""Add preview_image column to project

Revision ID: d7e8f9a0b1c2
Revises: c4d5e6f7a8b9
Create Date: 2026-06-22 17:43:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "d7e8f9a0b1c2"
down_revision = "c4d5e6f7a8b9"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("project", sa.Column("preview_image", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("project", "preview_image")
