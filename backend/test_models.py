import asyncio
import os
import sys

# Define the absolute path to backend dir and append to PYTHONPATH
backend_dir = r"d:\THUC TAP\VNPT-Smartflow-AI\backend"
sys.path.insert(0, backend_dir)

from app.database import AsyncSessionLocal
from app.models.ai_model import MoHinhAI
from app.services.ai_service import AIService
from sqlmodel import select

async def main():
    print("Testing AIService fallback variables:")
    ai_service = AIService()
    print(f"Fallback Ollama URL: {ai_service.ollama_url}")
    print(f"Fallback Gemini Key exists: {bool(ai_service.gemini_api_key)}")

    print("\nTesting Database Connection and new Model fields:")
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(select(MoHinhAI))
            models = result.scalars().all()
            for m in models:
                print(f"[{m.nha_cung_cap}] {m.ten_mo_hinh} -> endpoint: {m.endpoint_url}, tham_so: {m.tham_so_cau_hinh}")
        except Exception as e:
            print(f"Error querying MoHinhAI: {e}")

if __name__ == "__main__":
    asyncio.run(main())
