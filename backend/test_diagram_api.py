#==============================================================
# SCRIPT TEST TÍCH HỢP — Kiểm tra toàn bộ luồng CRUD sơ đồ
#
# Cách chạy (từ thư mục backend, kích hoạt venv trước):
#   cd "d:\THUC TAP\VNPT-Smartflow-AI\backend"
#   python test_diagram_api.py
#
# Lưu ý:
#   - Backend phải đang chạy tại http://localhost:8000
#   - Phải có sẵn tài khoản test trong database
#   - Thư viện cần: pip install httpx
#==============================================================

import asyncio
import httpx
import json

# -----------------------------------------------------------
# CẤU HÌNH TEST
# -----------------------------------------------------------
BASE_URL   = "http://localhost:8000"
TEST_EMAIL = "test@example.com"   # ← Sửa thành email có sẵn trong DB
TEST_PASS  = "123456"             # ← Sửa thành mật khẩu tương ứng

# Dữ liệu sơ đồ mẫu (React Flow JSON đơn giản)
SAMPLE_FLOW_DATA = {
    "nodes": [
        {"id": "1", "type": "customNode", "position": {"x": 100, "y": 100},
         "data": {"label": "Tiếp nhận yêu cầu", "type": "task", "executor": "Bộ phận CSKH"}},
        {"id": "2", "type": "customNode", "position": {"x": 400, "y": 100},
         "data": {"label": "Phê duyệt", "type": "decision", "executor": "Trưởng phòng"}},
    ],
    "edges": [
        {"id": "e1-2", "source": "1", "target": "2", "type": "smoothstep", "animated": True},
    ],
}


# -----------------------------------------------------------
# HÀM TIỆN ÍCH IN KẾT QUẢ
# -----------------------------------------------------------
PASS = "✅ PASS"
FAIL = "❌ FAIL"

def print_step(step: str, success: bool, detail: str = ""):
    status = PASS if success else FAIL
    print(f"\n{status} [{step}]")
    if detail:
        print(f"    {detail}")


