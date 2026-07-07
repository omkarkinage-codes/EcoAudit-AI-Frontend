# components/charts.py
import streamlit as st
import pandas as pd
from database import material_distribution, get_recent_listings


def plot_material_distribution():
    """Bar chart of material counts."""
    data = material_distribution()
    if not data:
        st.info("No material data yet.")
        return
    df = pd.DataFrame(data, columns=["Material", "Count"]).set_index("Material")
    st.bar_chart(df)


def show_recent_listings(limit: int = 5):
    """Table of most recent listings."""
    rec = get_recent_listings(limit=limit)
    if not rec:
        st.info("No recent listings.")
        return
    df = pd.DataFrame(rec)[
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
