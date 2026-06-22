"""Add project, project_element, and element_config tables

Revision ID: c4d5e6f7a8b9
Revises: a1b2c3d4e5f6
Create Date: 2026-06-22 14:22:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "c4d5e6f7a8b9"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "project",
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("current_version", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('draft', 'published', 'archived')",
            name="ck_project_status_valid",
        ),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_project_owner_id", "project", ["owner_id"], unique=False)
    op.create_index(
        "idx_project_owner_status_updated",
        "project",
        ["owner_id", "status", "updated_at"],
        unique=False,
    )

    op.create_table(
        "project_element",
        sa.Column("element_key", sa.String(length=128), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("subtype", sa.String(length=32), nullable=False),
        sa.Column("x", sa.Float(), nullable=False, server_default="0"),
        sa.Column("y", sa.Float(), nullable=False, server_default="0"),
        sa.Column("visible", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("locked", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "element_key", name="uq_project_element_key"),
    )
    op.create_index(
        "idx_project_element_project_id",
        "project_element",
        ["project_id"],
        unique=False,
    )

    op.create_table(
        "element_config",
        sa.Column("schema_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("config_json", sa.JSON(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("element_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["element_id"], ["project_element.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("element_id"),
    )
    op.create_index(
        "idx_element_config_element_id", "element_config", ["element_id"], unique=False
    )


def downgrade():
    op.drop_index("idx_element_config_element_id", table_name="element_config")
    op.drop_table("element_config")

    op.drop_index("idx_project_element_project_id", table_name="project_element")
    op.drop_table("project_element")

    op.drop_index("idx_project_owner_status_updated", table_name="project")
    op.drop_index("idx_project_owner_id", table_name="project")
    op.drop_table("project")
