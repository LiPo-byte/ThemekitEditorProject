"""Add visibility column to project

Revision ID: f1a2b3c4d5e6
Revises: d7e8f9a0b1c2
Create Date: 2026-08-13 15:40:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "f1a2b3c4d5e6"
down_revision = "d7e8f9a0b1c2"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "project",
        sa.Column(
            "visibility",
            sa.String(length=20),
            nullable=False,
            server_default="private",
        ),
    )
    op.create_check_constraint(
        "ck_project_visibility_valid",
        "project",
        "visibility IN ('private', 'public')",
    )
    # 列表页会按 visibility 捞其他人的公开项目，再按 updated_at 倒序分页
    op.create_index(
        "idx_project_visibility_updated",
        "project",
        ["visibility", "updated_at"],
        unique=False,
    )


def downgrade():
    op.drop_index("idx_project_visibility_updated", table_name="project")
    op.drop_constraint("ck_project_visibility_valid", "project", type_="check")
    op.drop_column("project", "visibility")
