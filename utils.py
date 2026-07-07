# utils.py
import streamlit as st


def load_css():
    """
    Inject a tiny CSS block that hides Streamlit’s native UI elements
    and forces a small top‑margin for the main container.
    """
    css = """
    <style>
        /* Hide Streamlit native UI */
        #MainMenu {display:none !important;}
        .stDeployButton {display:none !important;}
        button[data-testid="stSidebarCollapseButton"] {display:none !important;}

        /* Force wide layout padding */
        .block-container {padding-top:2rem !important;}
    </style>
    """
    st.markdown(css, unsafe_allow_html=True)
