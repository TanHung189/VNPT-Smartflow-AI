import subprocess
import os
import sys

base_dir = r"d:\THUC TAP\VNPT-Smartflow-AI"
frontend_dir = os.path.join(base_dir, "frontend")
backend_dir = os.path.join(base_dir, "backend")

# Open log files
f_frontend = open(os.path.join(base_dir, "frontend.log"), "w")
f_backend = open(os.path.join(base_dir, "backend.log"), "w")

# Start frontend
frontend_proc = subprocess.Popen(
    ["npm.cmd", "run", "dev"],
    cwd=frontend_dir,
    stdout=f_frontend,
    stderr=subprocess.STDOUT
)

# Start backend
backend_env = os.environ.copy()
backend_env["PATH"] = os.path.join(backend_dir, "venv", "Scripts") + os.pathsep + backend_env["PATH"]

backend_proc = subprocess.Popen(
    ["uvicorn.exe", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
    cwd=backend_dir,
    env=backend_env,
    stdout=f_backend,
    stderr=subprocess.STDOUT
)

print(f"Frontend PID: {frontend_proc.pid}")
print(f"Backend PID: {backend_proc.pid}")
