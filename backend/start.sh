#!/bin/bash
set -e

echo "=============================================="
echo "  VNPT SmartFlow AI Backend — Starting Up..."
echo "=============================================="

# ─── 1. Chờ PostgreSQL sẵn sàng ──────────────────────────────
echo ""
echo "[1/3] Waiting for PostgreSQL to be ready..."

# Tách DB_URL để lấy host và port
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):\([0-9]*\)\/.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*@[^:]*:\([0-9]*\)\/.*/\1/p')
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}

MAX_RETRIES=30
RETRY_COUNT=0
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -q 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "      ❌ PostgreSQL không phản hồi sau $MAX_RETRIES lần thử. Thoát."
    exit 1
  fi
  echo "      ⏳ PostgreSQL chưa sẵn sàng (lần $RETRY_COUNT/$MAX_RETRIES), chờ 2s..."
  sleep 2
done
echo "      ✅ PostgreSQL đã sẵn sàng tại $DB_HOST:$DB_PORT"

# ─── 2. Chờ Redis sẵn sàng ───────────────────────────────────
echo ""
echo "[2/3] Waiting for Redis to be ready..."

REDIS_HOST=$(echo ${REDIS_URL:-redis://redis:6379/0} | sed -n 's/redis:\/\/\([^:]*\):.*/\1/p')
REDIS_PORT=$(echo ${REDIS_URL:-redis://redis:6379/0} | sed -n 's/redis:\/\/[^:]*:\([0-9]*\).*/\1/p')
REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}

RETRY_COUNT=0
until (echo > /dev/tcp/$REDIS_HOST/$REDIS_PORT) 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge 15 ]; then
    echo "      ⚠️  Redis không phản hồi — tiếp tục khởi động (Redis là optional cache)"
    break
  fi
  echo "      ⏳ Redis chưa sẵn sàng (lần $RETRY_COUNT/15), chờ 2s..."
  sleep 2
done
[ $RETRY_COUNT -lt 15 ] && echo "      ✅ Redis đã sẵn sàng tại $REDIS_HOST:$REDIS_PORT"

# ─── 3. Chạy Alembic migration ───────────────────────────────
echo ""
echo "[3/3] Running database migrations (alembic upgrade head)..."
alembic upgrade head
echo "      ✅ Migrations applied successfully."

# ─── 4. Khởi động FastAPI ────────────────────────────────────
echo ""
echo "🚀 Starting FastAPI application (Uvicorn)..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
