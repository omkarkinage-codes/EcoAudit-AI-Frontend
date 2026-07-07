# components/footer.py
import streamlit as st


def footer():
    st.markdown(
        """
        <footer class="footer">
            <h2>♻️ EcoAudit AI</h2>
            AI Powered Industrial Waste Marketplace<br><br>
            Developed by<br>
            <strong>Omkar Vivekanand Kinage</strong><br>
            Artificial Intelligence & Machine Learning Student<br>
            Smart India Hackathon 2026<br><br>
            © 2026 EcoAudit AI
        </footer>
        """,
        unsafe_allow_html=True,
    )
