#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
ALEMBIC_INI="${BACKEND_DIR}/alembic.ini"
TARGET_REVISION="${1:-head}"

if [ ! -f "${ALEMBIC_INI}" ]; then
  echo "Error: alembic.ini not found at ${ALEMBIC_INI}" >&2
  exit 1
fi

echo "Running backend migration to revision: ${TARGET_REVISION}"

if command -v uv >/dev/null 2>&1; then
  (
    cd "${BACKEND_DIR}"
    uv run alembic -c "${ALEMBIC_INI}" upgrade "${TARGET_REVISION}"
  )
else
  (
    cd "${BACKEND_DIR}"
    alembic -c "${ALEMBIC_INI}" upgrade "${TARGET_REVISION}"
  )
fi

echo "Migration completed."
