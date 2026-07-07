# pages/marketplace.py
import streamlit as st
import os
import uuid

from database import (
    add_listing,
    get_all_listings,
    get_user_listings,
    get_listing,
    update_listing,
    delete_listing,
)
from ai import detect_material
from automation import trigger_n8n

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def marketplace_page():
    st.title("🛒 Marketplace")

    # --------------------------------------------------------------
    # Tab selector (Create / Browse / My Listings)
    # --------------------------------------------------------------
    if "marketplace_tab" not in st.session_state:
        st.session_state.marketplace_tab = "browse"

    tab = st.radio(
        "",
        ["Create Listing", "Browse Listings", "My Listings"],
        horizontal=True,
        index=0
        if st.session_state.marketplace_tab == "create"
        else 1
        if st.session_state.marketplace_tab == "browse"
        else 2,
    )
    st.session_state.marketplace_tab = (
        "create"
        if tab == "Create Listing"
        else "browse"
        if tab == "Browse Listings"
        else "mylistings"
    )

    # ==============================================================
    # 1️⃣ CREATE LISTING
    # ==============================================================
    if st.session_state.marketplace_tab == "create":
        _create_listing()

    # ==============================================================
    # 2️⃣ BROWSE LISTINGS (search + filters)
    # ==============================================================
    elif st.session_state.marketplace_tab == "browse":
        _browse_listings()

    # ==============================================================
    # 3️⃣ MY LISTINGS (edit / delete)
    # ==============================================================
    else:
        _my_listings()


# ------------------------------------------------------------------
# Helper: create a new listing
# ------------------------------------------------------------------
def _create_listing():
    st.subheader("Create New Listing")

    uploaded_image = st.file_uploader(
        "Upload Material Image", type=["jpg", "jpeg", "png"]
    )
    if uploaded_image:
        st.image(uploaded_image, caption="Preview – will be saved on publish")

    description = st.text_area(
        "Material Description",
        placeholder="Example: 500kg Plastic PET Bottles",
    )
    material = st.text_input("Material")
    quantity = st.text_input("Quantity (kg)", placeholder="e.g. 500")
    price = st.text_input("Price (per kg)", placeholder="e.g. 0.45")
    location = st.text_input("Location")

    col1, col2 = st.columns(2)

    # ---- AI Auto‑detect material -------------------------------------------------
    with col1:
        if st.button("🤖 Auto Detect Material"):
            if description:
                pred = detect_material(description)
                st.success(f"Detected Material: **{pred}**")
                st.session_state.predicted_material = pred
            else:
                st.warning("Enter a description first.")

    if "predicted_material" in st.session_state:
        material = st.session_state.predicted_material
        st.info(f"Material selected by AI → **{material}**")

    # ---- Publish -----------------------------------------------------------------
    with col2:
        publish = st.button("🚀 Publish Listing", use_container_width=True)

    if publish:
        if not all([material, quantity, price, description]):
            st.error("Please fill **all** required fields.")
            st.stop()

        # Save image (if any)
        img_path = ""
        if uploaded_image:
            ext = uploaded_image.name.split(".")[-1]
            filename = f"{uuid.uuid4()}.{ext}"
            img_path = os.path.join(UPLOAD_DIR, filename)
            with open(img_path, "wb") as f:
                f.write(uploaded_image.getbuffer())

        # Insert listing
        add_listing(
            st.session_state.user_id,
            material,
            float(quantity),
            float(price),
            description,
            img_path,
            location,
        )

        # Optional n8n webhook
        payload = {
            "seller": st.session_state.user_name,
            "email": st.session_state.email,
            "material": material,
            "quantity": quantity,
            "price": price,
            "location": location,
            "description": description,
        }
        trigger_n8n(payload)

        st.success("✅ Listing published!")
        st.rerun()


# ------------------------------------------------------------------
# Helper: browse listings with live search & filters
# ------------------------------------------------------------------
def _browse_listings():
    st.subheader("Available Listings")
    listings = get_all_listings()
    if not listings:
        st.info("No listings yet.")
        return

    # ---- Filters ---------------------------------------------------------
    col_search, col_material, col_location = st.columns([2, 1, 1])

    with col_search:
        query = st.text_input(
            "🔎 Live Search (material / description)",
            placeholder="e.g. ‘plastic’ or ‘PET’",
        )
    with col_material:
        material_opts = sorted({l["material"] for l in listings})
        material_filter = st.multiselect("🏷 Material", options=material_opts)
    with col_location:
        location_opts = sorted(
            {l["location"] for l in listings if l["location"] is not None}
        )
        location_filter = st.multiselect("📍 Location", options=location_opts)

    # ---- Apply filters ---------------------------------------------------
    def matches(item):
        if query:
            q = query.lower()
            if q not in item["description"].lower() and q not in item["material"].lower():
                return False
        if material_filter and item["material"] not in material_filter:
            return False
        if location_filter and item["location"] not in location_filter:
            return False
        return True

    filtered = [l for l in listings if matches(l)]

    if not filtered:
        st.info("No listings match your filters.")
        return

    # ---- Responsive 2‑column cards ---------------------------------------
    for i in range(0, len(filtered), 2):
        row = filtered[i : i + 2]
        cols = st.columns(2) if len(row) == 2 else [st.container()]

        for listing, col in zip(row, cols):
            with col:
                with st.container(border=True):
                    # Image
                    if listing["image_path"] and os.path.exists(listing["image_path"]):
                        st.image(listing["image_path"], use_container_width=True)
                    else:
                        st.image(
                            "https://via.placeholder.com/250x180.png?text=No+Image",
                            use_container_width=True,
                        )
                    # Details
                    st.subheader(listing["material"])
                    st.write(listing["description"])
                    st.write(f"**Quantity:** {listing['quantity']} kg")
                    st.write(f"**Price:** ₹{listing['price']}/kg")
                    st.write(f"**Location:** {listing['location']}")
                    st.write(f"**Seller:** {listing['company']}")
                    st.write(f"**Status:** {listing['status']}")

                    # Contact seller → opens chat directly
                    if st.button("💬 Contact Seller", key=f"chat_{listing['id']}"):
                        st.session_state.chat_partner = listing["seller_id"]
                        st.session_state.dashboard_page = "chat"
                        st.rerun()


