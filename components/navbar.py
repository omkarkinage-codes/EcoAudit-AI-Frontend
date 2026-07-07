# components/navbar.py
import streamlit as st


def navbar():
    """Horizontal navbar – rendered only when the user is logged in."""
    if not st.session_state.get("logged_in", False):
        return

    # Simple markdown‑based navbar; each link updates the session state
    st.markdown(
        """
        <nav class="navbar">
            <div class="logo">♻️ EcoAudit AI</div>
            <div class="links">
                <a href="#" onClick="window.location.href='?page=dashboard'">Dashboard</a>
                <a href="#" onClick="window.location.href='?page=marketplace'">Marketplace</a>
                <a href="#" onClick="window.location.href='?page=chat'">Chat</a>
                <a href="#" onClick="window.location.href='?page=analytics'">Analytics</a>
                <a href="#" onClick="window.location.href='?page=profile'">My Account</a>
            </div>
        </nav>
        """,
        unsafe_allow_html=True,
    )
    st.divider()
