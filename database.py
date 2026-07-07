# database.py
import sqlite3
import hashlib
import os
from typing import List, Tuple, Dict, Any

# ------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------
DB_FOLDER = "data"
DB_NAME = "ecoaudit.db"
DB_PATH = os.path.join(DB_FOLDER, DB_NAME)

os.makedirs(DB_FOLDER, exist_ok=True)


# ------------------------------------------------------------------
# Connection helper
# ------------------------------------------------------------------
def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


# ------------------------------------------------------------------
# Password hashing (simple SHA‑256 – replace with bcrypt for prod)
# ------------------------------------------------------------------
def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


# ------------------------------------------------------------------
# Initialise DB + default admin user
# ------------------------------------------------------------------
def init_database():
    conn = get_connection()
    cur = conn.cursor()

    # ---- USERS ----------------------------------------------------
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            gst TEXT,
            industry TEXT,
            location TEXT,
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # ---- MARKETPLACE -----------------------------------------------
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS marketplace(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            seller_id INTEGER NOT NULL,
            material TEXT NOT NULL,
            quantity REAL NOT NULL,
            price REAL NOT NULL,
            description TEXT,
            location TEXT,
            image_path TEXT,
            status TEXT DEFAULT 'Available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(seller_id) REFERENCES users(id)
        )
        """
    )

    # ---- CHAT ------------------------------------------------------
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS messages(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sender_id) REFERENCES users(id),
            FOREIGN KEY(receiver_id) REFERENCES users(id)
        )
        """
    )

    # ---- AUTOMATION LOGS -------------------------------------------
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS automation_logs(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event TEXT,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # ---- DEFAULT ADMIN ---------------------------------------------
    cur.execute("SELECT id FROM users WHERE email=?", ("admin@ecoaudit.ai",))
    if cur.fetchone() is None:
        cur.execute(
            """
            INSERT INTO users(
                company_name,email,password,phone,gst,industry,location,role
            ) VALUES (?,?,?,?,?,?,?,?)
            """,
            (
                "EcoAudit Admin",
                "admin@ecoaudit.ai",
                hash_password("admin123"),
                "9999999999",
                "NA",
                "Administration",
                "Pune",
                "Admin",
            ),
        )
    conn.commit()
    conn.close()


# ------------------------------------------------------------------
# USER HELPERS
# ------------------------------------------------------------------
def register_user(
    company_name: str,
    email: str,
    password: str,
    location: str,
    role: str,
    phone: str = "",
    gst: str = "",
    industry: str = "",
) -> Tuple[bool, str]:
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO users(
                company_name,email,password,phone,gst,industry,location,role
            ) VALUES (?,?,?,?,?,?,?,?)
            """,
            (
                company_name,
                email.lower(),
                hash_password(password),
                phone,
                gst,
                industry,
                location,
                role,
            ),
        )
        conn.commit()
        return True, "Registration successful"
    except sqlite3.IntegrityError:
        return False, "Email already exists"
    finally:
        conn.close()


def login_user(email: str, password: str) -> Dict[str, Any] | None:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email=?", (email.lower(),))
    row = cur.fetchone()
    conn.close()
    if row and row["password"] == hash_password(password):
        return dict(row)
    return None


def get_user(user_id: int) -> Dict[str, Any] | None:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id=?", (user_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def get_all_users() -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users ORDER BY company_name")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def update_profile(
    user_id: int,
    company_name: str,
    phone: str,
    gst: str,
    industry: str,
    location: str,
):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE users
        SET company_name=?, phone=?, gst=?, industry=?, location=?
        WHERE id=?
        """,
        (company_name, phone, gst, industry, location, user_id),
    )
    conn.commit()
    conn.close()


def change_password(user_id: int, new_password: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE users SET password=? WHERE id=?", (hash_password(new_password), user_id)
    )
    conn.commit()
    conn.close()