# -----------------------------------------------------------
# LUỒNG TEST CHÍNH
# -----------------------------------------------------------
async def run_tests():
    results = []
    diagram_id = None
    token = None

    print("=" * 60)
    print("  VNPT SmartFlow AI — Test Script CRUD Diagram API")
    print("=" * 60)

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:

        # --------------------------------------------------
        # BƯỚC 1: Đăng nhập để lấy JWT Token
        # --------------------------------------------------
        try:
            resp = await client.post(
                "/auth/login",
                data={"username": TEST_EMAIL, "password": TEST_PASS},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            resp.raise_for_status()
            token = resp.json().get("access_token")
            ok = bool(token)
            print_step("Bước 1: Đăng nhập", ok, f"Token: {token[:30]}..." if token else "Không nhận được token")
            results.append(ok)
        except Exception as e:
            print_step("Bước 1: Đăng nhập", False, str(e))
            results.append(False)
            print("\n⛔ Không thể đăng nhập → Dừng test.")
            return results

        auth_headers = {"Authorization": f"Bearer {token}"}

        # --------------------------------------------------
        # BƯỚC 2: Tạo sơ đồ mới (POST /diagrams/save)
        # --------------------------------------------------
        try:
            resp = await client.post(
                "/diagrams/save",
                json={"title": "Sơ đồ Test Tự Động", "flow_data": SAMPLE_FLOW_DATA},
                headers=auth_headers,
            )
            resp.raise_for_status()
            body = resp.json()
            diagram_id = body.get("id")
            ok = resp.status_code == 201 and bool(diagram_id)
            print_step("Bước 2: Tạo sơ đồ mới", ok, f"diagram_id={diagram_id}")
            results.append(ok)
        except Exception as e:
            print_step("Bước 2: Tạo sơ đồ mới", False, str(e))
            results.append(False)
            diagram_id = None

        # --------------------------------------------------
        # BƯỚC 3: Lấy danh sách sơ đồ (GET /diagrams/list)
        # --------------------------------------------------
        try:
            resp = await client.get("/diagrams/list", headers=auth_headers)
            resp.raise_for_status()
            items = resp.json()
            ok = isinstance(items, list)
            print_step("Bước 3: Lấy danh sách", ok, f"Tổng sơ đồ: {len(items)}")
            results.append(ok)
        except Exception as e:
            print_step("Bước 3: Lấy danh sách", False, str(e))
            results.append(False)

        # --------------------------------------------------
        # BƯỚC 4: Lấy chi tiết một sơ đồ (GET /diagrams/{id})
        # --------------------------------------------------
        if diagram_id:
            try:
                resp = await client.get(f"/diagrams/{diagram_id}", headers=auth_headers)
                resp.raise_for_status()
                body = resp.json()
                ok = body.get("id") == diagram_id
                print_step("Bước 4: Lấy chi tiết sơ đồ", ok, f"title='{body.get('title')}'")
                results.append(ok)
            except Exception as e:
                print_step("Bước 4: Lấy chi tiết sơ đồ", False, str(e))
                results.append(False)
        else:
            print_step("Bước 4: Lấy chi tiết sơ đồ", False, "Bỏ qua (không có diagram_id từ bước 2)")
            results.append(False)

        # --------------------------------------------------
        # BƯỚC 5: Cập nhật sơ đồ (PUT /diagrams/{id})
        # --------------------------------------------------
        if diagram_id:
            try:
                updated_flow = {**SAMPLE_FLOW_DATA, "nodes": SAMPLE_FLOW_DATA["nodes"] + [
                    {"id": "3", "type": "customNode", "position": {"x": 700, "y": 100},
                     "data": {"label": "Hoàn thành", "type": "end", "executor": ""}},
                ]}
                resp = await client.put(
                    f"/diagrams/{diagram_id}",
                    json={"title": "Sơ đồ Test — Đã Cập Nhật", "flow_data": updated_flow},
                    headers=auth_headers,
                )
                resp.raise_for_status()
                body = resp.json()
                ok = body.get("title") == "Sơ đồ Test — Đã Cập Nhật"
                print_step("Bước 5: Cập nhật sơ đồ", ok, f"title mới='{body.get('title')}'")
                results.append(ok)
            except Exception as e:
                print_step("Bước 5: Cập nhật sơ đồ", False, str(e))
                results.append(False)
        else:
            print_step("Bước 5: Cập nhật sơ đồ", False, "Bỏ qua")
            results.append(False)

        # --------------------------------------------------
        # BƯỚC 6: Xóa sơ đồ (DELETE /diagrams/{id})
        # --------------------------------------------------
        if diagram_id:
            try:
                resp = await client.delete(f"/diagrams/{diagram_id}", headers=auth_headers)
                resp.raise_for_status()
                body = resp.json()
                ok = body.get("result") == "SUCCESS"
                print_step("Bước 6: Xóa sơ đồ", ok, body.get("message", ""))
                results.append(ok)
            except Exception as e:
                print_step("Bước 6: Xóa sơ đồ", False, str(e))
                results.append(False)
        else:
            print_step("Bước 6: Xóa sơ đồ", False, "Bỏ qua")
            results.append(False)

        # --------------------------------------------------
        # BƯỚC 7: Kiểm tra sơ đồ đã bị xóa (404 expected)
        # --------------------------------------------------
        if diagram_id:
            try:
                resp = await client.get(f"/diagrams/{diagram_id}", headers=auth_headers)
                ok = resp.status_code == 404
                print_step("Bước 7: Xác nhận đã xóa (404)", ok, f"Status code: {resp.status_code}")
                results.append(ok)
            except Exception as e:
                print_step("Bước 7: Xác nhận đã xóa", False, str(e))
                results.append(False)
        else:
            print_step("Bước 7: Xác nhận đã xóa", False, "Bỏ qua")
            results.append(False)

    # -----------------------------------------------------------
    # TỔNG KẾT
    # -----------------------------------------------------------
    passed = results.count(True)
    total  = len(results)
    print("\n" + "=" * 60)
    print(f"  KẾT QUẢ: {passed}/{total} bước PASS")
    if passed == total:
        print("  🎉 Tất cả test PASSED! API sẵn sàng.")
    else:
        print("  ⚠️  Có lỗi. Kiểm tra log backend để biết chi tiết.")
    print("=" * 60)
    return results


if __name__ == "__main__":
    asyncio.run(run_tests())
