#! /usr/bin/env bash
set -e
set -x

CONFIRM_FLAG="${1:-}"
if [ "${CONFIRM_FLAG}" != "--app-test" ]; then
  echo "Refusing to run tests without explicit confirmation."
  echo "Usage: bash scripts/tests-start.sh --app-test [pytest args]"
  exit 1
fi
shift

export POSTGRES_DB="${POSTGRES_DB:-app_test}"
if [ "${POSTGRES_DB}" != "app_test" ]; then
  echo "Refusing to run tests against non-test database: ${POSTGRES_DB}"
  exit 1
fi

python app/tests_pre_start.py

bash scripts/test.sh "$@"
