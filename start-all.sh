#!/bin/bash
# Skill Lens - Full Stack Startup Script

echo "🚀 Starting SkillLens Full Stack Application..."
echo ""

# Check if all required directories exist
if [ ! -d "ai_service" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Missing required directories. Please run this script from the project root."
    exit 1
fi

echo "1️⃣ Starting AI Service (Python FastAPI)..."
cd ai_service
if [ ! -d "../.venv" ]; then
    echo "   Creating Python virtual environment..."
    python -m venv ../.venv
fi

# Activate virtual environment
source ../.venv/bin/activate  # For Unix/macOS
# For Windows: source ../.venv/Scripts/activate

echo "   Installing Python dependencies..."
pip install -r requirements.txt

echo "   Starting FastAPI server on http://localhost:8000..."
python main.py &
AI_PID=$!

cd ..

echo ""
echo "2️⃣ Starting Backend (Node.js Express)..."
cd backend

echo "   Installing Node.js dependencies..."
npm install

echo "   Starting Express server on http://localhost:3001..."
npm start &
BACKEND_PID=$!

cd ..

echo ""
echo "3️⃣ Starting Frontend (React)..."
cd frontend

echo "   Installing React dependencies..."
npm install

echo "   Starting React development server on http://localhost:3000..."
npm start &
FRONTEND_PID=$!

cd ..

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📊 Service URLs:"
echo "   🤖 AI Service:  http://localhost:8000"
echo "   🖥️  Backend:     http://localhost:3001" 
echo "   🌐 Frontend:    http://localhost:3000"
echo ""
echo "🔍 Health Checks:"
echo "   AI Service: curl http://localhost:8000/health"
echo "   Backend:    curl http://localhost:3001/api/v1/resume/ai-status"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for user to stop services
trap "echo ''; echo '🛑 Stopping all services...'; kill $AI_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'All services stopped.'; exit 0" INT

wait