# auth.py
import streamlit as st
from database import register_user, login_user


# ------------------------------------------------------------------
# Login page
# ------------------------------------------------------------------
def login_page():
    left, right = st.columns([1.4, 1])

    with left:
        st.markdown(
            """
            # 🌿 EcoAudit AI

            ### Smart Industrial Waste Marketplace

            **Features**

            ✅ AI Waste Classification  
            ✅ Buyer‑Seller Marketplace  
            ✅ Secure Chat  
            ✅ n8n Automation
            """
        )

    with right:
        with st.form("login"):
            st.subheader("Welcome Back")
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            submit = st.form_submit_button("Login", use_container_width=True)

        if submit:
            user = login_user(email, password)
            if user:
                st.session_state.update(
                    {
                        "logged_in": True,
                        "user_id": user["id"],
                        "user_name": user["company_name"],
                        "email": user["email"],
                        "role": user["role"],
                    }
                )
                st.rerun()
            else:
                st.error("Invalid credentials")

    if st.button("Create Account", use_container_width=True):
        st.session_state.page = "signup"
        st.rerun()
    if st.button("← Back", use_container_width=True):
        st.session_state.page = "home"
        st.rerun()


# ------------------------------------------------------------------
# Signup page
# ------------------------------------------------------------------
def signup_page():
    st.title("🚀 Create Account")

    with st.container(border=True):
        company = st.text_input("Company Name")
        email = st.text_input("Company Email")
        password = st.text_input("Create Password", type="password")
        confirm = st.text_input("Confirm Password", type="password")
        location = st.text_input("Location")
        role = st.selectbox(
            "Account Type", ["Industrial Seller", "Recycling Buyer"]
        )

        if st.button("Create Account", use_container_width=True):
            if not all([company, email, password, location]):
                st.warning("Please fill all fields.")
                return
            if password != confirm:
                st.error("Passwords do not match.")
                return

            ok, msg = register_user(
                company, email, password, location, role
            )
            if ok:
                st.success(msg)
                st.session_state.page = "login"
                st.rerun()
            else:
                st.error(msg)

    if st.button("← Back", use_container_width=True):
        st.session_state.page = "home"
        st.rerun()
