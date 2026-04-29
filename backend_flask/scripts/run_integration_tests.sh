#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
FLASK_DIR="$ROOT_DIR/backend_flask"
BACKEND_DIR="$ROOT_DIR/backend"
trap 'echo "[cleanup] Stopping MySQL test container"; docker compose -f "$FLASK_DIR/docker-compose.test.yml" down --remove-orphans 2>/dev/null || true' EXIT

export TEST_DATABASE_URL="${TEST_DATABASE_URL:-mysql://root:root@127.0.0.1:3307/pedido_test}"
export DATABASE_URL="$TEST_DATABASE_URL"

echo "[1/4] Starting MySQL test container"
docker compose -f "$FLASK_DIR/docker-compose.test.yml" up -d

echo "[2/4] Waiting for MySQL health"
for i in {1..40}; do
  status=$(docker inspect --format='{{.State.Health.Status}}' pedido-mysql-test 2>/dev/null || true)
  if [ "$status" = "healthy" ]; then
    break
  fi
  sleep 2
  if [ "$i" -eq 40 ]; then
    echo "MySQL test container did not become healthy in time" >&2
    exit 1
  fi
done

echo "[3/4] Syncing schema with Prisma"
cd "$BACKEND_DIR"
DATABASE_URL="$TEST_DATABASE_URL" npx prisma db push --schema=prisma/schema.prisma

echo "[4/4] Running integration tests"
cd "$FLASK_DIR"
.venv/bin/python -m pytest -q -m integration

echo "Done."
