"""
tests/test_auth.py
==================
Unit tests cho Authentication API:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/google
- POST /api/auth/forgot-password

Nguyên tắc: Mọi call ra ngoài (DB, OAuth) đều được mock/isolate.
"""

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch


# ─────────────────────────────────────────────────────────────────
# TEST: Đăng ký tài khoản mới
# ─────────────────────────────────────────────────────────────────
class TestRegister:
    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient, sample_user_data: dict):
        """Đăng ký thành công → nhận JWT token."""
        response = await client.post("/api/auth/register", json=sample_user_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == sample_user_data["email"]

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient, sample_user_data: dict):
        """Đăng ký email đã tồn tại → lỗi 400."""
        # Đăng ký lần 1
        await client.post("/api/auth/register", json=sample_user_data)
        # Đăng ký lần 2 với cùng email
        response = await client.post("/api/auth/register", json=sample_user_data)
        assert response.status_code == 400
        assert "Email" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_register_missing_fields(self, client: AsyncClient):
        """Đăng ký thiếu trường bắt buộc → lỗi validation 422."""
        response = await client.post("/api/auth/register", json={"email": "test@vnpt.com"})
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client: AsyncClient):
        """Email không hợp lệ → lỗi validation 422."""
        response = await client.post("/api/auth/register", json={
            "ten_nguoi_dung": "Test",
            "email": "not-an-email",
            "mat_khau": "Password123!",
        })
        assert response.status_code == 422


# ─────────────────────────────────────────────────────────────────
# TEST: Đăng nhập
# ─────────────────────────────────────────────────────────────────
class TestLogin:
    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient):
        """Đăng nhập đúng email + password → nhận JWT token."""
        # Tạo user riêng cho test này
        await client.post("/api/auth/register", json={
            "ten_nguoi_dung": "Login Test User",
            "email": "login_success@vnpt.com",
            "mat_khau": "TestPassword123!",
        })
        response = await client.post(
            "/api/auth/login",
            data={"username": "login_success@vnpt.com", "password": "TestPassword123!"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient):
        """Sai mật khẩu → lỗi 401 Unauthorized."""
        await client.post("/api/auth/register", json={
            "ten_nguoi_dung": "Login Test User",
            "email": "login_wrong_pass@vnpt.com",
            "mat_khau": "TestPassword123!",
        })
        response = await client.post(
            "/api/auth/login",
            data={"username": "login_wrong_pass@vnpt.com", "password": "WrongPassword"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_email(self, client: AsyncClient):
        """Email không tồn tại → lỗi 401."""
        response = await client.post(
            "/api/auth/login",
            data={"username": "nonexistent@vnpt.com", "password": "AnyPassword"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_returns_user_info(self, client: AsyncClient):
        """Response đăng nhập phải chứa thông tin user (không có mật khẩu)."""
        await client.post("/api/auth/register", json={
            "ten_nguoi_dung": "User Info Test",
            "email": "login_info_test@vnpt.com",
            "mat_khau": "TestPassword123!",
        })
        response = await client.post(
            "/api/auth/login",
            data={"username": "login_info_test@vnpt.com", "password": "TestPassword123!"},
        )
        assert response.status_code == 200
        user_info = response.json()["user"]
        # Đảm bảo mật khẩu KHÔNG bao giờ được trả về
        assert "mat_khau" not in user_info
        assert "mat_khau_ma_hoa" not in user_info
        assert "email" in user_info


# ─────────────────────────────────────────────────────────────────
# TEST: Forgot Password
# ─────────────────────────────────────────────────────────────────
class TestForgotPassword:
    @pytest.mark.asyncio
    async def test_forgot_password_existing_email(self, client: AsyncClient):
        """
        Gửi yêu cầu reset password với email tồn tại.
        LUÔN trả về 200 (không tiết lộ email có tồn tại không - security by design).
        """
        response = await client.post(
            "/api/auth/forgot-password",
            json={"email": "testuser@vnpt.com"},
        )
        assert response.status_code == 200
        assert "message" in response.json()

    @pytest.mark.asyncio
    async def test_forgot_password_nonexistent_email(self, client: AsyncClient):
        """
        Email không tồn tại cũng phải trả về 200 (chống Email Enumeration Attack).
        """
        response = await client.post(
            "/api/auth/forgot-password",
            json={"email": "ghost@nowhere.com"},
        )
        # BẮT BUỘC: Response PHẢI giống hệt trường hợp email tồn tại
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_forgot_password_invalid_email_format(self, client: AsyncClient):
        """Email sai format → lỗi validation 422."""
        response = await client.post(
            "/api/auth/forgot-password",
            json={"email": "not-valid-email"},
        )
        assert response.status_code == 422


# ─────────────────────────────────────────────────────────────────
# TEST: Protected Route (JWT Authentication)
# ─────────────────────────────────────────────────────────────────
class TestJWTProtection:
    @pytest.mark.asyncio
    async def test_access_protected_route_without_token(self, client: AsyncClient):
        """Truy cập API cần auth mà không có token → lỗi 401."""
        response = await client.get("/api/diagrams/list")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_access_protected_route_with_invalid_token(self, client: AsyncClient):
        """Token giả mạo → lỗi 401."""
        response = await client.get(
            "/api/diagrams/list",
            headers={"Authorization": "Bearer this.is.a.fake.token"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_access_protected_route_with_valid_token(self, client: AsyncClient, sample_user_data: dict):
        """Token hợp lệ → truy cập thành công."""
        # Đăng ký + đăng nhập để lấy token
        reg_resp = await client.post("/api/auth/register", json={
            **sample_user_data,
            "email": "jwt_test@vnpt.com",
        })
        token = reg_resp.json()["access_token"]

        response = await client.get(
            "/api/diagrams/list",
            headers={"Authorization": f"Bearer {token}"},
        )
        # Endpoint diagrams phải hoạt động
        assert response.status_code in (200, 404)  # 404 chấp nhận nếu chưa có data
