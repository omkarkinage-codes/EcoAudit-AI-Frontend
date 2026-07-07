# pages/dashboard.py
import streamlit as st
from components.sidebar import sidebar
from components.navbar import navbar
from components.metric_cards import metric_cards
from components.quick_actions import quick_actions
from components.hero import hero   # optional banner on the dashboard
from components.footer import footer

# Absolute imports for the other page modules
from pages.marketplace import marketplace_page
from pages.chat import chat_page
from pages.analytics import analytics_page
from pages.profile import profile_page
from pages.admin import admin_page


def dashboard_page():
    """
    Main container for the logged‑in experience.
    Renders the custom sidebar, navbar, and the selected inner page.
    """
    sidebar()
    navbar()

    # Optional hero/banner at the top of the dashboard (feel free to comment out)
    # hero()

    page = st.session_state.dashboard_page

    if page == "dashboard":
        metric_cards()
        st.divider()
        quick_actions()

    elif page == "marketplace":
        marketplace_page()

    elif page == "chat":
        chat_page()

    elif page == "analytics":
        analytics_page()

    elif page == "profile":
        profile_page()

    elif page == "admin":
        admin_page()

    # Footer at the very bottom (optional, can be removed if you prefer)
    footer()
