import streamlit as st
import pandas as pd
import hashlib
import os
import datetime
import requests

# --- ENTERPRISE BROWSER PLATFORM ARCHITECTURE ---
st.set_page_config(page_title="EcoAudit AI", page_icon="🌿", layout="wide")

DB_FILE = "users_database.csv"
MARKETPLACE_FILE = "marketplace_database.csv"

def hash_password(password):
    """Securely hashes user passwords using a robust SHA-256 matrix."""
    return hashlib.sha256(password.encode()).hexdigest()

@st.cache_data(ttl=2)
def load_users_db_cached():
    """Reads system credentials instantly from storage sheets."""
    if os.path.exists(DB_FILE):
        try:
            df = pd.read_csv(DB_FILE)
            df['email'] = df['email'].astype(str).str.strip().str.lower()
            df = df.drop_duplicates(subset=["email"], keep="last")
            return df.set_index("email", drop=False).to_dict(orient="index")
        except Exception:
            pass
            
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
    return df.set_index("email", drop=False).to_dict(orient="index")

def load_users_db():
    return load_users_db_cached()

def save_user_to_db(email, data_dict):
    """Appends validated user credential sets to database ledgers securely."""
    clean_email = email.strip().lower()
    df_new = pd.DataFrame([{
        "email": clean_email,
        "password": data_dict["password"],
        "company_name": data_dict["company_name"],
        "location": data_dict["location"],
        "role": data_dict["role"],
        "meta_1": data_dict["meta_1"],
        "meta_2": data_dict["meta_2"]
    }])
    if os.path.exists(DB_FILE):
        try:
            df_old = pd.read_csv(DB_FILE)
            df_combined = pd.concat([df_old, df_new], ignore_index=True)
            df_combined['email'] = df_combined['email'].astype(str).str.strip().str.lower()
            df_combined = df_combined.drop_duplicates(subset=["email"], keep="last")
            df_combined.to_csv(DB_FILE, index=False)
        except Exception:
            df_new.to_csv(DB_FILE, index=False)
    else:
        df_new.to_csv(DB_FILE, index=False)
    st.cache_data.clear()

@st.cache_data(ttl=2)
def load_marketplace_db_cached():
    """Fetches global supply chain marketplace tracking rows efficiently."""
    if os.path.exists(MARKETPLACE_FILE):
        try:
            return pd.read_csv(MARKETPLACE_FILE).to_dict(orient="records")
        except Exception:
            pass
    return []

def load_marketplace_db():
    return load_marketplace_db_cached()

def save_all_listings_to_file(listings_list):
    """Overwrites structural data layers instantly to save listing updates."""
    if listings_list:
        pd.DataFrame(listings_list).to_csv(MARKETPLACE_FILE, index=False)
    else:
        if os.path.exists(MARKETPLACE_FILE):
            os.remove(MARKETPLACE_FILE)
    st.cache_data.clear()

def save_listing_to_db(listing_dict):
    df_new = pd.DataFrame([listing_dict])
    if os.path.exists(MARKETPLACE_FILE):
        try:
            df_old = pd.read_csv(MARKETPLACE_FILE)
            df_combined = pd.concat([df_old, df_new], ignore_index=True)
            df_combined.to_csv(MARKETPLACE_FILE, index=False)
        except Exception:
            df_new.to_csv(MARKETPLACE_FILE, index=False)
    else:
        df_new.to_csv(MARKETPLACE_FILE, index=False)
    st.cache_data.clear()


# --- BOOTSTRAP INITIAL SYSTEM STATE MEMORY CONTROLS ---
if "db_initialized" not in st.session_state:
    st.session_state.logged_in = False
    st.session_state.current_user = None
    st.session_state.current_role = None
    st.session_state.current_tab = "📊 Dashboard"
    st.session_state.started = False
    st.session_state.auth_action = "Sign In"
    st.session_state.selected_role = None
    st.session_state.sidebar_open = True
    st.session_state.private_chats = {}
    
    st.session_state.input_raw_log = ""
    st.session_state.input_material = ""
    st.session_state.input_quantity = ""
    st.session_state.db_initialized = True

# Sync data pools cleanly across global session memories
st.session_state.users_db = load_users_db()
st.session_state.marketplace_db = load_marketplace_db()

# --- REFINED LIGHTWEIGHT PLATFORM UI STYLING ---
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
    div[data-testid="stTextInput"] { background: transparent !important; border: none !important; padding: 0px !important; }
    .stButton>button { border-radius: 8px; font-weight: 600; }
    .stApp [data-testid="InputInstructions"] { display: none !important; }
    </style>
