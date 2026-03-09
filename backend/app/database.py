# chuỗi kết nối giữa file models với hệ quản trị pgadmin 4 thông qua đường dẫn lưu ở file môi trường /

import os 
from sqlmodel import SQLModel, create_engine
from dotenv import load_dotenv
from app.models import VaiTro, NguoiDung, DanhMuc, MauSoDo, SoDo, TaiLieu, LichSuSoDo, NhanXet

load_dotenv()
DB_URL = os.getenv("DB_URL")

engine = create_engine(DB_URL)

def init_db():
    SQLModel.metadata.create_all(engine)