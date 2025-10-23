# SkillLens • AI Career Coach (Full‑Stack)

SkillLens turns a simple resume scanner into a complete AI Career Coach. It analyzes resumes, chats about your goals, and generates a personalized learning roadmap with resources, projects, and milestones. It also provides ATS‑style scoring and a concise resume summary you can copy or tweak.

## Highlights

- Conversational chatbot with Markdown rendering and quick suggestions
- Resume upload (PDF → text) and skills extraction via FastAPI
- ATS‑style scoring with detailed breakdown and improvement tips
- Concise resume summary suggestions (+ variants in UI)
- Session‑linked chat that remembers your uploaded skills
- Personalized roadmap generation (phases, resources, projects)
- Modern, neutral UI with full‑app dark mode

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│ Frontend (React + TypeScript + Tailwind)                │
│  • Chatbot, Analyzer, Roadmap views                     │
│  • Markdown (react-markdown + remark-gfm)               │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTP (Axios)
┌───────────────────────────▼──────────────────────────────┐
│ Backend (Node.js + Express)                              │
│  • /api/v1/resume: upload, analyze-text, ai-status       │
│  • /api/v1/chat: session, message, roadmap, history      │
│  • In-memory session store + ATS scoring                 │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTP (Axios)
┌───────────────────────────▼──────────────────────────────┐
│ AI Service (Python + FastAPI)                            │
│  • /extract  (skills)  • /chat (coach)  • /roadmap       │
│  • spaCy-based extraction (+ keywords fallback)          │
│  • Optional OpenAI integration                           │
└──────────────────────────────────────────────────────────┘
```

## Tech Stack

- Frontend: React 18, TypeScript, Tailwind CSS, react-markdown, remark-gfm
- Backend: Node.js, Express, Multer, pdf-parse, Axios
- AI Service: FastAPI, Pydantic v2, spaCy, Uvicorn, (optional) OpenAI

## Project Structure

```
Skill-Lens/
├─ backend/                  # Express API gateway
│  ├─ src/
│  │  ├─ routes/             # /chat, /resume
│  │  ├─ services/           # aiService, sessionStore, atsScorer
│  │  ├─ middleware/         # upload, error handlers
│  │  ├─ app.js
│  │  └─ server.js
│  ├─ package.json
├─ ai_service/               # FastAPI service
│  ├─ main.py                # /extract, /chat, /roadmap, /health
│  ├─ career_advisor.py      # Chat + roadmap logic (OpenAI optional)
│  ├─ nlp_engine.py          # Skill extraction helpers
│  └─ requirements.txt
├─ frontend/                 # React client
│  ├─ src/
│  │  ├─ components/         # Chatbot, RoadmapDisplay, etc.
│  │  ├─ config/             # API base URL
│  │  ├─ types/              # shared API types
│  │  └─ index.css           # theme + dark mode
│  ├─ package.json
├─ start-all.bat             # Windows: start all services
├─ start-all.sh              # macOS/Linux: start all services
└─ README.md
```

## Prerequisites

- Windows, macOS, or Linux
- Node.js 18+ and npm
- Python 3.10+ and pip
- Optional: OpenAI API key for higher‑quality chat/roadmaps

## Environment Configuration

Create these files (values shown are sensible local defaults):

- backend/.env
  ```env
  PORT=3001
  AI_SERVICE_URL=http://127.0.0.1:8000
  FRONTEND_URL=http://localhost:3000
  NODE_ENV=development
  ```

- ai_service/.env (optional, only if using OpenAI)
  ```env
  OPENAI_API_KEY=sk-your-key-here
  USE_OPENAI=true
  USE_HUGGINGFACE=false
  ```

- frontend/.env
  ```env
  REACT_APP_API_URL=http://localhost:3001
  ```

## Quick Start (Windows PowerShell)

You can start everything with one script:

```powershell
# From repo root
./start-all.bat
```

Or run each service manually:

1) AI Service (FastAPI)

```powershell
cd ai_service
# Optional but recommended
python -m venv ..\.venv
..\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# If spaCy model is missing, run once:
python -m spacy download en_core_web_sm

python main.py
```

2) Backend (Express)

```powershell
cd backend
npm install
npm run dev   # auto-reload with nodemon
# or: npm start
```

3) Frontend (React)

```powershell
cd frontend
npm install
npm start
```

Service URLs:
- AI Service: http://127.0.0.1:8000
- Backend:   http://127.0.0.1:3001
- Frontend:  http://127.0.0.1:3000

## API Overview

### Backend Endpoints

Resume
- POST `/api/v1/resume/upload` (multipart/form-data)
  - Field: `resume` (PDF file)
  - Optional query: `?sessionId=...` to merge skills into chat session
- POST `/api/v1/resume/analyze-text` (JSON)
  - Body: `{ "text": "..." }`
- GET `/api/v1/resume/ai-status`

Chat
- POST `/api/v1/chat/session` (JSON) → `{ sessionId }`
- POST `/api/v1/chat/message` (JSON) → `{ message, data?, suggestions[] }`
- POST `/api/v1/chat/roadmap` (JSON) → Full roadmap object
- GET  `/api/v1/chat/history/:sessionId`
- DELETE `/api/v1/chat/session/:sessionId`

### AI Service Endpoints

- POST `/extract`  → `{ skills[], categories{}, confidence_scores{} }`
- POST `/chat`     → `{ message, data?, suggestions[] }`
- POST `/roadmap`  → structured roadmap JSON
- GET  `/health`   → service + component status

### Example: Analyze Text (PowerShell)

```powershell
$body = @{ text = "Senior Software Engineer with 6+ years..." } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3001/api/v1/resume/analyze-text -Method Post -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 6
```

### Example: Send Chat Message

```powershell
$body = @{ sessionId = ""; message = "I want to become a Frontend Developer" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3001/api/v1/chat/message -Method Post -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 6
```

## Features in Detail

### Dark Mode
- Toggle in the app header; preference persists in localStorage.
- Applied across header, analyzer, chatbot, cards, and Markdown (.prose‑chat).

### Resume → Chat Linking
- Upload in Chat view or call `/resume/upload?sessionId=...`.
- Extracted skills merge into the session’s profile for personalized guidance.

### ATS Scoring & Summary
- Server returns:
  - `ats`: overall score (0–100) + breakdown (sections, keywords, formatting, impact, quant, contact) + suggestions
  - `summary`: short resume summary and quick improvements line
- Shown in Analyzer and Chat with copy buttons and short variant options.

## Troubleshooting

- Frontend errors about react-scripts or deps
  - Delete `frontend/node_modules` and `frontend/package-lock.json`; run `npm install` again.
- Backend can’t reach AI service
  - Ensure FastAPI is running and `AI_SERVICE_URL` points to `http://127.0.0.1:8000`.
- PDF parsing issues
  - Ensure the file is a valid PDF and under ~5 MB.
- 422 errors (validation) between backend and AI service
  - Make sure chat history is formatted as `{ role, content }` and Pydantic aliases are respected (`userProfile` vs `user_profile`).
- spaCy model missing
  - Run: `python -m spacy download en_core_web_sm` inside your venv.
- Port conflicts
  - Change ports in `.env` files or stop the conflicting process.

## Production Notes

- Replace in‑memory session store with Redis for multi‑instance deployments
- Add auth (JWT/OAuth), persistent DB (PostgreSQL/MongoDB), and centralized logging
- Containerize services (Docker) and set up CI/CD
- Add monitoring/alerts (Sentry, DataDog) and proper rate limits