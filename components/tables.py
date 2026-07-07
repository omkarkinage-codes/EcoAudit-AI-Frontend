  
# components/tables.py
import streamlit as st
import pandas as pd


def display_table(df: pd.DataFrame, title: str | None = None):
    """Standardised dataframe view."""
    if title:
        st.subheader(title)
    st.dataframe(df, hide_index=True)
