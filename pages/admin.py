# pages/admin.py
import streamlit as st
import pandas as pd
from database import get_all_users, get_dashboard_stats


def admin_page():
    st.title("👨‍💼 Admin Panel")
    st.subheader("Platform Statistics")
    stats = get_dashboard_stats()
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("📦 Listings", stats["listings"])
    c2.metric("🏭 Companies", stats["users"])
    c3.metric("💬 Messages", stats["messages"])
    c4.metric("♻️ Waste (kg)", stats["waste"])

    st.divider()
    st.subheader("All Registered Users")
    users = get_all_users()
    if users:
        df = pd.DataFrame(users)[
            ["id", "company_name", "email", "role", "location", "created_at"]
        ]
        st.dataframe(df, hide_index=True)
    else:
        st.info("No users found.")