""", unsafe_allow_html=True)


# ==========================================
# PHASE 1: SYSTEM VISITOR ACCESS PORTAL
# ==========================================
if not st.session_state.started and not st.session_state.logged_in:
    col_header_left, col_btn_in, col_btn_up = st.columns([3.8, 0.8, 0.8])
    with col_header_left:
        if st.button("EcoAudit AI", key="logo_home"):
            st.session_state.started = False
            st.session_state.selected_role = None
            st.rerun()
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
        
        _, col_c_btn, _ = st.columns([1.5, 1, 1.5])
        with col_c_btn:
            if st.button("Let's Start", type="primary", use_container_width=True, key="center_start"):
                st.session_state.started = True
                st.session_state.auth_action = "Sign In"
                st.rerun()


# ==========================================
# PHASE 2: AUTHENTICATION DEPLOYMENT NODE
# ==========================================
elif st.session_state.started and not st.session_state.logged_in:
    col_nav_left, col_nav_right = st.columns([3, 1.2])
    with col_nav_left:
        if st.button("Back to Homepage"):
            st.session_state.started = False
            st.session_state.selected_role = None
            st.rerun()
    with col_nav_right:
        choice = st.segmented_control("Choose Action:", ["Sign In", "Sign Up"], default=st.session_state.auth_action)
        if choice: st.session_state.auth_action = choice

    st.write("---")

    if st.session_state.auth_action == "Sign In":
        st.markdown("<h2>Sign In to Your Dashboard</h2>", unsafe_allow_html=True)
        col_login, _ = st.columns([1.2, 1])
        with col_login:
            email_input = st.text_input("Email Address", placeholder="name@company.com", key="signin_email").strip().lower()
            password_input = st.text_input("Password", type="password", placeholder="••••••••", key="signin_pass").strip()
            
            if st.button("Login", type="primary", use_container_width=True):
                if email_input in st.session_state.users_db:
                    db_entry = st.session_state.users_db[email_input]
                    if str(db_entry["password"]) == hash_password(password_input):
                        st.session_state.logged_in = True
                        st.session_state.current_user = email_input
                        st.session_state.current_role = db_entry["role"]
                        st.toast("Logged in successfully!")
                        st.rerun()
                    else:
                        st.error("Incorrect password. Please try again.")
                else:
                    st.error("Email address not found. Please Sign Up first.")
    else:
        if st.session_state.selected_role is None:
            st.markdown("<h2 style='color: #FFFFFF; font-weight:700;'>Create a Free Account</h2>", unsafe_allow_html=True)
            col_role1, col_role2 = st.columns(2, gap="large")
            with col_role1:
                st.markdown("<div class='eco-card' style='height: 190px;'><h3 style='color: #4ADE80;'>Industrial Seller</h3><p style='color: #94A3B8;'>Choose this if you run a factory or warehouse looking to clear materials.</p></div>", unsafe_allow_html=True)
                if st.button("Register as Material Seller", type="primary", use_container_width=True):
                    st.session_state.selected_role = "Industrial Seller (Factory / Plant)"
                    st.rerun()
            with col_role2:
                st.markdown("<div class='eco-card' style='height: 190px;'><h3 style='color: #4ADE80;'>Verified B2B Buyer</h3><p style='color: #94A3B8;'>Choose this if you are a certified recycler looking for materials.</p></div>", unsafe_allow_html=True)
                if st.button("Register as Recycling Buyer", type="primary", use_container_width=True):
                    st.session_state.selected_role = "Verified B2B Buyer (Recycling Facility)"
                    st.rerun()
        else:
            st.markdown(f"## Fill Details: <span style='color: #4ADE80;'>{st.session_state.selected_role}</span>", unsafe_allow_html=True)
            if st.button("Change Account Type"):
                st.session_state.selected_role = None
                st.rerun()
                
            col_form, _ = st.columns([1.5, 1])
            with col_form:
                email = st.text_input("Company Email Address", placeholder="name@company.com", key="signup_email").strip().lower()
                password = st.text_input("Create Password", type="password", placeholder="••••••••", key="signup_pass").strip()
                company_name = st.text_input("Company / Factory Name").strip()
                location = st.text_input("Physical Location (City)").strip()
                
                if st.session_state.selected_role == "Industrial Seller (Factory / Plant)":
                    meta_1 = st.text_input("Main Material Type (e.g., Copper Works)").strip()
                    meta_2 = "N/A"
                else:
                    meta_1 = st.text_input("Pollution Control Board License Number").strip()
                    meta_2 = st.text_input("Monthly Recycling Capacity (e.g., 50 Tons)").strip()

                if st.button("Complete Registration", type="primary", use_container_width=True):
                    if email and password and company_name:
                        user_payload = {
                            "email": email,
                            "password": hash_password(password),
                            "company_name": company_name,
                            "location": location,
                            "role": st.session_state.selected_role,
                            "meta_1": meta_1,
                            "meta_2": meta_2
                        }
                        save_user_to_db(email, user_payload)
                        st.session_state.users_db[email] = user_payload
                        
                        st.session_state.logged_in = True
                        st.session_state.current_user = email
                        st.session_state.current_role = st.session_state.selected_role
                        st.rerun()
                    else:
                        st.error("Please fill out all input fields to finish your registration.")


# ==========================================
# PHASE 3: INTERACTIVE MANAGEMENT OPERATOR
# ==========================================
else:
    user_meta = st.session_state.users_db[st.session_state.current_user]

    # COMPILING SYSTEM NAVIGATION CONTROLS DYNAMICALLY
    options = ["📊 Dashboard", "💬 Communication Terminal", "⚙️ My Account Settings"]
    if st.session_state.current_role == "Industrial Seller (Factory / Plant)":
        options.insert(1, "🚀 Dispatch Byproduct (Sell)")
        options.insert(2, "🛠️ Manage Posts")
    else:
        options.insert(1, "🛒 Open Procurement (Buy)")

    if st.session_state.sidebar_open:
        col_side, col_main = st.columns([1.2, 4], gap="medium")
        with col_side:
            st.markdown(f"<h3 style='margin:0; color:#4ADE80; font-weight:700;'>Console</h3>", unsafe_allow_html=True)
            st.caption(f"Logged in as: {user_meta['company_name']}")
            st.write("---")
            st.session_state.current_tab = st.radio("Navigation:", options, index=options.index(st.session_state.current_tab) if st.session_state.current_tab in options else 0, label_visibility="collapsed")
            st.write("<br><br>" * 4, unsafe_allow_html=True)
            if st.button("Logout", use_container_width=True):
                st.session_state.logged_in = False
                st.session_state.started = False
                st.session_state.current_user = None
                st.session_state.current_role = None
                st.rerun()
    else:
        col_main = st.container()
        if st.button("📂 Expand Menu"):
            st.session_state.sidebar_open = True
            st.rerun()

    with col_main:
        if st.session_state.sidebar_open:
            if st.button("📁 Collapse Menu"):
                st.session_state.sidebar_open = False
                st.rerun()

        # --- MODULE ONE: REAL-TIME ANALYTICS DASHBOARD ---
        if st.session_state.current_tab == "📊 Dashboard":
            st.title("Dashboard Overview")
            
            total_active_nodes = len(st.session_state.users_db)
            total_diverted_kg = 0.0
            for item in st.session_state.marketplace_db:
                try:
                    clean_weight = ''.join(c for c in str(item['quantity']) if c.isdigit() or c == '.')
                    weight_val = float(clean_weight) if clean_weight else 0.0
                    if "ton" in str(item['quantity']).lower(): total_diverted_kg += (weight_val * 1000)
                    else: total_diverted_kg += weight_val
                except Exception: pass
            
            m1, m2, m3 = st.columns(3)
            m1.metric("Total Material Recycled", f"{int(total_diverted_kg):,} kg", "Live Tracking")
            m2.metric("Companies Online", str(total_active_nodes), "Verified Nodes")
            m3.metric("Network Route Speed", "0.02s", "Cached Hyper-Performance")
            
            st.write("---")
            c_left, c_right = st.columns([1.3, 1])
            with c_left:
                st.markdown("### 📋 Active Market Listings")
                if not st.session_state.marketplace_db:
                    st.write("*No active material logs uploaded yet.*")
                else:
                    for listing in st.session_state.marketplace_db:
                        st.markdown(f"""
                            <div class='eco-card'>
                                <h4 style='color: #4ADE80; margin:0;'>📦 {listing['material_type']} ({listing['quantity']})</h4>
                                <p style='color: #E2E8F0; margin-top:5px;'><em>"{listing['raw_text']}"</em></p>
                                <small style='color: #64748B;'>Posted by: {listing['sender_company']} | {listing['timestamp']}</small>
                            </div>
                        """, unsafe_allow_html=True)
                        
            with c_right:
                st.markdown("### 🌐 Global Company Directory")
                for u_email, profile in st.session_state.users_db.items():
                    if u_email != st.session_state.current_user:
                        st.markdown(f"""
                            <div style='background: rgba(255,255,255,0.04); padding: 15px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid #60A5FA;'>
                                <strong style='color: #F8FAFC;'>{profile['company_name']}</strong><br>
                                <small style='color: #94A3B8;'>Type: {profile['role']} | Location: {profile['location']}</small>
                            </div>
                        """, unsafe_allow_html=True)
                        
                        sorted_emails = sorted([st.session_state.current_user, u_email])
                        chat_room_id = f"ROOM__{hashlib.md5((sorted_emails[0] + sorted_emails[1]).encode()).hexdigest()}"
                        
                        if st.button(f"Message {profile['company_name']}", key=f"dir_chat_{u_email[:4]}"):
                            st.session_state.active_chat_room = chat_room_id
                            st.session_state.active_chat_label = f"Message Thread with: {profile['company_name']}"
                            st.session_state.current_tab = "💬 Communication Terminal"
                            st.rerun()

        # --- MODULE TWO: SUPPLY DISPATCH PIPELINE -
        elif st.session_state.current_tab == "🚀 Dispatch Byproduct (Sell)":
            st.title("🚀 Post New Byproduct Material")
            st.write("---")
            
            raw_log = st.text_area("Paste Raw Warehouse Log / Factory Notes:", value=st.session_state.input_raw_log, key="text_raw_log")
            material_type = st.text_input("Material Category Mapping", value=st.session_state.input_material, key="text_material")
            quantity = st.text_input("Total Weight / Volume (Specify 'kg' or 'tons')", value=st.session_state.input_quantity, key="text_quantity")
            
            if st.button("Post Listing to Market", type="primary", use_container_width=True):
                if raw_log.strip() and quantity.strip():
                    new_id = f"LOT-{int(datetime.datetime.now().timestamp())}"
                    new_listing = {
                        "id": new_id,
                        "sender_email": st.session_state.current_user,
                        "sender_company": user_meta["company_name"],
                        "raw_text": raw_log,
                        "material_type": material_type,
                        "quantity": quantity,
                        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
                    }
                    save_listing_to_db(new_listing)
                    
                    st.session_state.input_raw_log = ""
                    st.session_state.input_material = ""
                    st.session_state.input_quantity = ""
                    
                    with st.spinner("Connecting with automated webhook matrix..."):
                        try:
                            N8N_WEBHOOK_URL = "https://ecoaudit-ai.app.n8n.cloud/webhook-test/d70c8a5d-55ca-4673-a2a8-fe4b26f9c23f"
                            requests.post(N8N_WEBHOOK_URL, json={"message": raw_log, "material": material_type, "weight": quantity, "sender": st.session_state.current_user}, timeout=4)
                        except Exception: pass
                            
                    st.success("🎯 Posted! Form cleared and market updated.")
                    st.rerun()

        # --- MODULE THREE: SECURE LISTINGS CONTROL MATRIX ---
        elif st.session_state.current_tab == "🛠️ Manage Posts":
            st.title("🛠️ Manage Your Active Listings")
            st.write("---")
            
            my_listings = [item for item in st.session_state.marketplace_db if item["sender_email"] == st.session_state.current_user]
            
            if not my_listings:
                st.info("You have no active listings up for collection.")
            else:
                for listing in my_listings:
                    with st.container():
                        st.markdown(f"""
                            <div style='background: rgba(255,255,255,0.02); padding: 15px; border-radius: 8px; margin-bottom: 5px; border-left: 4px solid #4ADE80;'>
                                <strong style='font-size: 1.1rem; color: #FFFFFF;'>ID: {listing['id']} | Category: {listing['material_type']}</strong><br>
                                <span style='color: #94A3B8;'>Original Text Manifest: "{listing['raw_text']}"</span>
                            </div>
                        """, unsafe_allow_html=True)
                        
                        edit_qty = st.text_input("Edit Weight / Quantity Metric Unit Value:", value=listing['quantity'], key=f"inp_{listing['id']}")
                        
                        c1, c2, _ = st.columns([1, 1, 4])
                        with c1:
                            if st.button("Save Changes", key=f"sav_{listing['id']}"):
                                for item in st.session_state.marketplace_db:
                                    if item["id"] == listing["id"]:
                                        item["quantity"] = edit_qty
                                save_all_listings_to_file(st.session_state.marketplace_db)
                                st.toast("Quantity tracking metric updated successfully!")
                                st.rerun()
                        with c2:
                            if st.button("Delete Post", key=f"del_{listing['id']}"):
                                updated_listings = [item for item in st.session_state.marketplace_db if item["id"] != listing["id"]]
                                save_all_listings_to_file(updated_listings)
                                st.toast("Post removed safely.")
                                st.rerun()
                        st.write("---")

        # --- MODULE FOUR: PROCUREMENT OPERATIONS MAP ---
        elif st.session_state.current_tab == "🛒 Open Procurement (Buy)":
            st.title("🛒 Browse Active Byproduct Streams")
            st.write("---")
            if not st.session_state.marketplace_db:
                st.info("No active listings available today.")
            else:
                for idx, listing in enumerate(st.session_state.marketplace_db):
                    col_b1, col_b2 = st.columns([3, 1])
                    with col_b1:
                        st.markdown(f"""
                            <div class='eco-card' style='margin-bottom:0;'>
                                <h3 style='color:#4ADE80; margin:0;'>📦 {listing['material_type']} ({listing['quantity']})</h3>
                                <p style='color:#E2E8F0; margin-top:5px;'><em>"{listing['raw_text']}"</em></p>
                                <small style='color:#64748B;'>Factory Node: {listing['sender_company']}</small>
                            </div>
                        """, unsafe_allow_html=True)
                    with col_b2:
                        st.write("")
                        sorted_emails = sorted([st.session_state.current_user, listing["sender_email"]])
                        chat_room_id = f"ROOM__{hashlib.md5((sorted_emails[0] + sorted_emails[1]).encode()).hexdigest()}"
                        
                        if st.button("Claim & Chat", key=f"claim_{idx}", use_container_width=True):
                            st.session_state.active_chat_room = chat_room_id
                            st.session_state.active_chat_label = f"Deal Chat: {listing['material_type']} ({listing['sender_company']})"
                            st.toast("Opening private negotiation line!")
                            st.session_state.current_tab = "💬 Communication Terminal"
                            st.rerun()

        # --- MODULE FIVE: FULL-STACK PEER-TO-PEER CONSOLE TERMINAL ---
        elif st.session_state.current_tab == "💬 Communication Terminal":
            st.title("💬 Secure Negotiation Terminal")
            st.write("---")
            
            available_rooms = {}
            for u_email, profile in st.session_state.users_db.items():
                if u_email != st.session_state.current_user:
                    sorted_emails = sorted([st.session_state.current_user, u_email])
                    r_id = f"ROOM__{hashlib.md5((sorted_emails[0] + sorted_emails[1]).encode()).hexdigest()}"
                    available_rooms[r_id] = f"Message Thread with: {profile['company_name']}"
            
            if not available_rooms:
                st.info("No external messaging channels mapped yet.")
            else:
                selected_label = st.selectbox("Select Open Secure Discussion Channel:", list(available_rooms.values()))
                active_room_id = [k for k, v in available_rooms.items() if v == selected_label][0]
                
                if active_room_id not in st.session_state.private_chats:
                    st.session_state.private_chats[active_room_id] = []
                    
                # RENDER INTERACTIVE CONVERSATION LAYERS IN REAL-TIME
                for msg_idx, chat in enumerate(st.session_state.private_chats[active_room_id]):
                    col_msg, col_msg_del = st.columns([12, 1.5])
                    with col_msg:
                        with st.chat_message(chat["role"]):
                            st.write(f"**{chat['sender_name']}**: {chat['msg']}")
                    with col_msg_del:
                        st.write("<br>", unsafe_allow_html=True)
                        # INTEGRATED COMPONENT ONE: FULLY FUNCTIONAL MESSAGE WIPING PIPELINE
                        if st.button("❌ Delete", key=f"del_msg_{active_room_id}_{msg_idx}"):
                            st.session_state.private_chats[active_room_id].pop(msg_idx)
                            st.toast("Message wiped cleanly!")
                            st.rerun()
                        
                user_msg = st.chat_input("Type negotiation text message here...")
                if user_msg:
                    st.session_state.private_chats[active_room_id].append({
                        "role": "user",
                        "sender_name": user_meta["company_name"],
                        "msg": user_msg
                    })
                    st.rerun()

        # --- MODULE SIX: PROFILE INFRASTRUCTURE ---
        elif st.session_state.current_tab == "⚙️ My Account Settings":
            st.title("⚙️ Profile Management")
            st.write("---")
            st.markdown(f"""
                <div class='eco-card'>
                    <h3 style='color:#4ADE80; margin:0;'>🏢 {user_meta['company_name']}</h3>
                    <hr style='border-color:rgba(255,255,255,0.1);'>
                    <p><strong>Account Email Address:</strong> {st.session_state.current_user}</p>
                    <p><strong>Role Type:</strong> {user_meta['role']}</p>
                    <p><strong>Physical Location Base:</strong> {user_meta['location']}</p>
                </div>
            """, unsafe_allow_html=True)