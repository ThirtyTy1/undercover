#!/usr/bin/env python3
"""
Generates game item artwork (guns, cars, watches, necklaces, clothes) for
the UNDERCOVER hitman-empire game using Gemini image generation.

Usage:
    GEMINI_API_KEY=xxx python generate_item_art.py
    GEMINI_API_KEY=xxx python generate_item_art.py --only w1,car3
    GEMINI_API_KEY=xxx python generate_item_art.py --pro
"""

import argparse
import os
import sys
import time
from pathlib import Path

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Error: google-genai package not installed. pip install google-genai")
    sys.exit(1)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_FLASH = "gemini-2.5-flash-image"
GEMINI_PRO = "gemini-3-pro-image-preview"

OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "items"

STYLE_SUFFIX = (
    "Rendered as premium video game shop item art: photorealistic yet slightly "
    "stylized 3D render, dramatic studio lighting with neon rim light in red, "
    "purple and teal, deep near-black background (#0a0a0f), object centered and "
    "fully in frame, single object only, no text, no watermark, no logos or brand "
    "markings, square composition, high detail, moody cinematic look."
)

ITEMS = {
    # Guns
    "w1": "A worn rusty semi-automatic pistol, scratched metal, faded grip, low-tier street weapon feel.",
    "w2": "A matte black tactical 9mm pistol fitted with a sound suppressor.",
    "w3": "A tactical pump-action combat shotgun with black synthetic stock and foregrip.",
    "w4": "A compact black tactical submachine gun with folding stock and extended magazine.",
    "w5": "A long black tactical sniper rifle with a mounted scope and bipod, angled dynamically.",
    "w6": "A sleek matte-black custom sniper rifle with an integrated suppressor and precision scope, premium finish.",
    "w7": "A pair of gold-plated large-caliber pistols crossed over each other, gleaming polished gold finish, luxurious.",
    # Cars
    "car1": "A plain worn four-door sedan, slightly dented, dusty faded paint, parked at an angle.",
    "car2": "A black sport motorcycle with matte finish, angled three-quarter view.",
    "car3": "A sleek two-door sports coupe with aggressive angular design, glossy deep red paint.",
    "car4": "A low wide angular supercar with scissor doors open, matte black paint, aggressive aerodynamic bodywork, generic unbranded design.",
    "car5": "An ultra-luxury hypercar with a smooth aerodynamic silhouette and horseshoe-style front grille, glossy pearl white paint, generic unbranded design.",
    # Watches
    "watch1": "A simple stainless steel wristwatch with a plain round face, floating product shot.",
    "watch2": "A gold wristwatch with a classic round face and link bracelet, floating product shot.",
    "watch3": "A luxury steel and gold wristwatch with a diamond-studded bezel and fluted crown, floating product shot.",
    "watch4": "An ultra-thin elegant gold dress watch with a minimalist face and dark leather strap, floating product shot.",
    "watch5": "A futuristic skeleton wristwatch fully encrusted with diamonds, transparent case revealing mechanical gears, floating product shot.",
    # Necklaces
    "neck1": "A simple silver chain necklace coiled on a dark surface.",
    "neck2": "A thick gold cuban link chain necklace coiled on a dark surface.",
    "neck3": "A gold chain necklace with a sparkling diamond pendant, coiled on a dark surface.",
    "neck4": "A thick gold cuban link chain fully encrusted with diamonds, coiled on a dark surface.",
    "neck5": "An elaborate custom diamond-encrusted chain necklace with a large ornate pendant, coiled on a dark surface.",
    # Clothes
    "cloth1": "A black hoodie and cargo pants streetwear outfit, laid flat, top-down flat lay.",
    "cloth2": "A stylish designer tracksuit outfit with subtle premium texture, laid flat, top-down flat lay.",
    "cloth3": "A sharp black tailored suit with dress shirt on a dark mannequin torso, studio shot.",
    "cloth4": "A head-to-toe luxury streetwear outfit with premium fabric texture, laid flat, top-down flat lay.",
    "cloth5": "An opulent bespoke tailored outfit with a fur-trim long coat, on a dark mannequin torso, studio shot.",
}


def generate_item(client, item_id, description, model, force=False):
    out_path = OUTPUT_DIR / f"{item_id}.png"
    if out_path.exists() and not force:
        print(f"  skip {item_id} (already exists)")
        return True

    prompt = f"{description}\n\n{STYLE_SUFFIX}"

    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
                image_config=types.ImageConfig(aspect_ratio="1:1"),
                safety_settings=[
                    types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_LOW_AND_ABOVE"),
                    types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_LOW_AND_ABOVE"),
                    types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_LOW_AND_ABOVE"),
                    types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_LOW_AND_ABOVE"),
                ],
            ),
        )

        image_data = None
        for part in response.candidates[0].content.parts:
            if getattr(part, "inline_data", None) and part.inline_data.mime_type.startswith("image/"):
                image_data = part.inline_data.data
                break

        if not image_data:
            print(f"  FAILED {item_id}: no image returned")
            return False

        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        with open(out_path, "wb") as f:
            f.write(image_data)
        print(f"  OK {item_id} -> {out_path}")
        return True

    except Exception as e:
        print(f"  ERROR {item_id}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", type=str, help="Comma-separated item ids to generate")
    parser.add_argument("--pro", action="store_true", help="Use higher quality Pro model")
    parser.add_argument("--force", action="store_true", help="Regenerate even if file exists")
    args = parser.parse_args()

    if not GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY not set")
        sys.exit(1)

    client = genai.Client(api_key=GEMINI_API_KEY)
    model = GEMINI_PRO if args.pro else GEMINI_FLASH

    ids = args.only.split(",") if args.only else list(ITEMS.keys())

    print(f"Generating {len(ids)} item(s) with {model}")
    ok, fail = 0, 0
    for i, item_id in enumerate(ids):
        if item_id not in ITEMS:
            print(f"  unknown id: {item_id}")
            continue
        print(f"[{i+1}/{len(ids)}] {item_id}")
        if generate_item(client, item_id, ITEMS[item_id], model, force=args.force):
            ok += 1
        else:
            fail += 1
        if i < len(ids) - 1:
            time.sleep(2)

    print(f"\nDone. {ok} succeeded, {fail} failed.")


if __name__ == "__main__":
    main()
