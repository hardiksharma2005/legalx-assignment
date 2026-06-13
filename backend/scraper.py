import requests
from bs4 import BeautifulSoup
import re
import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

TOPICS = {
    "pocso": "https://en.wikipedia.org/wiki/Protection_of_Children_from_Sexual_Offences_Act,_2012",
    "consumer_protection": "https://en.wikipedia.org/wiki/Consumer_Protection_Act,_2019",
    "cyber_crime": "https://en.wikipedia.org/wiki/Information_Technology_Act,_2000",
    "rti": "https://en.wikipedia.org/wiki/Right_to_Information_Act,_2005",
    "gst_registration": "https://en.wikipedia.org/wiki/Goods_and_Services_Tax_(India)",
}


def scrape_topic(topic_id: str) -> str:
    url = TOPICS[topic_id]
    print(f"[scraper] Fetching {topic_id} from {url} ...")

    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    content_div = soup.find("div", {"id": "mw-content-text"})
    if not content_div:
        raise ValueError(f"Could not find mw-content-text for {topic_id}")

    paragraphs = content_div.find_all("p")
    raw_lines = [p.get_text() for p in paragraphs]

    # Remove citation markers like [1], [23]
    cleaned_lines = [re.sub(r'\[\d+\]', '', line) for line in raw_lines]

    # Remove lines shorter than 40 characters (headings, stubs, empty lines)
    cleaned_lines = [line.strip() for line in cleaned_lines if len(line.strip()) >= 40]

    text = "\n".join(cleaned_lines)

    out_path = os.path.join(DATA_DIR, f"{topic_id}.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)

    print(f"[scraper] Saved {len(text)} chars → {out_path}")
    return text


def run_all():
    os.makedirs(DATA_DIR, exist_ok=True)
    for topic_id in TOPICS:
        try:
            scrape_topic(topic_id)
        except Exception as e:
            print(f"[scraper] ERROR on {topic_id}: {e}")
    print("Scraping complete. Files saved to data/")


if __name__ == "__main__":
    run_all()
