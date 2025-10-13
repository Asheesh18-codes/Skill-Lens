# SkillLens - AI Career Mentor

FastAPI skill extraction service and Express.js backend for resume analysis and skill matching.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ (for AI service)
- Node.js 16+ (for backend)
- npm or yarn

### 1. Start the AI Service (FastAPI)

```bash
# Navigate to AI service directory
cd ai_service

# Install Python dependencies
pip install -r requirements.txt

# Download spaCy model (optional but recommended)
python -m spacy download en_core_web_sm

# Start FastAPI server
python main.py
```

The AI service will be available at `http://localhost:8000`

### 2. Start the Backend (Express.js)

```bash
# Navigate to backend directory
cd backend

# Install Node.js dependencies
npm install

# Copy environment configuration
copy .env.example .env

# Start the server
npm run dev
```

The backend API will be available at `http://localhost:3001`

## 📋 API Endpoints

### AI Service (FastAPI)
- `GET /` - Health check
- `POST /extract` - Extract skills from text
- `GET /health` - Detailed service status

### Backend (Express.js)
- `GET /health` - API health check
- `POST /api/v1/resume/upload` - Upload PDF resume for analysis
- `POST /api/v1/resume/analyze-text` - Analyze raw text
- `GET /api/v1/resume/ai-status` - Check AI service status

## 🧪 Testing the Services

### Test AI Service
```bash
curl -X POST "http://localhost:8000/extract" \
  -H "Content-Type: application/json" \
  -d '{"text": "I am a Python developer with 5 years experience in Django, React, and PostgreSQL"}'
```

### Test Resume Upload
```bash
curl -X POST "http://localhost:3001/api/v1/resume/upload" \
  -F "resume=@your-resume.pdf"
```

### Test Text Analysis
```bash
curl -X POST "http://localhost:3001/api/v1/resume/analyze-text" \
  -H "Content-Type: application/json" \
  -d '{"text": "Software engineer with expertise in JavaScript, Python, React, and AWS"}'
```

## 📁 Project Structure

```
SkillLens/
├── ai_service/
│   ├── main.py              # FastAPI application
│   └── requirements.txt     # Python dependencies
├── backend/
│   ├── src/
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── app.js         # Express app configuration
│   │   └── server.js      # Server entry point
│   ├── package.json       # Node.js dependencies
│   └── .env.example       # Environment configuration
└── README.md
```

## ⚙️ Environment Configuration

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
AI_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

## 🛠️ Development Commands

### AI Service
```bash
# Development mode (auto-reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
python main.py
```

### Backend
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📊 Features

### AI Service Features
- ✅ Skill extraction from resume text
- ✅ Categorized skill classification
- ✅ Confidence scoring
- ✅ spaCy NLP processing
- ✅ Health monitoring

### Backend Features
- ✅ PDF resume upload and parsing
- ✅ Text analysis endpoints
- ✅ Integration with AI service
- ✅ Error handling and validation
- ✅ Rate limiting and security
- ✅ CORS configuration

## 🐛 Troubleshooting

### AI Service Issues
- **spaCy model not found**: Run `python -m spacy download en_core_web_sm`
- **Port 8000 in use**: Change port in `main.py` or kill existing process
- **Import errors**: Ensure all dependencies are installed with `pip install -r requirements.txt`

### Backend Issues
- **AI service unavailable**: Ensure FastAPI service is running on port 8000
- **PDF parsing fails**: Ensure uploaded file is a valid PDF
- **Port 3001 in use**: Change PORT in `.env` file

## 🔗 Integration

The Express backend automatically communicates with the FastAPI service:
1. User uploads PDF via `/api/v1/resume/upload`
2. Backend extracts text using `pdf-parse`
3. Text is sent to FastAPI `/extract` endpoint
4. AI service returns categorized skills with confidence scores
5. Backend returns combined analysis to client

## 📈 Next Steps

1. Add MongoDB integration for user data persistence
2. Implement JWT authentication
3. Add job matching algorithms
4. Create React frontend components
5. Add Docker containerization
6. Implement caching for better performance

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request