#!/usr/bin/env bash

set -e
set -x

if [ "${POSTGRES_DB:-}" != "app_test" ]; then
  echo "Refusing to run tests against non-test database: ${POSTGRES_DB:-<unset>}"
  echo "Please set POSTGRES_DB=app_test."
  exit 1
fi

coverage run -m pytest tests/
coverage report
coverage html --title "${@-coverage}"
