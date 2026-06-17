"""Add username column to user (unique, not null), backfill from email local-part

Revision ID: a1b2c3d4e5f6
Revises: fe56fa70289e
Create Date: 2026-06-17 15:30:00.000000

"""
import re

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'fe56fa70289e'
branch_labels = None
depends_on = None


_USERNAME_SAFE_RE = re.compile(r"[^A-Za-z0-9_]+")


def _sanitize(local_part: str) -> str:
    """Strip characters not allowed in username; pad short results."""
    cleaned = _USERNAME_SAFE_RE.sub("_", local_part) or "user"
    if len(cleaned) < 3:
        cleaned = (cleaned + "_user")[:32]
    return cleaned[:32]


def upgrade():
    # 1. Add column as nullable first so we can backfill existing rows.
    op.add_column(
        'user',
        sa.Column('username', sa.String(length=32), nullable=True),
    )

    # 2. Backfill: derive username from email local-part, with numeric suffix on conflict.
    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT id, email FROM \"user\" ORDER BY created_at NULLS LAST, id")).fetchall()
    used: set[str] = set()
    for row in rows:
        user_id, email = row[0], row[1]
        base = _sanitize((email or "user").split("@")[0])
        candidate = base
        suffix = 2
        while candidate in used:
            suffix_str = str(suffix)
            candidate = f"{base[: 32 - len(suffix_str)]}{suffix_str}"
            suffix += 1
        used.add(candidate)
        bind.execute(
            sa.text('UPDATE "user" SET username = :u WHERE id = :id'),
            {"u": candidate, "id": user_id},
        )

    # 3. Enforce NOT NULL + UNIQUE + INDEX.
    op.alter_column('user', 'username', existing_type=sa.String(length=32), nullable=False)
    op.create_index('ix_user_username', 'user', ['username'], unique=False)
    op.create_unique_constraint('uq_user_username', 'user', ['username'])


def downgrade():
    op.drop_constraint('uq_user_username', 'user', type_='unique')
    op.drop_index('ix_user_username', table_name='user')
    op.drop_column('user', 'username')
