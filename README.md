# 🏛️ Mini LegalX AI Knowledge Centre

An AI-powered legal knowledge platform that automatically processes Indian legal 
content and generates structured knowledge cards for citizens.

🌐 **Live Demo:** https://legalx-assignment.vercel.app
🔧 **Backend API:** https://legalx-assignment.onrender.com/api/health

---

## 📋 Project Overview

The Mini LegalX AI Knowledge Centre is a full-stack AI application that:
- Automatically scrapes legal content from public sources (Wikipedia)
- Processes it through an AI pipeline using Groq (Llama 3.3-70b)
- Generates plain-English summaries, key information cards, and enables Q&A
- Provides audio playback of summaries using browser TTS
- Uses RAG (Retrieval Augmented Generation) with FAISS for accurate Q&A

### Covered Legal Topics
1. POCSO Act 2012
2. Consumer Protection Act 2019
3. IT Act 2000 (Cyber Crime Laws)
4. Right to Information Act 2005
5. GST Registration (India)

---

## 🏗️ Architecture
Legal Source (Wikipedia)

↓

scraper.py — BeautifulSoup web scraper

↓

embedder.py — sentence-transformers + FAISS index builder

↓

┌─────────────────────────────────────┐

│         pipeline.py                 │

│  ┌─────────────────────────────┐    │

│  │  Groq API (Llama 3.3-70b)  │    │

│  │  • generate_card()          │    │

│  │  • generate_summary()       │    │

│  │  • generate_keyinfo()       │    │

│  └─────────────────────────────┘    │

│         Disk Cache (.json)          │

└─────────────────────────────────────┘

↓

rag.py — FAISS retrieval + Groq Q&A

↓

FastAPI Backend (Render.com)

↓

React Frontend (Vercel)

---

## 🤖 AI Models Used

| Model | Provider | Purpose |
|-------|----------|---------|
| Llama 3.3-70b-versatile | Groq | Summary generation, key info extraction, Q&A |
| all-MiniLM-L6-v2 | sentence-transformers (local) | Text embeddings for RAG |
| Web Speech API | Browser built-in | Audio TTS for summaries |

---

## 🛠️ Technologies Used

### Backend
- **FastAPI** — REST API framework
- **Groq SDK** — LLM inference (free tier)
- **FAISS** — Vector similarity search
- **sentence-transformers** — Text embeddings
- **BeautifulSoup4** — Web scraping
- **Python 3.11+**

### Frontend
- **React 19** + **Vite 8**
- **Tailwind CSS v4**
- **React Router v7**
- **Axios**

### Infrastructure
- **Docker** + **Docker Compose**
- **Render.com** — Backend hosting (free)
- **Vercel** — Frontend hosting (free)
- **GitHub** — Version control

---

## ⚙️ Automation Pipeline

The core of this project is a fully automated pipeline:

1. **Scraping** (`scraper.py`)
   - Fetches Wikipedia pages for all 5 legal topics
   - Cleans text (removes citations, short lines)
   - Saves to `backend/data/{topic_id}.txt`

2. **Embedding** (`embedder.py`)
   - Chunks text into 500-char segments with 50-char overlap
   - Creates vector embeddings using sentence-transformers
   - Builds FAISS index for similarity search
   - Saves index + chunks to disk

3. **AI Generation** (`pipeline.py`)
   - Sends cleaned text to Groq (Llama 3.3-70b)
   - Generates card descriptions, summaries, key information
   - Caches all results to disk (no repeated API calls)

4. **RAG Q&A** (`rag.py`)
   - Embeds user question
   - Retrieves top 3 relevant chunks from FAISS
   - Sends question + context to Groq for grounded answer

**Trigger the full pipeline:**
```bash
curl -X POST https://legalx-assignment.onrender.com/api/pipeline/run
```

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API Key (free at console.groq.com)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your GROQ_API_KEY to .env
uvicorn main:app --reload
```

### Run the Pipeline (first time only)
```bash
# On Windows PowerShell:
Invoke-WebRequest -Uri http://localhost:8000/api/pipeline/run -Method POST

# On Mac/Linux:
curl -X POST http://localhost:8000/api/pipeline/run
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Docker Setup
```bash
# Add GROQ_API_KEY to backend/.env first
docker-compose up --build
```

---

## 🐳 Docker

```bash
docker-compose up --build
```

Services:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/topics` | Get all 5 topic cards |
| GET | `/api/topics/{id}/summary` | AI-generated summary |
| GET | `/api/topics/{id}/keyinfo` | Key rights, provisions, penalties |
| POST | `/api/topics/{id}/ask` | RAG-based Q&A |
| POST | `/api/pipeline/run` | Trigger scrape + embed pipeline |

---

## 🧩 Challenges Faced

1. **Gemini API Deprecation** — `google.generativeai` was deprecated mid-project. Migrated to Groq (Llama 3.3-70b) which proved faster and more reliable on free tier.

2. **Memory Constraints on Render Free Tier** — sentence-transformers + FAISS exceeded 512MB RAM limit. Solved by pre-generating embeddings locally and committing data files to the repo.

3. **Rate Limiting** — Implemented disk caching for all AI responses so Groq is only called once per topic, not on every request.

4. **Tailwind CSS v4** — New import syntax (`@import "tailwindcss"`) differs from v3. Required Vite plugin configuration instead of PostCSS.
