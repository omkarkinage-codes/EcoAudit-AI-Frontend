# pages/chat.py
import streamlit as st
from database import (
    get_all_users,
    get_conversation_partners,
    get_messages_between,
    send_message,
    get_user,
)


def chat_page():
    st.title("💬 Business Chat")
    uid = st.session_state.user_id

    # ------------------------------------------------------------------
    # If we arrived here via “Contact Seller”, open that conversation instantly
    # ------------------------------------------------------------------
    partner_id = st.session_state.pop("chat_partner", None)
    if partner_id:
        _show_conversation(uid, partner_id)
        if st.button("← Back to conversations"):
            st.rerun()
        return

    # ------------------------------------------------------------------
    # Choose a partner from a dropdown
    # ------------------------------------------------------------------
    partner_ids = get_conversation_partners(uid)

    if not partner_ids:
        st.info("You have no chats yet – pick any user to start.")
        options = [
            (u["id"], u["company_name"])
            for u in get_all_users()
            if u["id"] != uid
        ]
    else:
        options = [
            (u["id"], u["company_name"])
            for u in get_all_users()
            if u["id"] != uid and u["id"] in partner_ids
        ]

    if not options:
        st.warning("No other users available.")
        return

    partner_id = st.selectbox(
        "Select a conversation partner:",
        options=[p[0] for p in options],
        format_func=lambda x: dict(options)[x],
    )

    _show_conversation(uid, partner_id)


def _show_conversation(user_id: int, partner_id: int):
    partner_name = get_user(partner_id)["company_name"]
    st.subheader(f"Chat with **{partner_name}**")

    msgs = get_messages_between(user_id, partner_id)
    for m in msgs:
        sender = "You" if m["sender_id"] == user_id else partner_name
        st.markdown(f"**{sender}:** {m['message']}")

    st.divider()
    with st.form("msg_form"):
        new_msg = st.text_area("Your message", height=80)
        sent = st.form_submit_button("Send")
        if sent and new_msg.strip():
            send_message(user_id, partner_id, new_msg.strip())
            st.success("Message sent")
            st.rerun()
