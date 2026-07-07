# app.py
import streamlit as st
from pathlib import Path
from utils import load_css
from database import init_database
from auth import login_page, signup_page
from pages.dashboard import dashboard_page
from pages.admin import admin_page

# ----------------------------------------------------------------------
# 1️⃣ Load custom UI stylesheet (assets/css/style.css)
# ----------------------------------------------------------------------
load_css()                       # injects the CSS that hides Streamlit UI

# ----------------------------------------------------------------------
# 2️⃣ Hide Streamlit native menu, deploy button and sidebar toggle
# ----------------------------------------------------------------------
hide_ui = """
    <style>
        #MainMenu {display:none !important;}
        .stDeployButton {display:none !important;}
        button[data-testid="stSidebarCollapseButton"] {display:none !important;}
    </style>
"""
st.markdown(hide_ui, unsafe_allow_html=True)

# ----------------------------------------------------------------------
# 3️⃣ Initialise SQLite DB (creates tables + default admin)
# ----------------------------------------------------------------------
init_database()

# ----------------------------------------------------------------------
# 4️⃣ Page configuration – wide layout
# ----------------------------------------------------------------------
st.set_page_config(
    page_title="EcoAudit AI",
    page_icon="♻️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ----------------------------------------------------------------------
# 5️⃣ Session‑state defaults
# ----------------------------------------------------------------------
defaults = {
    "logged_in": False,
    "page": "home",          # public pages: home / login / signup
    "user_id": None,
    "user_name": "",
    "email": "",
    "role": "",
    "dashboard_page": "dashboard",   # landing after login
}
for k, v in defaults.items():
    if k not in st.session_state:
        st.session_state[k] = v

# ----------------------------------------------------------------------
# 6️⃣ ROUTER – decide which view to render
# ----------------------------------------------------------------------
if st.session_state.logged_in:
    # Admin gets its own panel, everybody else goes to the dashboard
    if st.session_state.role == "Admin":
        admin_page()
    else:
        dashboard_page()
else:
    # PUBLIC (full‑width) pages – no sidebar, no navbar
    if st.session_state.page == "home":
        from home import home_page
        home_page()
    elif st.session_state.page == "login":
        login_page()
    elif st.session_state.page == "signup":
        signup_page()
