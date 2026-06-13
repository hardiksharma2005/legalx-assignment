import os
import json
import time
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"

_embedder = None


def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


def _call_groq(prompt: str) -> str:
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        if "rate" in str(e).lower() or "429" in str(e):
            print("[rag] Rate limit hit — waiting 10s before retry...")
            time.sleep(10)
            try:
                response = client.chat.completions.create(
                    model=MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1024,
                    temperature=0.3,
                )
                return response.choices[0].message.content.strip()
            except Exception:
                return "I'm temporarily unavailable. Please try again in a moment."
        raise


def get_answer(topic_id: str, question: str) -> str:
    index_path = os.path.join(DATA_DIR, f"{topic_id}_index.faiss")
    chunks_path = os.path.join(DATA_DIR, f"{topic_id}_chunks.json")

    if os.path.exists(index_path) and os.path.exists(chunks_path):
        # RAG path: embed question and retrieve top-3 relevant chunks
        index = faiss.read_index(index_path)
        with open(chunks_path, encoding="utf-8") as f:
            chunks = json.load(f)

        query_vec = _get_embedder().encode([question])
        query_vec = np.array(query_vec, dtype=np.float32)

        distances, indices = index.search(query_vec, k=3)
        retrieved_chunks = [chunks[i] for i in indices[0] if i < len(chunks)]
        context = "\n\n---\n\n".join(retrieved_chunks)
    else:
        # Fallback path: use raw scraped text if FAISS index not built yet
        txt_path = os.path.join(DATA_DIR, f"{topic_id}.txt")
        if os.path.exists(txt_path):
            with open(txt_path, encoding="utf-8") as f:
                context = f.read()[:4000]
        else:
            context = "General Indian legal information"

    prompt = (
        "You are a helpful legal assistant specializing in Indian law.\n"
        "Answer the following question based on the provided legal context.\n"
        "Be clear, concise, and helpful for a non-lawyer.\n"
        "If the answer is not clearly in the context, provide general guidance.\n\n"
        f"Legal Context:\n{context}\n\n"
        f"Question: {question}\n\n"
        "Answer:"
    )

    return _call_groq(prompt)
