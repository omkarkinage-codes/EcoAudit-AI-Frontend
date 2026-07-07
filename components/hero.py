# components/hero.py
import streamlit as st


def hero():
    """
    Hero block – two‑column layout with headline, description,
    two CTA buttons, and a right‑hand image.
    """
    left, right = st.columns([1.4, 1])

    with left:
        st.markdown(
            """
            <h1 style="font-size:58px; line-height:1.1;">
            Turning Industrial Waste<br>
            <span style="color:#22C55E;">Into Sustainable Future</span>
            </h1>
            """,
            unsafe_allow_html=True,
        )
        st.write("")
        st.markdown(
            """
            ### AI Powered Industrial Waste Marketplace

            Connect industries, recyclers and buyers on one intelligent platform.

            Reduce landfill waste • Promote circular economy • Automate workflows with AI & n8n.
            """
        )
        c1, c2 = st.columns(2)
        with c1:
            if st.button("🚀 Get Started", use_container_width=True):
                st.session_state.page = "signup"
                st.rerun()
        with c2:
            if st.button("🔐 Login", use_container_width=True):
                st.session_state.page = "login"
                st.rerun()

    with right:
        st.image("assets/hero.jpg", use_container_width=True)
