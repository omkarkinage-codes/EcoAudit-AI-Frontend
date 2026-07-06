import streamlit as st
import pandas as pd
import hashlib
import os
import datetime
import requests

# --- ENTERPRISE PLATFORM CONFIGURATION ---
st.set_page_config(page_title="EcoAudit AI", page_icon="🌿", layout="wide")

DB_FILE = "users_database.csv"
MARKETPLACE_FILE = "marketplace_database.csv"

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# --- FORCIBLE DATA LAYER WRITER (Creates files locally instantly) ---
def init_storage_layers():
    if not os.path.exists(DB_FILE):
        df = pd.DataFrame(columns=["email", "password", "company_name", "location", "role", "meta_1", "meta_2"])
        df = pd.concat([df, pd.DataFrame([{
            "email": "sahyadri@poly.com",
            "password": hash_password("password123"),
            "company_name": "Sahyadri Polymers & Recycling",
            "location": "Pimpri-Chinchwad Industrial Corridor, Pune",
            "role": "Verified B2B Buyer (Recycling Facility)",
            "meta_1": "MPCB-REG-94821",
            "meta_2": "50 Tons/Month"
        }])], ignore_index=True)
        df.to_csv(DB_FILE, index=False)

    if not os.path.exists(MARKETPLACE_FILE):
        df = pd.DataFrame(columns=["id", "sender_email", "sender_company", "raw_text", "material_type", "quantity", "timestamp"])
        df.to_csv(MARKETPLACE_FILE, index=False)

init_storage_layers()

# --- SYSTEM GLOBAL STATE ARCHITECTURE ---
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
    st.session_state.current_user = None
    st.session_state.current_role = None
    st.session_state.current_tab = "📊 Dashboard"
    st.session_state.started = False
    st.session_state.auth_action = "Sign In"
    st.session_state.selected_role = None
    st.session_state.private_chats = {}

# --- CLEAN USER-FRIENDLY UI CSS DESIGN ---
st.markdown("""
    <style>
    html, body, .stApp {
        background: linear-gradient(rgba(13, 27, 42, 0.94), rgba(13, 27, 42, 0.94)), 
                    url("https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1920&q=80") !important;
        background-size: cover !important;
        background-position: center !important;
        background-attachment: fixed !important;
    }
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap');
    html, body, [class*="css"], .stMarkdown, p, h1, h2, h3, h4, h5, h6 {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
    }
    header[data-testid="stHeader"] { visibility: hidden; height: 0% !important; }
    footer { visibility: hidden; }
    .eco-card {
        background: rgba(30, 41, 59, 0.45) !important;
        backdrop-filter: blur(16px) !important;
        border-radius: 16px !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        padding: 24px !important;
        margin-bottom: 20px !important;
    }
    .stTextInput>div>div>input, .stSelectbox>div>div>div, .stTextArea>div>div>textarea {
        background-color: rgba(15, 23, 42, 0.75) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        color: #E2E8F0 !important;
        border-radius: 8px !important;
    }
    .stButton>button { border-radius: 8px; font-weight: 600; }
    </style>
""", unsafe_allow_html=True)

# ==========================================
# GATEWAY ROOT HOMEPAGE
# ==========================================
if not st.session_state.started and not st.session_state.logged_in:
    col_header_left, col_btn_in, col_btn_up = st.columns([3.8, 0.8, 0.8])
    with col_header_left:
        st.markdown("<h3 style='color:#4ADE80; margin:0;'>EcoAudit AI</h3>", unsafe_allow_html=True)
    with col_btn_in:
        if st.button("Sign In", use_container_width=True):
            st.session_state.started = True
            st.session_state.auth_action = "Sign In"
            st.rerun()
    with col_btn_up:
        if st.button("Sign Up", use_container_width=True):
            st.session_state.started = True
            st.session_state.auth_action = "Sign Up"
            st.rerun()
            
    st.write("---")
    st.markdown("<br><br>", unsafe_allow_html=True)
    _, col_mid_content, _ = st.columns([0.2, 3, 0.2])
    
    with col_mid_content:
        st.markdown("""
            <div class='eco-card'>
                <h2 style='text-align: center; font-weight: 700; color: #FFFFFF; margin-bottom: 15px;'>Automated Circular Supply Chains for Industry</h2>
                <p style='text-align: center; font-size: 1.15rem; color: #94A3B8; line-height: 1.6;'>
                    Instantly turn factory warehouse logs into live market listings and connect with local recycling buyers.
                </p>
            </div>
        """, unsafe_allow_html=True)
        st.write("")
        if st.button("Let's Start", type="primary", use_container_width=True):
            st.session_state.started = True
            st.session_state.auth_action = "Sign In"
            st.rerun()

