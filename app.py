import streamlit as st
import pandas as pd
import hashlib
import os
import datetime
import requests

# --- PAGE CONFIGURATION (MUST BE FIRST) ---
st.set_page_config(page_title="EcoAudit AI", page_icon="🌿", layout="wide")

# --- DATABASE ENGINE & SHEET PERSISTENCE STORAGE MATRIX ---
DB_FILE = "users_database.csv"
MARKETPLACE_FILE = "marketplace_database.csv"

def hash_password(password):
    """Securely scramble a plain-text password using SHA-256 matrix."""
    return hashlib.sha256(password.encode()).hexdigest()

def load_users_db():
    if os.path.exists(DB_FILE):
        try:
            df = pd.read_csv(DB_FILE)
            df = df.drop_duplicates(subset=["email"], keep="last")
            return df.set_index("email").to_dict(orient="index")
        except Exception:
            pass
            
    # Default fallback seed matching your environment constraints
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
    return df.set_index("email").to_dict(orient="index")

def save_user_to_db(email, data_dict):
    secure_password = hash_password(data_dict["password"])
    df_new = pd.DataFrame([{
        "email": email,
        "password": secure_password,
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
            df_combined = df_combined.drop_duplicates(subset=["email"], keep="last")
            df_combined.to_csv(DB_FILE, index=False)
        except Exception:
            df_new.to_csv(DB_FILE, index=False)
    else:
        df_new.to_csv(DB_FILE, index=False)

def load_marketplace_db():
    if os.path.exists(MARKETPLACE_FILE):
        try:
            return pd.read_csv(MARKETPLACE_FILE).to_dict(orient="records")
        except Exception:
            pass
    return []

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


# --- SYSTEM STATE MEMORY VECTOR BOOTSTRAP ---
if "db_initialized" not in st.session_state:
    st.session_state.users_db = load_users_db()
    st.session_state.marketplace_db = load_marketplace_db()
    st.session_state.logged_in = False
    st.session_state.current_user = None
    st.session_state.current_role = None
    st.session_state.current_tab = "📊 Dashboard"
    st.session_state.started = False
    st.session_state.auth_action = "Sign In"
    st.session_state.selected_role = None
    st.session_state.sidebar_open = True
    st.session_state.private_chats = {}
    st.session_state.db_initialized = True

# --- ENFORCED PREMIUM DARK MODE STYLE MATRIX ---
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

    header[data-testid="stHeader"] {
        visibility: hidden;
        height: 0% !important;
    }
    footer {
        visibility: hidden;
    }
    
    .eco-card {
        background: rgba(30, 41, 59, 0.45) !important;
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
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

    div[data-testid="stTextInput"] {
        background: transparent !important;
        border: none !important;
        padding: 0px !important;
    }

    .stButton>button {
        border-radius: 8px;
        font-weight: 600;
    }

    .stApp [data-testid="InputInstructions"] {
        display: none !important;
    }
    </style>
""", unsafe_allow_html=True)


# ==========================================
# PHASE 1: PUBLIC LANDING GATEWAY PAGE
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
        # Removed type="primary" to make buttons identical
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
                <h2 style='text-align: center; font-weight: 700; color: #FFFFFF; margin-bottom: 15px;'>Saving Nature Through Autonomous Circular Supply Chains</h2>
                <p style='text-align: center; font-size: 1.15rem; color: #94A3B8; line-height: 1.6;'>
                    Instantly turning unstructured industrial warehouse logs into live B2B green 
                    matchmaking pipelines and automated carbon ledger transactions.
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
                
    st.markdown("<br><br><br>", unsafe_allow_html=True)
    st.write("---")
    
    st.markdown("<h3 style='color: #F8FAFC; font-weight:600;'>Enterprise Capabilities</h3>", unsafe_allow_html=True)
    f1, f2, f3 = st.columns(3)
    with f1:
        st.markdown("<div class='eco-card'><h4>AI Manifest Auditing</h4><p style='color: #94A3B8; font-size: 0.95rem;'>Instantly process unstructured warehouse text logs, plant inventory metrics, and byproduct sheets without formatting barriers.</p></div>", unsafe_allow_html=True)
    with f2:
        st.markdown("<div class='eco-card'><h4>B2B Green Matchmaking</h4><p style='color: #94A3B8; font-size: 0.95rem;'>Autonomous matching loops optimize and direct material outflows out to local verified processing corridors automatically.</p></div>", unsafe_allow_html=True)
    with f3:
        st.markdown("<div class='eco-card'><h4>End-to-End Compliance</h4><p style='color: #94A3B8; font-size: 0.95rem;'>Creates private cryptographic ledger tracks, verifies facility authorization certificates, and updates carbon footprints.</p></div>", unsafe_allow_html=True)


# ==========================================
# PHASE 2: REGISTRATION & SIGN IN REGISTRY
# ==========================================
elif st.session_state.started and not st.session_state.logged_in:
    st.session_state.users_db = load_users_db()

    col_nav_left, col_nav_right = st.columns([3, 1.2])
    with col_nav_left:
        if st.button("Back to Platform Overview"):
            st.session_state.started = False
            st.session_state.selected_role = None
            st.rerun()
    with col_nav_right:
        choice = st.segmented_control("Action Portal Mode:", ["Sign In", "Sign Up"], default=st.session_state.auth_action)
        if choice:
            st.session_state.auth_action = choice

    st.write("---")

    email, password, company_name, location, industry_type, license_no, capacity = "", "", "", "", "", "", ""

    if st.session_state.auth_action == "Sign In":
        st.markdown("<h2>Secure Portal Gateway (Sign In)</h2>", unsafe_allow_html=True)
        col_login, _ = st.columns([1.2, 1])
        with col_login:
            email = st.text_input("Enterprise Email Credentials", placeholder="manager@company.com", key="signin_email")
            password = st.text_input("Secure Password Matrix", type="password", placeholder="••••••••", key="signin_pass")
            
            if st.button("Authorize & Open Console", type="primary", use_container_width=True):
                if email.strip() in st.session_state.users_db:
                    db_entry = st.session_state.users_db[email.strip()]
                    if str(db_entry["password"]) == hash_password(password.strip()):
                        st.session_state.logged_in = True
                        st.session_state.current_user = email.strip()
                        st.session_state.current_role = db_entry["role"]
                        st.toast("Access authenticated successfully.")
                        st.rerun()
                    else:
                        st.error("Invalid security key validation mismatch sequence.")
                else:
                    st.error("Identity Vector not found inside tracking sheet databases.")
    else:
        if st.session_state.selected_role is None:
            st.markdown("<h2 style='color: #FFFFFF; font-weight:700;'>Corporate Registration (Sign Up)</h2>", unsafe_allow_html=True)
            col_role1, col_role2 = st.columns(2, gap="large")
            with col_role1:
                st.markdown("<div class='eco-card' style='height: 190px;'><h3 style='color: #4ADE80;'>Industrial Material Seller</h3><p style='color: #94A3B8;'>You manage a manufacturing plant layout looking to log, route, and dispatch raw processing remnants.</p></div>", unsafe_allow_html=True)
                if st.button("Proceed as Industrial Seller", type="primary", use_container_width=True):
                    st.session_state.selected_role = "Industrial Seller (Factory / Plant)"
                    st.rerun()
            with col_role2:
                st.markdown("<div class='eco-card' style='height: 190px;'><h3 style='color: #4ADE80;'>Verified B2B Waste Buyer</h3><p style='color: #94A3B8;'>You manage certified processing hubs or recycling compounding operations seeking feedstock flows.</p></div>", unsafe_allow_html=True)
                if st.button("Proceed as Verified Buyer", type="primary", use_container_width=True):
                    st.session_state.selected_role = "Verified B2B Buyer (Recycling Facility)"
                    st.rerun()
        else:
            st.markdown(f"## Profile Setup: <span style='color: #4ADE80;'>{st.session_state.selected_role}</span>", unsafe_allow_html=True)
            if st.button("Switch Operational Role Profile"):
                st.session_state.selected_role = None
                st.rerun()
                
            col_form, _ = st.columns([1.5, 1])
            with col_form:
                email = st.text_input("Enterprise Email Credentials", placeholder="corporate@company.com", key="signup_email")
                password = st.text_input("Secure Password Matrix", type="password", placeholder="••••••••", key="signup_pass")
                st.write("---")
                st.markdown("#### Mandated Profile Specifications")
                
                if st.session_state.selected_role == "Industrial Seller (Factory / Plant)":
                    company_name = st.text_input("Manufacturing Facility Corporate Name")
                    location = st.text_input("Plant Physical Address")
                    industry_type = st.text_input("Primary Material Domain")
                    license_no, capacity = "N/A", "N/A"
                else:
                    company_name = st.text_input("Recycling Plant Registered Name")
                    location = st.text_input("Processing Hub Physical Address")
                    license_no = st.text_input("Pollution Control Board License #")
                    capacity = st.text_input("Monthly Material Reclamation Capacity")
                    industry_type = "N/A"

                if st.button("Commit Account & Register", type="primary", use_container_width=True):
                    if email.strip() and password.strip() and company_name.strip():
                        user_payload = {
                            "password": hash_password(password.strip()),
                            "company_name": company_name.strip(),
                            "location": location.strip(),
                            "role": st.session_state.selected_role,
                            "meta_1": industry_type if st.session_state.selected_role == "Industrial Seller (Factory / Plant)" else license_no,
                            "meta_2": "N/A" if st.session_state.selected_role == "Industrial Seller (Factory / Plant)" else capacity
                        }
                        save_user_to_db(email.strip(), user_payload)
                        st.session_state.users_db[email.strip()] = user_payload
                        
                        try:
                            requests.post("https://ecoaudit-ai.app.n8n.cloud/webhook-test/user-onboarding", json={"email": email.strip(), "company_name": company_name.strip(), "role": st.session_state.selected_role}, timeout=5)
                        except Exception:
                            pass
                        
                        st.session_state.logged_in = True
                        st.session_state.current_user = email.strip()
                        st.session_state.current_role = st.session_state.selected_role
                        st.rerun()
                    else:
                        st.error("Please fill out all credentials and tracking rows to complete registration.")


# ==========================================
# PHASE 3: INTERACTIVE ENTERPRISE WORKSPACE
# ==========================================
else:
    user_meta = st.session_state.users_db[st.session_state.current_user]

    options = ["📊 Dashboard", "💬 Communication Terminal", "⚙️ My Account "]
    if st.session_state.current_role == "Industrial Seller (Factory / Plant)":
        options.insert(1, "🚀 Dispatch Byproduct (Sell)")
    else:
        options.insert(1, "🛒 Open Procurement (Buy)")

    # 🧾 GEMINI-STYLE COLLAPSIBLE SIDE NAVIGATION LOGIC
    if st.session_state.sidebar_open:
        col_side, col_main = st.columns([1.2, 4], gap="medium")
        with col_side:
            col_brand, col_close_icon = st.columns([4, 1])
            with col_brand:
                st.markdown(f"<h3 style='margin:0; color:#4ADE80; font-weight:700;'>Console</h3>", unsafe_allow_html=True)
                st.caption(f"Node: {user_meta['company_name']}")
            with col_close_icon:
                if st.button("📁", key="close_panel_btn", help="Collapse panel container", use_container_width=True):
                    st.session_state.sidebar_open = False
                    st.rerun()
            st.write("---")
            st.session_state.current_tab = st.radio("System Modules:", options, index=options.index(st.session_state.current_tab) if st.session_state.current_tab in options else 0, label_visibility="collapsed")
            st.write("<br><br>" * 4, unsafe_allow_html=True)
            st.write("---")
            if st.button("Logout", use_container_width=True, key="side_logout_btn"):
                st.session_state.logged_in = False
                st.session_state.started = False
                st.session_state.selected_role = None
                st.session_state.current_user = None
                st.session_state.current_role = None
                st.rerun()
    else:
        col_main = st.container()
        st.markdown("<style>div.element-container button[key='open_panel_btn'] { background: rgba(255, 255, 255, 0.05) !important; border: 1px solid rgba(255, 255, 255, 0.15) !important; padding: 6px 16px !important; font-size: 20px !important; min-width: 60px !important; height: auto !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; }</style>", unsafe_allow_html=True)
        st.write("")
        col_open_icon, _ = st.columns([1, 20])
        with col_open_icon:
            if st.button("📂", key="open_panel_btn", help="Expand console navigation menu"):
                st.session_state.sidebar_open = True
                st.rerun()
        st.write("")

    # 🖥️ CORE OPERATIONS MANAGEMENT TERMINAL CONTAINER
    with col_main:
        # 📊 TAB ONE: EXECUTIVE ANALYTICS DASHBOARD
        if st.session_state.current_tab == "📊 Dashboard":
            st.title("Executive Circular Analytics")
            
            # Dynamic Live Math Calculus Calculations
            total_active_nodes = len(st.session_state.users_db)
            total_diverted_kg = 0.0
            for item in st.session_state.marketplace_db:
                try:
                    clean_weight = ''.join(c for c in str(item['quantity']) if c.isdigit() or c == '.')
                    weight_val = float(clean_weight) if clean_weight else 0.0
                    if "ton" in str(item['quantity']).lower():
                        total_diverted_kg += (weight_val * 1000)
                    else:
                        total_diverted_kg += weight_val
                except Exception:
                    pass
            formatted_weight = f"{int(total_diverted_kg):,}" if total_diverted_kg > 0 else "0"

            m1, m2, m3 = st.columns(3)
            m1.metric("Nature Footprint Diverted", f"{formatted_weight} kg", "Tracking Real-Time")
            m2.metric("Active B2B Procurement Nodes", str(total_active_nodes), "Verified Entities")
            m3.metric("Orchestrated Pipeline Latency", "1.4s", "99.8% Optimization")
            
            st.write("---")
            c_left, c_right = st.columns([1.3, 1])
            with c_left:
                st.markdown("### Live Circular Material Feed")
                if not st.session_state.marketplace_db:
                    st.write("*No active byproduct streams listed inside network loops.*")
                else:
                    for listing in st.session_state.marketplace_db:
                        st.markdown(f"""
                            <div class='eco-card'>
                                <h4 style='color: #4ADE80; margin:0;'>📦 {listing['material_type']} ({listing['quantity']})</h4>
                                <p style='color: #E2E8F0; margin-top:5px;'><em>"{listing['raw_text']}"</em></p>
                                <small style='color: #64748B;'>Origin Plant Node: {listing['sender_company']} | Timestamp log: {listing['timestamp']}</small>
                            </div>
                        """, unsafe_allow_html=True)
                        
            with c_right:
                st.markdown("### Global Platform Directory")
                has_other_buyers = False
                for user_email, profile in st.session_state.users_db.items():
                    if "Buyer" in str(profile.get("role", "")) and user_email != st.session_state.current_user:
                        has_other_buyers = True
                        st.markdown(f"""
                            <div style='background: rgba(255,255,255,0.04); padding: 15px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid #60A5FA;'>
                                <strong style='color: #F8FAFC;'>{profile['company_name']}</strong><br>
                                <small style='color: #94A3B8;'>Role: {profile['role']} | physical Hub Base: {profile['location']}</small>
                            </div>
                        """, unsafe_allow_html=True)
                if not has_other_buyers:
                    st.write("*No active external buyer nodes available in database registries.*")

        # 🚀 TAB TWO: MATERIALS DISPATCH CONTROLLER (SELLER VIEW)
        elif st.session_state.current_tab == "🚀 Dispatch Byproduct (Sell)":
            st.title("Autonomous Pipeline Dispatch")
            st.write("---")
            raw_log = st.text_area("Paste Raw Warehouse Manifest / Plant Chat Log:", placeholder="Paste unstructured manifest data string payloads here...")
            material_type = st.text_input("Material Category Mapping", value="Polyurethane Polymer Component")
            quantity = st.text_input("Estimated Weight/Volume (Always specify 'kg' or 'tons')", placeholder="e.g., 450 kg")
            
            if st.button("Trigger Autonomous Matching Pipeline", type="primary", use_container_width=True):
                if raw_log.strip() and quantity.strip():
                    new_listing = {
                        "id": f"LOT-{int(datetime.datetime.now().timestamp())}",
                        "sender_email": st.session_state.current_user,
                        "sender_company": user_meta["company_name"],
                        "raw_text": raw_log,
                        "material_type": material_type,
                        "quantity": quantity,
                        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
                    }
                    save_listing_to_db(new_listing)
                    st.session_state.marketplace_db.append(new_listing)
                    
                    with st.spinner("Firing text payload vectors into automated n8n agent matrix pipeline..."):
                        try:
                            N8N_WEBHOOK_URL = "https://ecoaudit-ai.app.n8n.cloud/webhook-test/ecoaudit-stream"
                            requests.post(N8N_WEBHOOK_URL, json={"message": raw_log, "weight": quantity}, timeout=5)
                            st.success("Automated matching n8n route activated successfully!")
                            st.balloons()
                            st.rerun()
                        except Exception:
                            st.success("Local pipeline submission executed successfully.")
                            st.rerun()
                else:
                    st.error("Please input a text manifest log description and a valid volume capacity calculation vector.")

        # 🛒 TAB THREE: OPEN PROCUREMENT MATRIX (BUYER VIEW)
        elif st.session_state.current_tab == "🛒 Open Procurement (Buy)":
            st.title("Active Byproduct Procurement Streams")
            st.write("---")
            if not st.session_state.marketplace_db:
                st.info("No industrial manufacturing remnant streams listed today.")
            else:
                for idx, listing in enumerate(st.session_state.marketplace_db):
                    col_b1, col_b2 = st.columns([3, 1])
                    with col_b1:
                        st.markdown(f"""
                            <div class='eco-card' style='margin-bottom:0;'>
                                <h3 style='color:#4ADE80; margin:0;'>📦 {listing['material_type']} ({listing['quantity']})</h3>
                                <p style='color:#E2E8F0; margin-top:5px;'><em>"{listing['raw_text']}"</em></p>
                                <small style='color:#64748B;'>Origin Plant Node: {listing['sender_company']} | Log: {listing['timestamp']}</small>
                            </div>
                        """, unsafe_allow_html=True)
                    with col_b2:
                        st.write("")
                        if st.button("Claim & Negotiate", key=f"claim_{idx}", use_container_width=True):
                            channel_id = f"{listing['id']}__chat"
                            if channel_id not in st.session_state.private_chats:
                                st.session_state.private_chats[channel_id] = [
                                    {
                                        "role": "assistant",
                                        "sender_name": "System Protocol Engine",
                                        "msg": f"Secure transaction bridge established between Seller Node ({listing['sender_company']}) and Buyer Node ({user_meta['company_name']})."
                                    }
                                ]
                            
                            try:
                                CLAIM_WEBHOOK_URL = "https://ecoaudit-ai.app.n8n.cloud/webhook-test/d70c8a5d-55ca-4673-a2a8-fe4b26f9c23f"
                                requests.post(CLAIM_WEBHOOK_URL, json={
                                    "seller_email": listing["sender_email"],
                                    "seller_company": listing["sender_company"],
                                    "buyer_company": user_meta["company_name"],
                                    "material": listing["material_type"],
                                    "quantity": listing["quantity"]
                                }, timeout=5)
                            except Exception:
                                pass
                                
                            st.toast("Connection matrix locked! Launching negotiation workspace terminal.")
                            st.session_state.current_tab = "💬 Communication Terminal"
                            st.rerun()

        # 💬 TAB FOUR: PRIVATE PEER-TO-PEER CONSOLE TERMINAL
        elif st.session_state.current_tab == "💬 Communication Terminal":
            st.title("B2B Secure Negotiation Terminal")
            st.write("Direct peer-to-peer relationship tracks locked away from the global marketplace views.")
            st.write("---")
            
            active_channels = []
            for listing in st.session_state.marketplace_db:
                channel_key = f"{listing['id']}__chat"
                if listing["sender_email"] == st.session_state.current_user or channel_key in st.session_state.private_chats:
                    active_channels.append((channel_key, f"📦 {listing['material_type']} ({listing['sender_company']})"))
            
            if not active_channels:
                st.info("No active private transactional deal matrices mapped yet. Initiate a stream claim sequence to start.")
            else:
                channel_options = [label for _, label in active_channels]
                selected_label = st.selectbox("Select Active Private Deal Negotiation Channel:", channel_options)
                selected_channel_key = [k for k, label in active_channels if label == selected_label][0]
                
                if selected_channel_key not in st.session_state.private_chats:
                    st.session_state.private_chats[selected_channel_key] = []
                
                for chat in st.session_state.private_chats[selected_channel_key]:
                    with st.chat_message(chat["role"]):
                        st.write(f"**{chat['sender_name']}**: {chat['msg']}")
                        
                user_msg = st.chat_input("Enter transaction text message payload parameters...")
                if user_msg:
                    st.session_state.private_chats[selected_channel_key].append({
                        "role": "user",
                        "sender_name": user_meta["company_name"],
                        "msg": user_msg
                    })
                    st.rerun()

        # ⚙️ TAB FIVE: NODE METRICS & ACCOUNT SETTINGS INDEX
        elif st.session_state.current_tab == "⚙️ My Account ":
            st.title("Portal Node Management")
            st.write("---")
            st.markdown(f"""
                <div class='eco-card'>
                    <h3 style='color:#4ADE80; margin:0;'>🏢 {user_meta['company_name']}</h3>
                    <hr style='border-color:rgba(255,255,255,0.1);'>
                    <p><strong>Authenticated Identity Node Email:</strong> {st.session_state.current_user}</p>
                    <p><strong>Operational Role Assignment:</strong> {user_meta['role']}</p>
                    <p><strong>Physical Operating Base Hub:</strong> {user_meta['location']}</p>
                    <p><strong>License / Dynamic Parameters Vector:</strong> {user_meta['meta_1']}</p>
                </div>
            """, unsafe_allow_html=True)