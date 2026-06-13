import os
import json
import re
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"

FALLBACK_CARDS = {
    "pocso": {
        "name": "POCSO Act 2012",
        "short_description": "Protects children from sexual offences with stringent penalties.",
    },
    "consumer_protection": {
        "name": "Consumer Protection Act 2019",
        "short_description": "Safeguards consumer rights and establishes redressal mechanisms.",
    },
    "cyber_crime": {
        "name": "IT Act 2000 (Cyber Crime)",
        "short_description": "Governs electronic commerce and penalises cyber crimes in India.",
    },
    "rti": {
        "name": "Right to Information Act 2005",
        "short_description": "Empowers citizens to access government information transparently.",
    },
    "gst_registration": {
        "name": "GST Registration (India)",
        "short_description": "Unified indirect tax system simplifying goods and services taxation.",
    },
}

FALLBACK_KEYINFO = {
    "key_rights": [
        "Right to protection under this law",
        "Right to file a complaint",
        "Right to fair hearing",
        "Right to compensation",
    ],
    "important_provisions": [
        "Key provisions defined in the act",
        "Regulatory framework established",
        "Penalties for violations specified",
        "Implementation guidelines provided",
    ],
    "important_penalties": [
        "Imprisonment for serious violations",
        "Monetary fines applicable",
        "Additional penalties at court discretion",
    ],
    "who_can_benefit": [
        "Indian citizens",
        "Affected individuals",
        "Registered complainants",
        "Legal representatives",
    ],
}


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
            print("[pipeline] Rate limit hit — waiting 10s before retry...")
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
                raise Exception("RATE_LIMITED: Please try again in a moment.")
        raise


def _load_topic_text(topic_id: str) -> str:
    path = os.path.join(DATA_DIR, f"{topic_id}.txt")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Text file for '{topic_id}' not found. Run the scraper first."
        )
    with open(path, encoding="utf-8") as f:
        return f.read()[:6000]


def _load_cache(topic_id: str, cache_name: str):
    path = os.path.join(DATA_DIR, f"{topic_id}_{cache_name}.json")
    if os.path.exists(path):
        try:
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None
    return None


def _save_cache(topic_id: str, cache_name: str, data) -> None:
    path = os.path.join(DATA_DIR, f"{topic_id}_{cache_name}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _parse_json_response(text: str) -> dict:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned.strip())
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return {}


def generate_card(topic_id: str) -> dict:
    cached = _load_cache(topic_id, "card")
    if cached:
        return cached

    try:
        text = _load_topic_text(topic_id)
    except FileNotFoundError:
        return FALLBACK_CARDS.get(topic_id, {"name": topic_id, "short_description": "An important Indian law."})

    prompt = (
        "Based on this legal text, generate a JSON object with exactly two fields:\n"
        "'name': short official name for this law (max 6 words)\n"
        "'short_description': one sentence description for a card (max 20 words)\n"
        "Return ONLY valid JSON, no markdown, no explanation.\n"
        f"Legal text: {text[:2000]}"
    )

    try:
        raw = _call_groq(prompt)
        result = _parse_json_response(raw)
        if not result:
            return FALLBACK_CARDS.get(topic_id, {"name": topic_id, "short_description": "An important Indian law."})
        _save_cache(topic_id, "card", result)
        return result
    except Exception:
        return FALLBACK_CARDS.get(topic_id, {"name": topic_id, "short_description": "An important Indian law."})


def generate_summary(topic_id: str) -> str:
    cached = _load_cache(topic_id, "summary")
    if cached:
        return cached.get("summary", "")

    text = _load_topic_text(topic_id)

    prompt = (
        "You are a legal expert helping ordinary Indian citizens understand the law.\n"
        "Summarize the following legal text in plain English.\n"
        "Requirements:\n"
        "- Maximum 250 words\n"
        "- Simple language, no legal jargon\n"
        "- Explain what the law does, who it protects, and key points\n"
        "- Write in paragraph form\n"
        "- Suitable for someone with no legal background\n"
        f"Legal text: {text}"
    )

    result = _call_groq(prompt)
    _save_cache(topic_id, "summary", {"summary": result})
    return result


def generate_keyinfo(topic_id: str) -> dict:
    cached = _load_cache(topic_id, "keyinfo")
    if cached:
        return cached

    try:
        text = _load_topic_text(topic_id)
    except FileNotFoundError:
        return FALLBACK_KEYINFO

    prompt = (
        "Based on this legal text, extract structured information.\n"
        "Return ONLY a valid JSON object with exactly these 4 keys:\n"
        "'key_rights': array of exactly 4 strings describing rights granted\n"
        "'important_provisions': array of exactly 4 strings describing key provisions\n"
        "'important_penalties': array of exactly 3 strings describing penalties\n"
        "'who_can_benefit': array of exactly 4 strings describing who benefits\n"
        "Each string must be one clear sentence under 20 words.\n"
        "Return ONLY valid JSON, no markdown, no explanation.\n"
        f"Legal text: {text}"
    )

    try:
        raw = _call_groq(prompt)
        result = _parse_json_response(raw)
        required_keys = {"key_rights", "important_provisions", "important_penalties", "who_can_benefit"}
        if not result or not required_keys.issubset(result.keys()):
            return FALLBACK_KEYINFO
        _save_cache(topic_id, "keyinfo", result)
        return result
    except Exception:
        return FALLBACK_KEYINFO
