import redis

# Kết nối (vì chạy Docker map port nên host vẫn là localhost)
try:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    
    # Thử lưu một dữ liệu vào Redis
    r.set('name', 'Bùi Đỗ Tấn Hưng - VNPT SmartFlow')
    
    # Thử lấy dữ liệu ra
    value = r.get('name')
    print(f"✅ Kết nối thành công! Dữ liệu từ Redis: {value}")

except Exception as e:
    print(f"❌ Lỗi kết nối: {e}")