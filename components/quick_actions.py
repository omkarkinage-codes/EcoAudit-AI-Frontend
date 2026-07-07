# components/quick_actions.py
import streamlit as st


def quick_actions():
    """Four big buttons that jump to major dashboard sections."""
    st.subheader("⚡ Quick Actions")
    c1, c2, c3, c4 = st.columns(4)

    with c1:
        if st.button("➕ Create Listing", use_container_width=True):
            st.session_state.dashboard_page = "marketplace"
            st.session_state.marketplace_tab = "create"
            st.rerun()
    with c2:
        if st.button("🛒 Browse Listings", use_container_width=True):
            st.session_state.dashboard_page = "marketplace"
            st.session_state.marketplace_tab = "browse"
            st.rerun()
    with c3:
        if st.button("📄 My Listings", use_container_width=True):
            st.session_state.dashboard_page = "marketplace"
            st.session_state.marketplace_tab = "mylistings"
            st.rerun()
    with c4:
        if st.button("💬 Messages", use_container_width=True):
            st.session_state.dashboard_page = "chat"
            st.rerun()
