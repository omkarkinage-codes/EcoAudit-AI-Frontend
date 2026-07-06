import streamlit as st
import pandas as pd
import hashlib
import os
import datetime
import requests


# --- BROWSER CONFIGURATION ---
st.set_page_config(page_title="EcoAudit AI", page_icon="🌿", layout="wide")

# 1. Define the variables first
DB_FILE = "users_database.csv"
MARKETPLACE_FILE = "marketplace_database.csv"

# 2. TEMPORARY CLEANING LINES (Safe to run here!)
if os.path.exists(DB_FILE): os.remove(DB_FILE)
if os.path.exists(MARKETPLACE_FILE): os.remove(MARKETPLACE_FILE)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def load_users_db():
    if os.path.exists(DB_FILE):
        try:
            df = pd.read_csv(DB_FILE)
            df = df.drop_duplicates(subset=["email"], keep="last")
            return df.set_index("email").to_dict(orient="index")
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
    return df.set_index("email").to_dict(orient="index")

def save_user_to_db(email, data_dict):
    # Saves the payload directly since it's already hashed in the signup form step
    df_new = pd.DataFrame([{
        "email": email,
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


# --- SYSTEM MEMORY STARTUP MATRIX ---
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
    
    # Text states for automatic box clearing
    st.session_state.input_raw_log = ""
    st.session_state.input_material = ""
    st.session_state.input_quantity = ""
    
    st.session_state.db_initialized = True

# --- CLEAN DARK MODE STYLING ---
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
# PHASE 1: PUBLIC LANDING PAGE
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
                
    st.markdown("<br><br><br>", unsafe_allow_html=True)
    st.write("---")
    
    st.markdown("<h3 style='color: #F8FAFC; font-weight:600;'>Platform Features</h3>", unsafe_allow_html=True)
    f1, f2, f3 = st.columns(3)
    with f1:
        st.markdown("<div class='eco-card'><h4>Log Reading AI</h4><p style='color: #94A3B8; font-size: 0.95rem;'>Paste raw warehouse texts or notes directly without manual sorting.</p></div>", unsafe_allow_html=True)
    with f2:
        st.markdown("<div class='eco-card'><h4>B2B Green Matching</h4><p style='color: #94A3B8; font-size: 0.95rem;'>Connect industrial sellers immediately with local recycling hubs.</p></div>", unsafe_allow_html=True)
    with f3:
        st.markdown("<div class='eco-card'><h4>Secure Messaging</h4><p style='color: #94A3B8; font-size: 0.95rem;'>Lock your contract and business discussions into private chat rooms.</p></div>", unsafe_allow_html=True)


# ==========================================
# PHASE 2: SIGN IN & REGISTER
# ==========================================
elif st.session_state.started and not st.session_state.logged_in:
    st.session_state.users_db = load_users_db()

    col_nav_left, col_nav_right = st.columns([3, 1.2])
    with col_nav_left:
        if st.button("Back to Homepage"):
            st.session_state.started = False
            st.session_state.selected_role = None
            st.rerun()
    with col_nav_right:
        choice = st.segmented_control("Choose Action:", ["Sign In", "Sign Up"], default=st.session_state.auth_action)
        if choice:
            st.session_state.auth_action = choice

    st.write("---")

    email, password, company_name, location, industry_type, license_no, capacity = "", "", "", "", "", "", ""

    if st.session_state.auth_action == "Sign In":
        st.markdown("<h2>Sign In to Your Dashboard</h2>", unsafe_allow_html=True)
        col_login, _ = st.columns([1.2, 1])
        with col_login:
            email = st.text_input("Email Address", placeholder="name@company.com", key="signin_email")
            password = st.text_input("Password", type="password", placeholder="••••••••", key="signin_pass")
            
            if st.button("Login", type="primary", use_container_width=True):
                if email.strip() in st.session_state.users_db:
                    db_entry = st.session_state.users_db[email.strip()]
                    if str(db_entry["password"]) == hash_password(password.strip()):
                        st.session_state.logged_in = True
                        st.session_state.current_user = email.strip()
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
                st.markdown("<div class='eco-card' style='height: 190px;'><h3 style='color: #4ADE80;'>Verified B2B Buyer</h3><p style='color: #94A3B8;'>Choose this if you are a certified recycler or processing plant looking for materials.</p></div>", unsafe_allow_html=True)
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
                email = st.text_input("Company Email Address", placeholder="name@company.com", key="signup_email")
                password = st.text_input("Create Password", type="password", placeholder="••••••••", key="signup_pass")
                st.write("---")
                st.markdown("#### Company Information")
                
                if st.session_state.selected_role == "Industrial Seller (Factory / Plant)":
                    company_name = st.text_input("Factory / Company Name")
                    location = st.text_input("Plant Physical Location (City)")
                    industry_type = st.text_input("Main Material Type (e.g., Copper Works)")
                    license_no, capacity = "N/A", "N/A"
                else:
                    company_name = st.text_input("Recycling Center Name")
                    location = st.text_input("Facility Physical Location (City)")
                    license_no = st.text_input("Pollution Control Board License Number")
                    capacity = st.text_input("Monthly Recycling Capacity (e.g., 50 Tons)")
                    industry_type = "N/A"

                if st.button("Complete Registration", type="primary", use_container_width=True):
                    if email.strip() and password.strip() and company_name.strip():
                        # Hash password exactly ONCE during registry setup
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
                        
                        st.session_state.logged_in = True
                        st.session_state.current_user = email.strip()
                        st.session_state.current_role = st.session_state.selected_role
                        st.rerun()
                    else:
                        st.error("Please fill out all input fields to finish your registration.")


# ==========================================
# PHASE 3: THE MAIN LOGGED IN APP INTERFACE
# ==========================================
else:
    user_meta = st.session_state.users_db[st.session_state.current_user]

    options = ["📊 Dashboard", "💬 Communication Terminal", "⚙️ My Account Settings"]
    if st.session_state.current_role == "Industrial Seller (Factory / Plant)":
        options.insert(1, "🚀 Dispatch Byproduct (Sell)")
    else:
        options.insert(1, "🛒 Open Procurement (Buy)")

    # COLLAPSIBLE SIDE NAVIGATION MENU
    if st.session_state.sidebar_open:
        col_side, col_main = st.columns([1.2, 4], gap="medium")
        with col_side:
            col_brand, col_close_icon = st.columns([4, 1])
            with col_brand:
                st.markdown(f"<h3 style='margin:0; color:#4ADE80; font-weight:700;'>Console</h3>", unsafe_allow_html=True)
                st.caption(f"Logged in as: {user_meta['company_name']}")
            with col_close_icon:
                if st.button("📁", key="close_panel_btn", use_container_width=True):
                    st.session_state.sidebar_open = False
                    st.rerun()
            st.write("---")
            st.session_state.current_tab = st.radio("Navigation Menu:", options, index=options.index(st.session_state.current_tab) if st.session_state.current_tab in options else 0, label_visibility="collapsed")
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
        st.write("")
        col_open_icon, _ = st.columns([1, 20])
        with col_open_icon:
            if st.button("📂", key="open_panel_btn"):
                st.session_state.sidebar_open = True
                st.rerun()
        st.write("")

    # CORE OPERATION DASHBOARDS
    with col_main:
        # TAB ONE: ANALYTICS DASHBOARD
        if st.session_state.current_tab == "📊 Dashboard":
            st.title("Executive Dashboard Overview")
            
            # Real-time counter logic
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
            m1.metric("Total Material Recycled", f"{formatted_weight} kg", "Tracking Live")
            m2.metric("Connected Companies Online", str(total_active_nodes), "Verified Accounts")
            m3.metric("System Route Latency", "1.4s", "Optimized Network")
            
            st.write("---")
            c_left, c_right = st.columns([1.3, 1])
            with c_left:
                st.markdown("### 📋 Active Market Listings")
                if not st.session_state.marketplace_db:
                    st.write("*No active byproduct batches listed on the network currently.*")
                else:
                    for listing in st.session_state.marketplace_db:
                        st.markdown(f"""
                            <div class='eco-card'>
                                <h4 style='color: #4ADE80; margin:0;'>📦 {listing['material_type']} ({listing['quantity']})</h4>
                                <p style='color: #E2E8F0; margin-top:5px;'><em>"{listing['raw_text']}"</em></p>
                                <small style='color: #64748B;'>Posted by: {listing['sender_company']} | Date: {listing['timestamp']}</small>
                            </div>
                        """, unsafe_allow_html=True)
                        
            with c_right:
                st.markdown("### 🌐 Global Company Directory")
                # FIX 3: RE-ENGINEERED DIRECT MESSAGING FROM DIRECTORY
                has_other_companies = False
                for user_email, profile in st.session_state.users_db.items():
                    if user_email != st.session_state.current_user:
                        has_other_companies = True
                        st.markdown(f"""
                            <div style='background: rgba(255,255,255,0.04); padding: 15px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid #60A5FA;'>
                                <strong style='color: #F8FAFC;'>{profile['company_name']}</strong><br>
                                <small style='color: #94A3B8;'>Type: {profile['role']} | Location: {profile['location']}</small>
                            </div>
                        """, unsafe_allow_html=True)
                        
                        # Clickable button interface to instantly start a peer-to-peer chat
                        if st.button(f"Connect & Message {profile['company_name']}", key=f"connect_{user_email[:5]}"):
                            chat_channel_id = f"DIRECT__{hashlib.md5((st.session_state.current_user + user_email).encode()).hexdigest()}"
                            if chat_channel_id not in st.session_state.private_chats:
                                st.session_state.private_chats[chat_channel_id] = [
                                    {
                                        "role": "assistant",
                                        "sender_name": "System Security",
                                        "msg": f"Private chat room initialized with {profile['company_name']}."
                                    }
                                ]
                            st.toast("Secure message line opened!")
                            st.session_state.current_tab = "💬 Communication Terminal"
                            st.rerun()
                if not has_other_companies:
                    st.write("*No other active companies are registered on the database yet.*")

        # TAB TWO: SELLER LAUNCHPAD
        elif st.session_state.current_tab == "🚀 Dispatch Byproduct (Sell)":
            st.title("🚀 Post New Byproduct Material")
            st.write("---")
            
            # Simple UI boxes with clearing mechanisms
            raw_log = st.text_area("Paste Raw Warehouse Log / Factory Notes:", value=st.session_state.input_raw_log, placeholder="Type or paste material details here...", key="text_raw_log")
            material_type = st.text_input("Material Category Mapping", value=st.session_state.input_material, placeholder="e.g., Copper Cable Wire Scrap", key="text_material")
            quantity = st.text_input("Total Weight / Volume (Specify 'kg' or 'tons')", value=st.session_state.input_quantity, placeholder="e.g., 450 kg", key="text_quantity")
            
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
                    st.session_state.marketplace_db.append(new_listing)
                    
                    # Empty out input fields instantly
                    st.session_state.input_raw_log = ""
                    st.session_state.input_material = ""
                    st.session_state.input_quantity = ""
                    
                    # --- THE WEBHOOK CODE GOES RIGHT HERE ---
                    with st.spinner("Sending data to n8n automation workflow..."):
                        try:
                            N8N_WEBHOOK_URL = "https://ecoaudit-ai.app.n8n.cloud/webhook-test/d70c8a5d-55ca-4673-a2a8-fe4b26f9c23f"
                            requests.post(N8N_WEBHOOK_URL, json={
                                "message": raw_log, 
                                "material": material_type, 
                                "weight": quantity,
                                "sender": st.session_state.current_user
                            }, timeout=5)
                        except Exception:
                            pass # Keeps your app running even if your n8n server is offline
                            
                    st.success("🎯 Posted! The listing is now live and the form has been cleared.")
                    st.rerun()
                else:
                    st.error("Please fill out all description and weight blocks to post your item.")

            # FIX 2: RE-ENGINEERED DYNAMIC EDIT AND DELETE CONTROLS PANEL
            st.write("<br><br>", unsafe_allow_html=True)
            st.markdown("### 🛠️ Manage Your Active Listings")
            
            my_listings = [item for item in st.session_state.marketplace_db if item["sender_email"] == st.session_state.current_user]
            if not my_listings:
                st.caption("You have not uploaded any material logs yet.")
            else:
                for idx, listing in enumerate(my_listings):
                    with st.container():
                        st.markdown(f"**Item ID:** `{listing['id']}` | **Category:** {listing['material_type']}")
                        edit_qty = st.text_input("Modify Quantity / Weight Vector:", value=listing['quantity'], key=f"edit_qty_{listing['id']}")
                        
                        col_actions = st.columns([1, 1, 4])
                        with col_actions[0]:
                            if st.button("Save Changes", key=f"up_btn_{listing['id']}", use_container_width=True):
                                for real_item in st.session_state.marketplace_db:
                                    if real_item["id"] == listing["id"]:
                                        real_item["quantity"] = edit_qty
                                pd.DataFrame(st.session_state.marketplace_db).to_csv(MARKETPLACE_FILE, index=False)
                                st.toast("Quantity updated successfully!")
                                st.rerun()
                        with col_actions[1]:
                            if st.button("Delete Post", key=f"del_btn_{listing['id']}", use_container_width=True):
                                st.session_state.marketplace_db = [item for item in st.session_state.marketplace_db if item["id"] != listing["id"]]
                                pd.DataFrame(st.session_state.marketplace_db).to_csv(MARKETPLACE_FILE, index=False)
                                st.toast("Post successfully deleted from marketplace!")
                                st.rerun()
                        st.write("---")

        # TAB THREE: PROCUREMENT WORKSPACE (BUYER VIEW)
        elif st.session_state.current_tab == "🛒 Open Procurement (Buy)":
            st.title("🛒 Browse Active Byproduct Streams")
            st.write("---")
            if not st.session_state.marketplace_db:
                st.info("No factories have listed items for collection today.")
            else:
                for idx, listing in enumerate(st.session_state.marketplace_db):
                    col_b1, col_b2 = st.columns([3, 1])
                    with col_b1:
                        st.markdown(f"""
                            <div class='eco-card' style='margin-bottom:0;'>
                                <h3 style='color:#4ADE80; margin:0;'>📦 {listing['material_type']} ({listing['quantity']})</h3>
                                <p style='color:#E2E8F0; margin-top:5px;'><em>"{listing['raw_text']}"</em></p>
                                <small style='color:#64748B;'>Factory Node: {listing['sender_company']} | Logged: {listing['timestamp']}</small>
                            </div>
                        """, unsafe_allow_html=True)
                    with col_b2:
                        st.write("")
                        if st.button("Claim Material", key=f"claim_{idx}", use_container_width=True):
                            channel_id = f"{listing['id']}__chat"
                            if channel_id not in st.session_state.private_chats:
                                st.session_state.private_chats[channel_id] = [
                                    {
                                        "role": "assistant",
                                        "sender_name": "System Security",
                                        "msg": f"Transaction channel opened between Seller ({listing['sender_company']}) and Buyer ({user_meta['company_name']})."
                                    }
                                ]
                            st.toast("Deal claimed! Opening private chat room.")
                            st.session_state.current_tab = "💬 Communication Terminal"
                            st.rerun()

        # TAB FOUR: CHAT WORKSPACE TERMINAL
        elif st.session_state.current_tab == "💬 Communication Terminal":
            st.title("💬 Secure Negotiation Terminal")
            st.write("Private chat rooms securely locked away from other marketplace viewers.")
            st.write("---")
            
            # Load active channels dynamically based on active users
            active_channels = []
            for ch_id, chat_history in st.session_state.private_chats.items():
                if ch_id.startswith("DIRECT__") or any(item["sender_email"] == st.session_state.current_user for item in st.session_state.marketplace_db if f"{item['id']}__chat" == ch_id):
                     active_channels.append((ch_id, f"Channel ID: {ch_id[:12]}..."))
            
            for listing in st.session_state.marketplace_db:
                channel_key = f"{listing['id']}__chat"
                if listing["sender_email"] == st.session_state.current_user:
                    if (channel_key, f"📦 Item {listing['material_type']} Chat") not in active_channels:
                        active_channels.append((channel_key, f"📦 Item {listing['material_type']} Chat"))
            
            if not active_channels:
                st.info("No active chat discussions found. Connect with companies or claim a listing lot to chat.")
            else:
                channel_options = [label for _, label in active_channels]
                selected_label = st.selectbox("Select Active Business Chat Channel:", channel_options)
                selected_channel_key = [k for k, label in active_channels if label == selected_label][0]
                
                if selected_channel_key not in st.session_state.private_chats:
                    st.session_state.private_chats[selected_channel_key] = []
                
                for chat in st.session_state.private_chats[selected_channel_key]:
                    with st.chat_message(chat["role"]):
                        st.write(f"**{chat['sender_name']}**: {chat['msg']}")
                        
                user_msg = st.chat_input("Type your message here...")
                if user_msg:
                    st.session_state.private_chats[selected_channel_key].append({
                        "role": "user",
                        "sender_name": user_meta["company_name"],
                        "msg": user_msg
                    })
                    st.rerun()

        # TAB FIVE: ACCOUNT HISTORY CONTROLS
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
                    <p><strong>License/Custom Metrics Code:</strong> {user_meta['meta_1']}</p>
                </div>
            """, unsafe_allow_html=True)
            
            st.markdown("### 📋 Your Posting History Ledger")
            my_historical_logs = [item for item in st.session_state.marketplace_db if item["sender_email"] == st.session_state.current_user]
            
            if not my_historical_logs:
                st.info("You have not uploaded any entries yet.")
            else:
                for past_item in my_historical_logs:
                    st.markdown(f"""
                        <div style="background: rgba(255,255,255,0.02); padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #4ADE80;">
                            <span style="float: right; color: #64748B;"><small>{past_item['timestamp']}</small></span>
                            <strong style="color: #F8FAFC;">ID: {past_item['id']} | {past_item['material_type']}</strong><br>
                            <span style="color: #A78BFA;">Logged Weight: {past_item['quantity']}</span>
                        </div>
                    """, unsafe_allow_html=True)