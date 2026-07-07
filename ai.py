# ai.py
def detect_material(text: str) -> str:
    """
    Very tiny rule‑based detector.
    Returns a material name or "Other".
    """
    txt = text.lower()
    if "plastic" in txt or "pet" in txt:
        return "Plastic"
    if "iron" in txt:
        return "Iron"
    if "steel" in txt:
        return "Steel"
    if "copper" in txt:
        return "Copper"
    if "aluminium" in txt:
        return "Aluminium"
    if "paper" in txt:
        return "Paper"
    if "glass" in txt:
        return "Glass"
    if "battery" in txt:
        return "Battery"
    return "Other"
