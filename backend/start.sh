#!/bin/bash
set -e

echo "=========================================="
echo "  SmartFlow AI Backend - Starting Up..."
echo "=========================================="

echo ""
echo "[1/2] Running database migrations (alembic upgrade head)..."
alembic upgrade head
echo "      Migrations applied successfully."

echo ""
echo "[2/2] Starting FastAPI application (Uvicorn)..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