# ==========================================
# ROBUST AUTHENTICATION REGISTRY CONTROL
# ==========================================
elif st.session_state.started and not st.session_state.logged_in:
    if st.button("← Back to Homepage"):
        st.session_state.started = False
        st.rerun()
    
    st.write("---")
    choice = st.segmented_control("Action Portal", ["Sign In", "Sign Up"], default=st.session_state.auth_action)
    if choice: st.session_state.auth_action = choice

    if st.session_state.auth_action == "Sign In":
        st.markdown("<h2>Sign In to Your Dashboard</h2>", unsafe_allow_html=True)
        email_input = st.text_input("Email Address", placeholder="name@company.com").strip().lower()
        password_input = st.text_input("Password", type="password", placeholder="••••••••").strip()
        
        if st.button("Login", type="primary", use_container_width=True):
            df_users = pd.read_csv(DB_FILE)
            df_users['email'] = df_users['email'].astype(str).str.strip().str.lower()
            user_row = df_users[df_users['email'] == email_input]
            
            if not user_row.empty:
                if str(user_row.iloc[0]['password']) == hash_password(password_input):
                    st.session_state.logged_in = True
                    st.session_state.current_user = email_input
                    st.session_state.current_role = user_row.iloc[0]['role']
                    st.toast("Success!")
                    st.rerun()
                else:
                    st.error("Incorrect password credentials entered.")
            else:
                st.error("Email destination vector matching parameters not found.")
    else:
        if st.session_state.selected_role is None:
            st.markdown("<h3>Select Account Profile Type</h3>", unsafe_allow_html=True)
            c1, c2 = st.columns(2)
            with c1:
                if st.button("Register as Material Seller", type="primary", use_container_width=True):
                    st.session_state.selected_role = "Industrial Seller (Factory / Plant)"
                    st.rerun()
            with c2:
                if st.button("Register as Recycling Buyer", type="primary", use_container_width=True):
                    st.session_state.selected_role = "Verified B2B Buyer (Recycling Facility)"
                    st.rerun()
        else:
            st.markdown(f"### Registering Node: {st.session_state.selected_role}")
            email = st.text_input("Company Email Address").strip().lower()
            password = st.text_input("Create Password", type="password").strip()
            company_name = st.text_input("Company Name").strip()
            location = st.text_input("Location Base City").strip()
            meta_1 = st.text_input("License Verification Token or Main Material").strip()

            if st.button("Complete Registration", type="primary", use_container_width=True):
                if email and password and company_name:
                    df_users = pd.read_csv(DB_FILE)
                    df_users['email'] = df_users['email'].astype(str).str.strip().str.lower()
                    
                    if email in df_users['email'].values:
                        st.error("Account email is already registered.")
                    else:
                        new_u = pd.DataFrame([{
                            "email": email, "password": hash_password(password),
                            "company_name": company_name, "location": location,
                            "role": st.session_state.selected_role, "meta_1": meta_1, "meta_2": "N/A"
                        }])
                        pd.concat([df_users, new_u], ignore_index=True).to_csv(DB_FILE, index=False)
                        st.session_state.logged_in = True
                        st.session_state.current_user = email
                        st.session_state.current_role = st.session_state.selected_role
                        st.rerun()

