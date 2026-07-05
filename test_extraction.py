"""Smoke test: run one Gemini extraction call on a sample mention."""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

from backend.pipeline.extractor import extract, embed

SAMPLE = (
    "Switched from CompetitorA to YourOrg last month. "
    "The UI is way cleaner but pricing is still a bit steep for small teams. "
    "Support responded within 2 hours which was great."
)

if __name__ == "__main__":
    print("=== Extraction ===")
    result = extract(SAMPLE)
    print(json.dumps(result, indent=2))

    print("\n=== Embedding (first 5 dims) ===")
    vec = embed(SAMPLE)
    print(f"dim={len(vec)}, first 5: {vec[:5]}")
