import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODEL_NAME = "all-MiniLM-L6-v2"


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def embed_topic(topic_id: str):
    txt_path = os.path.join(DATA_DIR, f"{topic_id}.txt")
    if not os.path.exists(txt_path):
        print(f"[embedder] WARNING: {txt_path} not found. Run scraper first.")
        return

    print(f"[embedder] Loading text for {topic_id} ...")
    with open(txt_path, encoding="utf-8") as f:
        text = f.read()

    chunks = chunk_text(text)
    print(f"[embedder] {topic_id}: {len(chunks)} chunks created")

    model = SentenceTransformer(MODEL_NAME)
    embeddings = model.encode(chunks, show_progress_bar=True)
    embeddings = np.array(embeddings, dtype=np.float32)

    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    index_path = os.path.join(DATA_DIR, f"{topic_id}_index.faiss")
    faiss.write_index(index, index_path)
    print(f"[embedder] Saved FAISS index → {index_path}")

    chunks_path = os.path.join(DATA_DIR, f"{topic_id}_chunks.json")
    with open(chunks_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    print(f"[embedder] Saved chunks → {chunks_path}")


def run_all():
    topic_ids = ["pocso", "consumer_protection", "cyber_crime", "rti", "gst_registration"]
    for topic_id in topic_ids:
        embed_topic(topic_id)
    print("Embedding complete.")


if __name__ == "__main__":
    run_all()
