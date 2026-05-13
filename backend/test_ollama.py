"""
test_ollama.py — Kiểm tra toàn bộ pipeline Local AI
Chạy: python test_ollama.py
"""
import httpx
import asyncio
import json
import os
import sys

OLLAMA_BASE = "http://100.94.87.76:11434"
MODEL_DEFAULT = "qwen2.5-coder:1.5b"

async def test_connectivity():
    """Test 1: Kết nối cơ bản đến Ollama"""
    print("\n" + "="*60)
    print("[TEST 1] Kiểm tra kết nối Ollama...")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{OLLAMA_BASE}/api/tags")
            if r.status_code == 200:
                data = r.json()
                models = [m["name"] for m in data.get("models", [])]
                print(f"  ✅ Ollama ONLINE")
                print(f"  📦 Models có sẵn: {models}")
                return models
            else:
                print(f"  ❌ HTTP {r.status_code}: {r.text[:300]}")
                return []
    except httpx.ConnectError as e:
        print(f"  ❌ CANNOT CONNECT: {e}")
        print(f"  → Kiểm tra lại IP: {OLLAMA_BASE}")
        print(f"  → Kiểm tra VPN/Tailscale nếu IP là 100.x.x.x")
        return []
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")
        return []

async def test_generate(model_name: str):
    """Test 2: Gọi generate JSON với model cụ thể"""
    print("\n" + "="*60)
    print(f"[TEST 2] Test generate với model '{model_name}'...")
    
    prompt = (
        "BẠN LÀ CHUYÊN GIA PHÂN TÍCH QUY TRÌNH TẠI VNPT.\n"
        "NHIỆM VỤ: Chuyển văn bản sau thành JSON React Flow.\n"
        "Mỗi node phải có type='process'\n"
        "Văn bản: Quy trình xin nghỉ phép gồm 3 bước: Nộp đơn, Phê duyệt, Xác nhận.\n"
        "Trả về JSON có 2 khóa: nodes (mảng) và edges (mảng). Không có markdown."
    )
    
    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.2}
    }
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            print(f"  ⏳ Đang gọi Ollama (timeout=120s)...")
            r = await client.post(f"{OLLAMA_BASE}/api/generate", json=payload)
            
            if r.status_code != 200:
                print(f"  ❌ HTTP {r.status_code}: {r.text[:500]}")
                return False
            
            result = r.json()
            raw = result.get("response", "")
            print(f"  ✅ Ollama đã trả lời ({len(raw)} chars)")
            print(f"  📄 Raw response (200 chars): {raw[:200]}")
            
            # Parse JSON
            try:
                parsed = json.loads(raw)
                nodes = parsed.get("nodes", [])
                edges = parsed.get("edges", [])
                print(f"  ✅ JSON hợp lệ: {len(nodes)} nodes, {len(edges)} edges")
                if nodes:
                    print(f"  🔍 Node đầu tiên: {json.dumps(nodes[0], ensure_ascii=False)[:200]}")
                return True
            except json.JSONDecodeError as e:
                print(f"  ❌ JSON PARSE ERROR: {e}")
                print(f"  Raw: {raw[:500]}")
                return False
                
    except httpx.ConnectError as e:
        print(f"  ❌ CONNECT ERROR: {e}")
        return False
    except httpx.TimeoutException:
        print(f"  ❌ TIMEOUT: Model quá chậm (>120s)")
        return False
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")
        return False

async def test_db_model_lookup():
    """Test 3: Kiểm tra DB có model Ollama nào active không"""
    print("\n" + "="*60)
    print("[TEST 3] Kiểm tra cấu hình model trong database...")
    try:
        # Thêm đường dẫn backend vào sys.path
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        
        from app.database.session import engine
        from app.models.ai_model import MoHinhAI
        from sqlmodel.ext.asyncio.session import AsyncSession
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy import select
        
        async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session_maker() as db:
            stmt = select(MoHinhAI)
            result = await db.execute(stmt)
            all_models = result.scalars().all()
            
            print(f"  📋 Tổng models trong DB: {len(all_models)}")
            for m in all_models:
                status = "✅ ACTIVE" if m.trang_thai_hoat_dong else "❌ INACTIVE"
                print(f"  {status} | {m.nha_cung_cap} | {m.ten_mo_hinh} | endpoint: {m.endpoint_url}")
            
            ollama_models = [m for m in all_models if m.nha_cung_cap == "ollama"]
            active_ollama = [m for m in ollama_models if m.trang_thai_hoat_dong]
            
            if not ollama_models:
                print("\n  ⚠️  KHÔNG CÓ MODEL OLLAMA NÀO TRONG DB!")
                print("  → Cần thêm record vào bảng mo_hinh_ai với nha_cung_cap='ollama'")
                return False
            
            if not active_ollama:
                print(f"\n  ⚠️  Có {len(ollama_models)} Ollama model nhưng TẤT CẢ đều INACTIVE!")
                print("  → Cần bật trang_thai_hoat_dong=True trong Admin > AI Models")
                return False
            
            print(f"\n  ✅ Có {len(active_ollama)} Ollama model ACTIVE:")
            for m in active_ollama:
                print(f"     - {m.ten_mo_hinh} | endpoint: {m.endpoint_url or 'DEFAULT'}")
            return True
            
    except Exception as e:
        print(f"  ❌ DB ERROR: {type(e).__name__}: {e}")
        return False

async def test_provider_routing():
    """Test 4: Kiểm tra routing logic trong generate_smart_flow"""
    print("\n" + "="*60)
    print("[TEST 4] Kiểm tra routing provider trong generate_smart_flow...")
    print("  → Khi FE gửi provider='qwen2.5-coder:1.5b' (tên model):")
    print("  → Backend query DB WHERE ten_mo_hinh='qwen2.5-coder:1.5b' AND trang_thai=True")
    print("  → Nếu tìm được → lấy nha_cung_cap từ DB → route đến đúng Ollama/Gemini")
    print("  → Nếu KHÔNG tìm được → giữ nguyên provider string → gọi Gemini (BUG!)")
    print()
    print("  ⚠️  BUG TIỀM ẨN: Nếu DB không có model, provider string 'qwen2.5-coder:1.5b'")
    print("      không phải 'ollama' → hệ thống sẽ cố gọi Gemini thay vì Ollama!")

async def main():
    print("🔍 VNPT SmartFlow AI — Local AI Diagnostic Tool")
    print("=" * 60)
    
    # Test 1: Connectivity
    available_models = await test_connectivity()
    
    # Test 2: Generate (nếu kết nối được)
    if available_models:
        model_to_test = available_models[0] if available_models else MODEL_DEFAULT
        await test_generate(model_to_test)
    else:
        print("\n[TEST 2] SKIP — Không kết nối được Ollama")
    
    # Test 3: DB check
    await test_db_model_lookup()
    
    # Test 4: Routing analysis
    await test_provider_routing()
    
    print("\n" + "="*60)
    print("📊 TỔNG KẾT:")
    print("  Nếu TEST 1 FAIL → Ollama chưa chạy hoặc sai IP")
    print("  Nếu TEST 2 FAIL → Model chưa được pull hoặc quá yếu")
    print("  Nếu TEST 3 FAIL → Cần cấu hình model trong Admin panel")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
