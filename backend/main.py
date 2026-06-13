"""
main.py — FastAPI application for the Mini LegalX AI Knowledge Centre.

Endpoints:
  GET  /api/health                      → health check
  GET  /api/topics                      → list all 5 topic cards
  GET  /api/topics/{topic_id}/summary   → AI-generated plain-English summary
  GET  /api/topics/{topic_id}/keyinfo   → structured key rights/provisions/penalties
  POST /api/topics/{topic_id}/ask       → RAG-based Q&A
  POST /api/pipeline/run                → trigger scrape + embed pipeline
"""

import os
import gc
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Import our AI pipeline modules
import scraper
import pipeline
import rag


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: force garbage collection to free memory
    gc.collect()
    yield
    # Shutdown
    gc.collect()


app = FastAPI(
    title="Mini LegalX AI Knowledge Centre",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow all origins so the React frontend (any host/port) can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Topic registry — single source of truth for IDs
# ─────────────────────────────────────────────
TOPIC_IDS = [
    "pocso",
    "consumer_protection",
    "cyber_crime",
    "rti",
    "gst_registration",
]

# Default card metadata used before Groq generates richer descriptions
DEFAULT_CARDS = {
    "pocso": {
        "id": "pocso",
        "name": "POCSO Act 2012",
        "short_description": "Protects children from sexual offences with stringent penalties.",
    },
    "consumer_protection": {
        "id": "consumer_protection",
        "name": "Consumer Protection Act 2019",
        "short_description": "Safeguards consumer rights and establishes redressal mechanisms.",
    },
    "cyber_crime": {
        "id": "cyber_crime",
        "name": "IT Act 2000 (Cyber Crime)",
        "short_description": "Governs electronic commerce and penalises cyber crimes in India.",
    },
    "rti": {
        "id": "rti",
        "name": "Right to Information Act 2005",
        "short_description": "Empowers citizens to access government information transparently.",
    },
    "gst_registration": {
        "id": "gst_registration",
        "name": "GST Registration (India)",
        "short_description": "Unified indirect tax system simplifying goods and services taxation.",
    },
}


# ─────────────────────────────────────────────
# Request/Response models
# ─────────────────────────────────────────────
class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
def _validate_topic(topic_id: str) -> None:
    if topic_id not in TOPIC_IDS:
        raise HTTPException(
            status_code=404,
            detail=f"Topic '{topic_id}' not found. Valid topics: {TOPIC_IDS}",
        )


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────
@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/topics")
def get_topics():
    """
    Return the list of topic cards.
    If Groq-generated card data exists on disk, use it.
    Otherwise fall back to the hardcoded defaults above.
    """
    cards = []
    for topic_id in TOPIC_IDS:
        try:
            groq_card = pipeline.generate_card(topic_id)
            cards.append(
                {
                    "id": topic_id,
                    "name": groq_card.get("name", DEFAULT_CARDS[topic_id]["name"]),
                    "short_description": groq_card.get(
                        "short_description",
                        DEFAULT_CARDS[topic_id]["short_description"],
                    ),
                }
            )
        except Exception:
            # Data not ready yet — use static defaults so the UI still loads
            cards.append(DEFAULT_CARDS[topic_id])
    return cards


@app.get("/api/topics/{topic_id}/summary")
def get_topic_summary(topic_id: str):
    """Return an AI-generated plain-English summary for the topic."""
    _validate_topic(topic_id)
    try:
        summary = pipeline.generate_summary(topic_id)
        return {"topic_id": topic_id, "summary": summary}
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Topic data not ready. Please run POST /api/pipeline/run first.",
        )
    except Exception as e:
        if "RATE_LIMITED" in str(e):
            raise HTTPException(
                status_code=429,
                detail="AI service rate limited. Please wait a moment and retry.",
            )
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/topics/{topic_id}/keyinfo")
def get_topic_keyinfo(topic_id: str):
    """Return structured key rights, provisions, penalties, and beneficiaries."""
    _validate_topic(topic_id)
    try:
        keyinfo = pipeline.generate_keyinfo(topic_id)
        return {"topic_id": topic_id, **keyinfo}
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Topic data not ready. Please run POST /api/pipeline/run first.",
        )
    except Exception as e:
        if "RATE_LIMITED" in str(e):
            raise HTTPException(
                status_code=429,
                detail="AI service rate limited. Please wait a moment and retry.",
            )
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/topics/{topic_id}/ask", response_model=AskResponse)
def ask_question(topic_id: str, body: AskRequest):
    """Answer a user question using the scraped legal text as context."""
    _validate_topic(topic_id)
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    try:
        answer = rag.get_answer(topic_id, body.question)
        return AskResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pipeline/run")
async def run_pipeline():
    """
    Trigger the data pipeline in a background thread.
    Scraper always runs. Embedder runs only if sentence-transformers is installed
    (not required in the deployment environment).
    """
    def _run():
        scraper.run_all()
        try:
            import embedder
            embedder.run_all()
        except Exception as e:
            print(f"Embedder skipped (not available in this environment): {e}")

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _run)
    return {"status": "pipeline completed", "topics": TOPIC_IDS}
