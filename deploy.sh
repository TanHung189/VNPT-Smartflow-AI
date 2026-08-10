#!/bin/bash
# ================================================================
# deploy.sh — Script tự động deploy VNPT SmartFlow AI lên VPS
# Chạy: chmod +x deploy.sh && ./deploy.sh
# ================================================================

set -e  # Dừng ngay nếu có lỗi

echo "🚀 [1/7] Cập nhật code từ Git..."
git pull origin main

echo "🔑 [2/7] Kiểm tra file .env.production..."
if [ ! -f ".env.production" ]; then
    echo "❌ Không tìm thấy .env.production!"
    echo "   Hãy upload file .env.production lên VPS trước khi chạy deploy."
    exit 1
fi

# Copy .env.production → .env cho docker-compose đọc
cp .env.production .env

echo "🔨 [3/7] Build Docker images..."
docker compose build --no-cache

echo "⬇️  [4/7] Dừng các container cũ (nếu có)..."
docker compose down

echo "🗄️  [5/7] Khởi động database + cache trước..."
docker compose up -d postgres redis
echo "   Chờ DB sẵn sàng..."
sleep 10

echo "🚀 [6/7] Khởi động toàn bộ stack..."
docker compose up -d

echo "⏳ [7/7] Chờ Backend sẵn sàng (30s)..."
sleep 30

# Kiểm tra health
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$HEALTH" = "200" ]; then
    echo "✅ Backend đang chạy tốt!"
else
    echo "⚠️  Backend trả về HTTP $HEALTH — kiểm tra logs:"
    docker compose logs backend --tail=50
fi

echo ""
echo "📊 Trạng thái các container:"
docker compose ps

echo ""
echo "🎉 Deploy hoàn tất!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Flower:   http://localhost:5555"
