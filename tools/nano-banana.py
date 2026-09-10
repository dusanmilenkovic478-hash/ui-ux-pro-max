#!/usr/bin/env python3
"""Bildgenerierung über die Gemini-API ("Nano Banana").

Beispiele:
    ./nano-banana.py "Aquarell-Illustration eines Kompasses, helle Grautöne" -o kompass.png
    ./nano-banana.py "entferne den Hintergrund" -i foto.jpg -o freigestellt.png
    ./nano-banana.py --list-models
"""

import argparse
import base64
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request

API_ROOT = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_MODEL = "gemini-2.5-flash-image"


def request(url: str, payload: dict | None = None) -> dict:
    # Ohne GEMINI_API_KEY läuft der Aufruf über die API-Anmeldedaten der
    # Cloud-Umgebung: der Agent-Proxy hängt den Schlüssel außerhalb der
    # Session an, die Anfrage geht hier bewusst ohne Auth-Header raus.
    headers = {"Content-Type": "application/json"}
    if key := os.environ.get("GEMINI_API_KEY"):
        headers["x-goog-api-key"] = key

    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        sys.exit(f"API-Fehler {e.code}: {e.read().decode()[:800]}")


def list_models() -> None:
    for m in request(f"{API_ROOT}/models").get("models", []):
        name = m["name"].removeprefix("models/")
        if "image" in name:
            print(f"{name:45} {m.get('description', '')[:70]}")


def generate(prompt: str, out: str, model: str, inputs: list[str]) -> None:
    parts: list[dict] = [{"text": prompt}]
    for path in inputs:
        mime = mimetypes.guess_type(path)[0] or "image/png"
        with open(path, "rb") as f:
            parts.append(
                {"inline_data": {"mime_type": mime, "data": base64.b64encode(f.read()).decode()}}
            )

    result = request(
        f"{API_ROOT}/models/{model}:generateContent", {"contents": [{"parts": parts}]}
    )

    images = [
        p["inlineData"]
        for c in result.get("candidates", [])
        for p in c.get("content", {}).get("parts", [])
        if "inlineData" in p
    ]
    if not images:
        sys.exit(f"Keine Bilddaten erhalten. Antwort: {json.dumps(result)[:800]}")

    base, ext = os.path.splitext(out)
    for i, img in enumerate(images):
        path = out if i == 0 else f"{base}-{i + 1}{ext}"
        with open(path, "wb") as f:
            f.write(base64.b64decode(img["data"]))
        print(f"{path}  ({len(base64.b64decode(img['data'])) // 1024} KB)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("prompt", nargs="?", help="Bildbeschreibung")
    ap.add_argument("-o", "--out", default="output.png", help="Zieldatei (Standard: output.png)")
    ap.add_argument("-m", "--model", default=DEFAULT_MODEL, help=f"Modell (Standard: {DEFAULT_MODEL})")
    ap.add_argument("-i", "--image", action="append", default=[], help="Eingabebild zum Bearbeiten (mehrfach möglich)")
    ap.add_argument("--list-models", action="store_true", help="Verfügbare Bildmodelle anzeigen")
    args = ap.parse_args()

    if args.list_models:
        list_models()
    elif args.prompt:
        generate(args.prompt, args.out, args.model, args.image)
    else:
        ap.error("Bitte einen Prompt angeben oder --list-models verwenden.")
