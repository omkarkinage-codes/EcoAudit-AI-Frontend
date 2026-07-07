# automation.py
import requests

WEBHOOK = "https://ecoaudit-ai.app.n8n.cloud/webhook-test/d70c8a5d-55ca-4673-a2a8-fe4b26f9c23f"   # <-- replace with real URL


def trigger_n8n(payload: dict):
    """Fire the n8n webhook (silent on failure)."""
    try:
        if WEBHOOK:
            requests.post(WEBHOOK, json=payload, timeout=5)
    except Exception:
        pass