# ------------------------------------------------------------------
# Helper: show your own listings with edit / delete actions
# ------------------------------------------------------------------
def _my_listings():
    st.subheader("📄 My Listings")
    my_list = get_user_listings(st.session_state.user_id)
    if not my_list:
        st.info("You have not created any listings yet.")
        return

    # --------------------------------------------------------------
    # EDIT flow – show the edit form if an edit_id is stored
    # --------------------------------------------------------------
    edit_id = st.session_state.get("edit_listing_id")
    if edit_id:
        _edit_form(edit_id)
        return   # after editing the page will rerun

    # --------------------------------------------------------------
    # Normal view – each listing with Edit / Delete buttons
    # --------------------------------------------------------------
    for lst in my_list:
        (
            listing_id,
            seller_id,
            material,
            quantity,
            price,
            description,
            location,
            image_path,
            status,
            created_at,
            _,
        ) = (
            lst["id"],
            lst["seller_id"],
            lst["material"],
            lst["quantity"],
            lst["price"],
            lst["description"],
            lst["location"],
            lst["image_path"],
            lst["status"],
            lst["created_at"],
            lst.get("company", None),
        )

        with st.container(border=True):
            col_img, col_info = st.columns([1, 3])

            # Image
            with col_img:
                if image_path and os.path.exists(image_path):
                    st.image(image_path, use_container_width=True)
                else:
                    st.image(
                        "https://via.placeholder.com/250x180.png?text=No+Image",
                        use_container_width=True,
                    )
            # Details + actions
            with col_info:
                st.subheader(material)
                st.write(description)
                st.write(f"**Quantity:** {quantity} kg")
                st.write(f"**Price:** ₹{price}/kg")
                st.write(f"**Location:** {location}")
                st.write(f"**Status:** {status}")

                btn_edit, btn_del = st.columns([1, 1])
                with btn_edit:
                    if st.button("✏️ Edit", key=f"edit_{listing_id}"):
                        st.session_state.edit_listing_id = listing_id
                        st.rerun()
                with btn_del:
                    if st.button("🗑 Delete", key=f"del_{listing_id}"):
                        delete_listing(listing_id)
                        st.success("🗑 Listing removed")
                        st.rerun()


# ------------------------------------------------------------------
# Helper: edit form for a specific listing
# ------------------------------------------------------------------
def _edit_form(listing_id: int):
    lst = get_listing(listing_id)
    if not lst:
        st.error("Listing not found.")
        st.session_state.pop("edit_listing_id", None)
        st.rerun()

    st.subheader("✏️ Edit Listing")
    with st.form("edit_form"):
        material = st.text_input("Material", value=lst["material"])
        quantity = st.text_input("Quantity (kg)", value=str(lst["quantity"]))
        price = st.text_input("Price (per kg)", value=str(lst["price"]))
        description = st.text_area("Description", value=lst["description"])
        location = st.text_input("Location", value=lst["location"])
        status = st.selectbox(
            "Status",
            options=["Available", "Sold", "Closed"],
            index=0
            if lst["status"] == "Available"
            else 1
            if lst["status"] == "Sold"
            else 2,
        )
        new_image = st.file_uploader(
            "Replace Image (optional)",
            type=["jpg", "jpeg", "png"],
            key="replace_img",
        )
        submitted = st.form_submit_button("Update Listing")

        if submitted:
            img_path = None
            if new_image:
                ext = new_image.name.split(".")[-1]
                filename = f"{uuid.uuid4()}.{ext}"
                img_path = os.path.join(UPLOAD_DIR, filename)
                with open(img_path, "wb") as f:
                    f.write(new_image.getbuffer())

            update_listing(
                listing_id,
                material,
                float(quantity),
                float(price),
                description,
                location,
                status,
                img_path,
            )
            st.success("✅ Listing updated")
            st.session_state.pop("edit_listing_id", None)
            st.rerun()
