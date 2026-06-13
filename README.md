# Mini LegalX AI Knowledge Centre

An AI-powered platform that explains 5 major Indian laws in plain English using **Gemini 1.5 Flash** and **RAG (Retrieval-Augmented Generation)**.

## Covered Laws

| ID | Law |
|----|-----|
| `pocso` | Protection of Children from Sexual Offences Act, 2012 |
| `consumer_protection` | Consumer Protection Act, 2019 |
| `cyber_crime` | Information Technology Act, 2000 |
| `rti` | Right to Information Act, 2005 |
| `gst_registration` | Goods and Services Tax (India) |

## Tech Stack

- **Backend**: FastAPI + Python 3.11
- **AI**: Google Gemini 1.5 Flash (summaries, key info, Q&A)
- **RAG**: sentence-transformers (`all-MiniLM-L6-v2`) + FAISS
- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Scraping**: BeautifulSoup4 + Wikipedia

## Quick Start (Local)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Populate the Knowledge Base

Once the backend is running, trigger the data pipeline:

```bash
curl -X POST http://localhost:8000/api/pipeline/run
```

This scrapes Wikipedia (~1 min) and builds FAISS indexes (~2 min). Results are cached — you only need to run this once.

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:8000
npm install
npm run dev            # opens on http://localhost:5173
```

## Docker (Full Stack)

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your GEMINI_API_KEY
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

After starting, run the pipeline once:

```bash
curl -X POST http://localhost:8000/api/pipeline/run
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/topics` | List all 5 topic cards |
| `GET` | `/api/topics/{id}/summary` | AI plain-English summary |
| `GET` | `/api/topics/{id}/keyinfo` | Rights, provisions, penalties |
| `POST` | `/api/topics/{id}/ask` | RAG-based Q&A `{"question":"..."}` |
| `POST` | `/api/pipeline/run` | Trigger scrape + embed pipeline |

## Architecture

```
User
 │
 ▼
React Frontend (Vite + Tailwind)
 │  GET /api/topics
 │  POST /api/topics/{id}/ask
 ▼
FastAPI Backend
 ├── scraper.py   → Wikipedia → data/*.txt
 ├── embedder.py  → chunks → FAISS index
 ├── pipeline.py  → Gemini → summaries/cards/keyinfo (cached JSON)
 └── rag.py       → FAISS retrieval → Gemini → answer
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google AI Studio API key |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |
