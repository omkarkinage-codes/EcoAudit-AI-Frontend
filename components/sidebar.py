# components/sidebar.py
import streamlit as st


def sidebar():
    """Custom sidebar – appears only after a successful login."""
    if not st.session_state.get("logged_in", False):
        return

    with st.sidebar:
        st.markdown("# ♻️ EcoAudit AI")
        st.caption("Industrial Waste Marketplace")
        st.divider()

        pages = {
            "🏠 Dashboard": "dashboard",
            "🛒 Marketplace": "marketplace",
            "💬 Chat": "chat",
            "📈 Analytics": "analytics",
            "👤 My Account": "profile",
            "⚙ Admin": "admin",
        }

        for label, target in pages.items():
            if st.button(label, use_container_width=True):
                st.session_state.dashboard_page = target
                st.rerun()

        st.divider()
        st.success("🟢 AI Engine Active")
        st.success("🟢 Marketplace Online")
        st.success("🟢 n8n Connected")
        st.divider()

        if st.button("🚪 Logout", use_container_width=True):
            st.session_state.update(
                {"logged_in": False, "page": "home", "dashboard_page": "dashboard"}
            )
            st.rerun()
