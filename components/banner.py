# components/banner.py
import streamlit as st


def dashboard_banner():
    """
    Large banner image placed just below the navbar on the dashboard.
    """
    st.markdown(
        """
        <section style="margin:2rem 0;">
            <img src="assets/dashboard_banner.jpg" style="width:100%; border-radius:12px;" />
        </section>
        """,
        unsafe_allow_html=True,
    )
