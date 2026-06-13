import os
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"


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
    txt_path = os.path.join(DATA_DIR, f"{topic_id}.txt")
    if os.path.exists(txt_path):
        with open(txt_path, encoding="utf-8") as f:
            context = f.read()[:4000]
    else:
        context = "No data available for this topic."

    prompt = (
        "You are a helpful legal assistant specializing in Indian law.\n"
        "Answer the following question based on the provided legal context.\n"
        "Be clear, concise, and helpful for someone with no legal background.\n"
        "If the answer is not in the context, use your general knowledge about Indian law.\n\n"
        f"Legal Context:\n{context}\n\n"
        f"Question: {question}\n\n"
        "Answer:"
    )

    return _call_groq(prompt)
