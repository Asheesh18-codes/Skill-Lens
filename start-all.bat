@echo off
echo 🚀 Starting SkillLens Full Stack Application...
echo.

REM Check if all required directories exist
if not exist "ai_service" (
    echo ❌ Error: ai_service directory not found
    exit /b 1
)
if not exist "backend" (
    echo ❌ Error: backend directory not found
    exit /b 1
)
if not exist "frontend" (
    echo ❌ Error: frontend directory not found
    exit /b 1
)

echo 1️⃣ Starting AI Service (Python FastAPI)...

REM Activate virtual environment
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else (
    echo    Creating Python virtual environment...
    python -m venv .venv
    call .venv\Scripts\activate.bat
)

cd ai_service
echo    Installing Python dependencies...
pip install -r requirements.txt

echo    Starting FastAPI server on http://localhost:8000...
start "AI Service" python main.py
cd ..

echo.
echo 2️⃣ Starting Backend (Node.js Express)...
cd backend

echo    Installing Node.js dependencies...
call npm install

echo    Starting Express server on http://localhost:3001...
start "Backend" npm start
cd ..

echo.
echo 3️⃣ Starting Frontend (React)...
cd frontend

echo    Installing React dependencies...
call npm install

echo    Starting React development server on http://localhost:3000...
start "Frontend" npm start
cd ..

echo.
echo ✅ All services started successfully!
echo.
echo 📊 Service URLs:
echo    🤖 AI Service:  http://localhost:8000
echo    🖥️  Backend:     http://localhost:3001
echo    🌐 Frontend:    http://localhost:3000
echo.
echo 🔍 Health Checks:
echo    AI Service: curl http://localhost:8000/health
echo    Backend:    curl http://localhost:3001/api/v1/resume/ai-status
echo.
echo Press any key to continue...
pause > nul