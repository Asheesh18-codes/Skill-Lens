# 🧠 SkillLens – AI Career Mentor

### Copilot Context + Prompt Library for VS Code

---

## 🧭 Project Summary

SkillLens is an **AI-driven career mentor platform** that bridges the gap between **academic learning and industry job requirements**.

Users upload resumes or LinkedIn profiles → SkillLens extracts their skills → compares them with live job postings → identifies missing skills → and creates **personalized learning roadmaps** with **gamified progress tracking**.

---

## 🧩 Tech Stack

| Layer      | Technology                                  | Purpose                               |
| ---------- | ------------------------------------------- | ------------------------------------- |
| Frontend   | React + TailwindCSS + Recharts              | Skill dashboards, radar, gamification |
| Backend    | Node.js + Express + Mongoose                | REST APIs and data management         |
| Database   | MongoDB                                     | Users, skills, roadmaps, progress     |
| AI/NLP     | Python + FastAPI + spaCy/HuggingFace/OpenAI | Skill extraction + role matching      |
| Job Data   | Puppeteer / BeautifulSoup                   | Job postings + skill frequency        |
| Deployment | Docker + Render/Vercel                      | Scalable cloud deployment             |

---

## 🧱 Folder Structure Overview

```
SkillLens/
│
├── backend/
│   ├── src/
│   │   ├── routes/            # Express routers
│   │   ├── controllers/       # API logic
│   │   ├── services/          # Business logic (AI, matching, roadmap)
│   │   ├── models/            # MongoDB schemas
│   │   ├── middleware/        # Auth, file upload, etc.
│   │   ├── config/            # Env, DB connection
│   │   ├── app.js
│   │   └── server.js
│
├── ai_service/
│   ├── main.py                # FastAPI app
│   ├── nlp_engine.py          # spaCy/HuggingFace/OpenAI logic
│   ├── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── App.js
│
├── data/
│   └── resources_catalog.json
│
└── docs/
    ├── api_reference.md
    └── architecture.png
```

---

## 🧰 Implementation Guidelines for Copilot

### Backend (Node.js + Express)

* Use **ESM syntax** (`import ... from`).
* Async/await for all DB and API operations.
* RESTful routes under `/api/v1/`.
* Return responses in `{ success, data, message }` format.
* Use **Mongoose** models for MongoDB.
* Handle errors using centralized middleware.
* Use **dotenv** for environment variables.
* Use **Multer** for file upload parsing.

### Python AI Service (FastAPI)

* Endpoint `/extract`
* Input: `{ text: string }`
* Output: `{ skills: [...] }`
* Use spaCy for entity extraction; fallback to OpenAI for enrichment.

### Frontend (React)

* Axios for API requests.
* TailwindCSS for UI styling.
* Recharts or Chart.js for skill radar visualization.
* Use functional components and hooks (`useState`, `useEffect`).
* Keep components modular (`SkillRadar`, `RoadmapCard`, `UploadBox`, etc.).

---

## 🪄 Copilot Prompt Library (Ready-to-Use Commands)

You can type these in **Copilot Chat** (VS Code → Ctrl+I or open “Copilot Chat”)
or as inline comments (`// TODO: ...`) inside files.

---

### 🧠 AI/NLP Integration

**Prompt 1:**

> @workspace create a FastAPI endpoint `/extract` that receives resume text and returns extracted skills using spaCy.

**Prompt 2:**

> @workspace generate Python code that loads a HuggingFace model for zero-shot classification to predict relevant job roles from extracted skills.

**Prompt 3:**

> @workspace write a Node.js service that sends resume text to the Python FastAPI microservice and returns parsed skills as JSON.

---

### ⚙️ Backend (Node.js + Express)

**Prompt 4:**

> @workspace generate an Express POST route `/api/v1/resume/upload` that accepts a PDF file, extracts text using `pdf-parse`, and sends it to the AI service for skill extraction.

**Prompt 5:**

> @workspace create a `skillMatcher.js` service that compares user skills vs job skills and returns `{ fitPercent, missingSkills }`.

**Prompt 6:**

> @workspace build a `roadmapService.js` that takes missing skills and maps them to learning resources from `resources_catalog.json`.

**Prompt 7:**

> @workspace generate a Mongoose model for `User` with fields: name, email, password, skills[], badges[], roadmap[], progress%.

**Prompt 8:**

> @workspace implement middleware for JWT authentication and attach user data to `req.user`.

**Prompt 9:**

> @workspace generate an Express error handler middleware that formats all errors as `{ success: false, message: error.message }`.

---

### 🎨 Frontend (React + TailwindCSS)

**Prompt 10:**

> @workspace build a `SkillRadar.jsx` component using Recharts that displays skill fit % based on API data.

**Prompt 11:**

> @workspace create a `ResumeUpload.jsx` component with a drag-and-drop area and upload button that calls `/api/v1/resume/upload`.

**Prompt 12:**

> @workspace design a `RoadmapView.jsx` that shows learning resources grouped by skill, with progress bars.

**Prompt 13:**

> @workspace generate a `Dashboard.jsx` page that fetches the user’s skill fit %, missing skills, and badges from the backend and visualizes them.

**Prompt 14:**

> @workspace build a React context provider `UserContext.jsx` for storing user state, fit %, and roadmap progress globally.

---

### 📊 Data + Scraping

**Prompt 15:**

> @workspace create a Python script using BeautifulSoup to scrape job postings from LinkedIn and extract role names and required skills.

**Prompt 16:**

> @workspace write a Node script using Puppeteer that retrieves job titles, company names, and skill tags from a given career page URL.

---

### 🧩 Integration Prompts

**Prompt 17:**

> @workspace integrate the FastAPI microservice with Express backend using Axios and handle failure retries gracefully.

**Prompt 18:**

> @workspace write a Dockerfile for Node backend and another for Python AI service with multi-container setup using Docker Compose.

**Prompt 19:**

> @workspace add a route `/api/v1/health` that checks connectivity with MongoDB and AI microservice.

---

### 🏆 Gamification

**Prompt 20:**

> @workspace build a backend service `gamification.js` that awards badges when user fitPercent crosses 60%, 80%, and 100%.

**Prompt 21:**

> @workspace create a frontend component `BadgeDisplay.jsx` that shows unlocked badges with animations.

---

## 💬 Example Inline Prompts (for code comments)

You can also type these inside files for Copilot inline completions:

```js
// TODO: Implement roadmap generator that takes missing skills and recommends top 3 resources for each.
```

```js
# TODO: Write FastAPI endpoint that extracts skills and categories from resume text.
```

```jsx
// TODO: Create dashboard card showing Fit %, Missing Skills, and Next Skill Goal.
```

---

## 🚀 Copilot Goal

Generate modular, production-grade code across **Node.js**, **React**, and **Python** that collectively form the **SkillLens AI Career Mentor platform**, following the architecture above.
Maintain consistency, clean naming conventions, and helpful inline documentation.

---

### 💡 Tip:

Once this file is saved, restart VS Code → open Copilot Chat → try:

```
@workspace create all backend routes for SkillLens following the architecture in copilot-instructions.md
```

