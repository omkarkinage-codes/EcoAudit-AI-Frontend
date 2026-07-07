# ----------------------------  components/stats.py  ----------------------------
import streamlit as st
from components.metric_cards import metric_cards   # ← import added


def statistics():
    """
    Simple “Platform Statistics” heading + the KPI cards.
    """
    st.markdown("## 📈 Platform Statistics")
    metric_cards()        # reuse the KPI component (no argument needed)
