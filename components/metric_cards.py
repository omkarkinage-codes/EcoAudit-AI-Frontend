# components/metric_cards.py
import streamlit as st
from database import get_dashboard_stats


def metric_cards():
    """Four‑column metric grid (Listings, Companies, Messages, Waste)."""
    stats = get_dashboard_stats()

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("📦 Listings", stats["listings"])
    with col2:
        st.metric("🏭 Companies", stats["users"])
    with col3:
        st.metric("💬 Messages", stats["messages"])
    with col4:
        st.metric("♻️ Waste (kg)", stats["waste"])
