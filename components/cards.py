# components/cards.py
import streamlit as st


def feature_cards():
    """
    Four feature cards displayed in a responsive grid.
    Each card gets the CSS class `.card` (defined in assets/css/style.css).
    """
    cards = [
        ("🤖", "AI Detection", "Automatically identify industrial waste."),
        ("♻️", "Circular Economy", "Connect waste generators with recyclers."),
        ("📊", "Analytics", "Live sustainability dashboard."),
        ("⚡", "n8n Automation", "Automate approvals and notifications."),
    ]

    cols = st.columns(4)
    for col, (icon, title, desc) in zip(cols, cards):
        with col:
            st.markdown(
                f"""
                <div class="card">
                    <h1 style="margin:0;">{icon}</h1>
                    <h4>{title}</h4>
                    <p>{desc}</p>
                </div>
                """,
                unsafe_allow_html=True,
            )