# ==========================================
# MAIN FULL-STACK EXECUTIVE ENVIRONMENT
# ==========================================
else:
    df_users = pd.read_csv(DB_FILE)
    df_users['email'] = df_users['email'].astype(str).str.strip().str.lower()
    user_meta = df_users[df_users['email'] == st.session_state.current_user].iloc[0]

    # INSTANT RENDER SIDEBAR PANEL (Removes Double-Click Framework Bugs Completely)
    with st.sidebar:
        st.markdown(f"<h2 style='color:#4ADE80; margin:0;'>Console</h2>", unsafe_allow_html=True)
        st.caption(f"Active: {user_meta['company_name']}")
        st.write("---")
        
        if st.button("📊 Dashboard Overview", use_container_width=True): st.session_state.current_tab = "📊 Dashboard"
        
        if st.session_state.current_role == "Industrial Seller (Factory / Plant)":
            if st.button("🚀 Dispatch Byproduct", use_container_width=True): st.session_state.current_tab = "🚀 Dispatch Byproduct"
            if st.button("🛠️ Manage Active Posts", use_container_width=True): st.session_state.current_tab = "🛠️ Manage Posts"
        else:
            if st.button("🛒 Open Procurement", use_container_width=True): st.session_state.current_tab = "🛒 Open Procurement"
            
        if st.button("💬 Communication Terminal", use_container_width=True): st.session_state.current_tab = "💬 Communication Terminal"
        if st.button("⚙️ Profile Settings", use_container_width=True): st.session_state.current_tab = "⚙️ Profile Settings"
        
        st.write("<br><br>" * 4, unsafe_allow_html=True)
        if st.button("Logout", type="secondary", use_container_width=True):
            st.session_state.logged_in = False
            st.session_state.started = False
            st.rerun()

    # --- CORE TAB 1: DASHBOARD ---
    if st.session_state.current_tab == "📊 Dashboard":
        st.title("Dashboard Metrics Overview")
        df_market = pd.read_csv(MARKETPLACE_FILE)
        
        col_m1, col_m2 = st.columns(2)
        col_m1.metric("Global Active Market Items", str(len(df_market)))
        col_m2.metric("Connected Ecosystem Nodes", str(len(df_users)))
        st.write("---")
        
        c1, c2 = st.columns([1.5, 1])
        with c1:
            st.markdown("### 📋 Active Marketplace Stream Ledgers")
            if df_market.empty:
                st.write("*No active byproduct batches listed on the network currently.*")
            else:
                for _, row in df_market.iterrows():
                    st.markdown(f"""
                        <div class='eco-card'>
                            <h4 style='color: #4ADE80; margin:0;'>📦 {row['material_type']} ({row['quantity']})</h4>
                            <p style='color: #E2E8F0; margin-top:5px;'><em>"{row['raw_text']}"</em></p>
                            <small style='color: #64748B;'>Origin Company: {row['sender_company']} | {row['timestamp']}</small>
                        </div>
                    """, unsafe_allow_html=True)
        with c2:
            st.markdown("### 🌐 Active Enterprise Node Directory")
            for _, row in df_users.iterrows():
                if row['email'] != st.session_state.current_user:
                    st.markdown(f"""
                        <div style='background: rgba(255,255,255,0.04); padding: 12px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid #60A5FA;'>
                            <strong style='color: #F8FAFC;'>{row['company_name']}</strong><br>
                            <small style='color: #94A3B8;'>{row['role']} | Location: {row['location']}</small>
                        </div>
                    """, unsafe_allow_html=True)
                    
                    # BI-DIRECTIONAL DETERMINISTIC ROUTING KEY
                    sorted_pair = sorted([st.session_state.current_user, row['email']])
                    shared_room_hash = f"ROOM_{hashlib.md5((sorted_pair[0] + sorted_pair[1]).encode()).hexdigest()}"
                    
                    if st.button(f"Message {row['company_name']}", key=f"dir_{shared_room_hash[:8]}"):
                        st.session_state.active_room_key = shared_room_hash
                        st.session_state.current_tab = "💬 Communication Terminal"
                        st.rerun()

    # --- CORE TAB 2: SELLER FORMS DISPATCH PIPELINE ---
    elif st.session_state.current_tab == "🚀 Dispatch Byproduct":
        st.title("🚀 Log New Byproduct Stream")
        st.write("---")
        
        # Explicit Session Hooks to Guarantee Instant Form Wiping
        if "form_log" not in st.session_state: st.session_state.form_log = ""
        if "form_mat" not in st.session_state: st.session_state.form_mat = ""
        if "form_qty" not in st.session_state: st.session_state.form_qty = ""

        raw_text_input = st.text_area("Paste Raw Warehouse Log / Factory Notes:", value=st.session_state.form_log, key="raw_text_input_f")
        material_type_input = st.text_input("Material Category Mapping", value=st.session_state.form_mat, key="material_type_input_f")
        quantity_input = st.text_input("Total Weight / Volume (Specify 'kg' or 'tons')", value=st.session_state.form_qty, key="quantity_input_f")
        
        if st.button("Post Listing to Market", type="primary", use_container_width=True):
            if raw_text_input.strip() and quantity_input.strip():
                df_market = pd.read_csv(MARKETPLACE_FILE)
                new_post = pd.DataFrame([{
                    "id": f"LOT-{int(datetime.datetime.now().timestamp())}",
                    "sender_email": st.session_state.current_user,
                    "sender_company": user_meta["company_name"],
                    "raw_text": raw_text_input.strip(),
                    "material_type": material_type_input.strip(),
                    "quantity": quantity_input.strip(),
                    "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
                }])
                pd.concat([df_market, new_post], ignore_index=True).to_csv(MARKETPLACE_FILE, index=False)
                
                # RE-ENGINEERED: Wipe input elements instantly from memory before reload frames trigger
                st.session_state.form_log = ""
                st.session_state.form_mat = ""
                st.session_state.form_qty = ""
                
                try:
                    requests.post("https://ecoaudit-ai.app.n8n.cloud/webhook-test/d70c8a5d-55ca-4673-a2a8-fe4b26f9c23f", 
                                  json={"message": raw_text_input, "material": material_type_input, "weight": quantity_input, "sender": st.session_state.current_user}, timeout=2)
                except Exception: pass
                
                st.success("🎯 Material batch listed live! Form cleared out completely.")
                st.rerun()
            else:
                st.error("Please fill out all descriptive parameter values.")

    # --- CORE TAB 3: MODIFICATION ENGINE WORKSPACE ---
    elif st.session_state.current_tab == "🛠️ Manage Posts":
        st.title("🛠️ Manage Your Active Listings")
        st.write("---")
        df_market = pd.read_csv(MARKETPLACE_FILE)
        my_posts = df_market[df_market['sender_email'] == st.session_state.current_user]
        
        if my_posts.empty:
            st.info("You have no active material listings running on the marketplace.")
        else:
            for idx, row in my_posts.iterrows():
                with st.container():
                    st.markdown(f"**Item ID Identification Code:** `{row['id']}` | **Mapped Category:** {row['material_type']}")
                    new_qty = st.text_input("Modify Quantity Tracking Parameter Value:", value=row['quantity'], key=f"edit_{row['id']}")
                    
                    c1, c2, _ = st.columns([1, 1, 4])
                    with c1:
                        if st.button("Save Changes", key=f"save_{row['id']}"):
                            df_market.at[idx, 'quantity'] = new_qty
                            df_market.to_csv(MARKETPLACE_FILE, index=False)
                            st.toast("Quantity Tracking Modded Safely!")
                            st.rerun()
                    with c2:
                        if st.button("Delete Post", key=f"del_{row['id']}"):
                            df_market.drop(idx).to_csv(MARKETPLACE_FILE, index=False)
                            st.toast("Listing Lot Erased Successfully!")
                            st.rerun()
                st.write("---")

    # --- CORE TAB 4: PROCUREMENT WORKSPACE ---
    elif st.session_state.current_tab == "🛒 Open Procurement":
        st.title("🛒 Browse Active Industrial Streams")
        st.write("---")
        df_market = pd.read_csv(MARKETPLACE_FILE)
        
        if df_market.empty:
            st.info("No factories have listed open byproduct paths currently.")
        else:
            for _, row in df_market.iterrows():
                col_x, col_y = st.columns([3, 1])
                with col_x:
                    st.markdown(f"""
                        <div class='eco-card' style='margin-bottom:0;'>
                            <h3 style='color:#4ADE80; margin:0;'>📦 {row['material_type']} ({row['quantity']})</h3>
                            <p style='color:#E2E8F0; margin-top:5px;'><em>"{row['raw_text']}"</em></p>
                            <small style='color:#64748B;'>Factory Node: {row['sender_company']}</small>
                        </div>
                    """, unsafe_allow_html=True)
                with col_y:
                    st.write("<br>", unsafe_allow_html=True)
                    sorted_pair = sorted([st.session_state.current_user, row['sender_email']])
                    shared_room_hash = f"ROOM_{hashlib.md5((sorted_pair[0] + sorted_pair[1]).encode()).hexdigest()}"
                    
                    if st.button("Claim & Open Chat", key=f"claim_{row['id']}", use_container_width=True):
                        st.session_state.active_room_key = shared_room_hash
                        st.session_state.current_tab = "💬 Communication Terminal"
                        st.rerun()

    # --- CORE TAB 5: SYNCHRONIZED NEGOTIATION CHAT TERMINAL ---
    elif st.session_state.current_tab == "💬 Communication Terminal":
        st.title("💬 Secure Negotiation Terminal")
        st.write("---")
        
        rooms_map = {}
        for _, row in df_users.iterrows():
            if row['email'] != st.session_state.current_user:
                sorted_pair = sorted([st.session_state.current_user, row['email']])
                r_hash = f"ROOM_{hashlib.md5((sorted_pair[0] + sorted_pair[1]).encode()).hexdigest()}"
                rooms_map[r_hash] = f"Message Thread with: {row['company_name']}"
                
        if "active_room_key" not in st.session_state or st.session_state.active_room_key not in rooms_map:
            st.session_state.active_room_key = list(rooms_map.keys())[0] if rooms_map else None
            
        if not st.session_state.active_room_key:
            st.info("No communication threads available.")
        else:
            sel_label = st.selectbox("Select Secure Active Channel:", list(rooms_map.values()), index=list(rooms_map.keys()).index(st.session_state.active_room_key) if st.session_state.active_room_key in rooms_map else 0)
            st.session_state.active_room_key = [k for k, v in rooms_map.items() if v == sel_label][0]
            
            curr_room = st.session_state.active_room_key
            if curr_room not in st.session_state.private_chats:
                st.session_state.private_chats[curr_room] = []
                
            # Render Messaging Layers Dynamically
            for msg_idx, chat in enumerate(st.session_state.private_chats[curr_room]):
                col_text, col_act = st.columns([10, 2])
                with col_text:
                    with st.chat_message(chat["role"]):
                        st.write(f"**{chat['sender_name']}**: {chat['msg']}")
                with col_act:
                    st.write("<br>", unsafe_allow_html=True)
                    if st.button("❌ Wipe Message", key=f"msg_del_{curr_room}_{msg_idx}"):
                        st.session_state.private_chats[curr_room].pop(msg_idx)
                        st.rerun()
                        
            text_input_msg = st.chat_input("Type transaction negotiations here...")
            if text_input_msg:
                st.session_state.private_chats[curr_room].append({
                    "role": "user", "sender_name": user_meta["company_name"], "msg": text_input_msg
                })
                st.rerun()

    # --- CORE TAB 6: SETTINGS PROFILE ARCHIVE ---
    elif st.session_state.current_tab == "⚙️ Profile Settings":
        st.title("⚙️ Profile Management")
        st.write("---")
        st.markdown(f"""
            <div class='eco-card'>
                <h3 style='color:#4ADE80; margin:0;'>🏢 {user_meta['company_name']}</h3>
                <hr style='border-color:rgba(255,255,255,0.1);'>
                <p><strong>Account Registry Key:</strong> {user_meta['email']}</p>
                <p><strong>Assigned Verification Node Profile:</strong> {user_meta['role']}</p>
                <p><strong>Base Operations Coordinate City:</strong> {user_meta['location']}</p>
                <p><strong>Business Identity Metrics Token:</strong> {user_meta['meta_1']}</p>
            </div>
        """, unsafe_allow_html=True)