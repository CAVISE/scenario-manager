#!/bin/bash
# Keep this script LF-terminated: it is executed by Linux containers.
set -eu
umask 027

if [ "${RUN_MIGRATIONS:-0}" = "1" ]; then
    echo "Running database migrations"
    alembic upgrade head
fi

exec "$@"
