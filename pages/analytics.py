# pages/analytics.py
import streamlit as st
import pandas as pd
from database import material_distribution, get_recent_listings


def analytics_page():
    st.title("📊 Analytics")

    # ---- Material distribution bar chart ---------------------------------
    st.subheader("Material Distribution")
    data = material_distribution()
    if data:
        df = pd.DataFrame(data, columns=["Material", "Count"]).set_index("Material")
        st.bar_chart(df)
    else:
        st.info("No material data yet.")

    st.divider()

    # ---- Recent listings table --------------------------------------------
    st.subheader("Recent Listings")
    recent = get_recent_listings(limit=10)
    if recent:
        df = pd.DataFrame(recent)[
            [
                "id",
                "material",
                "quantity",
                "price",
                "location",
                "company",
                "created_at",
            ]
        ]
        df.rename(
            columns={
                "id": "ID",
                "material": "Material",
                "quantity": "Qty (kg)",
                "price": "Price/kg",
                "location": "Location",
                "company": "Seller",
                "created_at": "Created",
            },
            inplace=True,
        )
        st.dataframe(df, hide_index=True)
    else:
        st.info("No recent listings.")