# ------------------------------------------------------------------
# MARKETPLACE HELPERS
# ------------------------------------------------------------------
def add_listing(
    seller_id: int,
    material: str,
    quantity: float,
    price: float,
    description: str,
    image_path: str,
    location: str,
):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO marketplace(
            seller_id,material,quantity,price,description,image_path,location,status
        ) VALUES (?,?,?,?,?,?,?,?)
        """,
        (
            seller_id,
            material,
            quantity,
            price,
            description,
            image_path,
            location,
            "Available",
        ),
    )
    conn.commit()
    conn.close()


def get_all_listings() -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT marketplace.*, users.company_name AS company
        FROM marketplace
        JOIN users ON marketplace.seller_id = users.id
        ORDER BY marketplace.created_at DESC
        """
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def get_user_listings(user_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT *
        FROM marketplace
        WHERE seller_id=?
        ORDER BY created_at DESC
        """,
        (user_id,),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def get_listing(listing_id: int) -> Dict[str, Any] | None:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM marketplace WHERE id=?", (listing_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def update_listing(
    listing_id: int,
    material: str,
    quantity: float,
    price: float,
    description: str,
    location: str,
    status: str,
    image_path: str | None = None,
):
    conn = get_connection()
    cur = conn.cursor()
    if image_path:
        cur.execute(
            """
            UPDATE marketplace
            SET material=?, quantity=?, price=?, description=?,
                location=?, status=?, image_path=?
            WHERE id=?
            """,
            (material, quantity, price, description, location, status, image_path, listing_id),
        )
    else:
        cur.execute(
            """
            UPDATE marketplace
            SET material=?, quantity=?, price=?, description=?,
                location=?, status=?
            WHERE id=?
            """,
            (material, quantity, price, description, location, status, listing_id),
        )
    conn.commit()
    conn.close()


def delete_listing(listing_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM marketplace WHERE id=?", (listing_id,))
    conn.commit()
    conn.close()


# ------------------------------------------------------------------
# CHAT HELPERS
# ------------------------------------------------------------------
def send_message(sender_id: int, receiver_id: int, message: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO messages(sender_id,receiver_id,message)
        VALUES (?,?,?)
        """,
        (sender_id, receiver_id, message),
    )
    conn.commit()
    conn.close()


def get_conversation_partners(user_id: int) -> List[int]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT DISTINCT
            CASE WHEN sender_id=? THEN receiver_id ELSE sender_id END AS partner_id
        FROM messages
        WHERE sender_id=? OR receiver_id=?
        """,
        (user_id, user_id, user_id),
    )
    partners = [r["partner_id"] for r in cur.fetchall()]
    conn.close()
    return partners


def get_messages_between(user_id: int, other_user_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT *
        FROM messages
        WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)
        ORDER BY created_at ASC
        """,
        (user_id, other_user_id, other_user_id, user_id),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


# ------------------------------------------------------------------
# DASHBOARD / ANALYTICS HELPERS
# ------------------------------------------------------------------
def get_dashboard_stats() -> Dict[str, int]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM marketplace")
    listings = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM users")
    users = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM messages")
    msgs = cur.fetchone()[0]

    cur.execute("SELECT IFNULL(SUM(quantity),0) FROM marketplace")
    waste = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM marketplace WHERE status='Available'")
    active = cur.fetchone()[0]

    conn.close()
    return {
        "listings": listings,
        "users": users,
        "messages": msgs,
        "waste": waste,
        "active": active,
    }


def get_recent_listings(limit: int = 5) -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT marketplace.*, users.company_name AS company
        FROM marketplace
        JOIN users ON marketplace.seller_id = users.id
        ORDER BY marketplace.created_at DESC
        LIMIT ?
        """,
        (limit,),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def material_distribution() -> List[Tuple[str, int]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT material, COUNT(*) AS total
        FROM marketplace
        GROUP BY material
        ORDER BY total DESC
        """
    )
    data = cur.fetchall()
    conn.close()
    return data
