# pages/profile.py
import streamlit as st
from database import get_user, update_profile, change_password


def profile_page():
    st.title("👤 My Profile")
    uid = st.session_state.user_id
    user = get_user(uid)

    if not user:
        st.error("User not found.")
        return

    # ------------------------------------------------------------------
    # Edit profile form
    # ------------------------------------------------------------------
    with st.form("profile_form"):
        company = st.text_input("Company Name", value=user["company_name"])
        location = st.text_input("Location", value=user["location"])
        phone = st.text_input("Phone", value=user.get("phone", ""))
        gst = st.text_input("GST", value=user.get("gst", ""))
        industry = st.text_input("Industry", value=user.get("industry", ""))

        submitted = st.form_submit_button("Update Profile")
        if submitted:
            update_profile(uid, company, phone, gst, industry, location)
            st.success("✅ Profile updated")
            st.session_state.user_name = company
            st.rerun()

    # ------------------------------------------------------------------
    # Change password (optional)
    # ------------------------------------------------------------------
    st.divider()
    with st.expander("🔒 Change Password"):
        with st.form("pwd_form"):
            new_pwd = st.text_input("New Password", type="password")
            confirm = st.text_input("Confirm Password", type="password")
            pwd_sub = st.form_submit_button("Change Password")
            if pwd_sub:
                if new_pwd != confirm:
                    st.error("Passwords do not match.")
                elif len(new_pwd) < 6:
                    st.error("Password must be at least 6 characters.")
                else:
                    change_password(uid, new_pwd)
                    st.success("✅ Password changed")
