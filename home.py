# home.py
import streamlit as st
from components.hero import hero
from components.metric_cards import metric_cards
from components.cards import feature_cards
from components.footer import footer


def home_page():
    """
    Full‑width landing page shown before the user logs in.
    It shows the hero, KPI cards, feature cards and the footer.
    """
    hero()
    st.write("")
    metric_cards()
    st.write("")
    feature_cards()
    st.write("")
    footer()
