"""
Seed script to create admin user
Run: python seed_admin.py
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

ADMIN_EMAIL = "admin@jaipureyevision.com"
ADMIN_PASSWORD = "admin@3036"
ADMIN_NAME = "Admin"

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

async def seed_admin():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if admin already exists
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    
    if existing:
        print(f"Admin user already exists: {ADMIN_EMAIL}")
        client.close()
        return
    
    # Create admin user
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": ADMIN_EMAIL,
        "password_hash": hash_password(ADMIN_PASSWORD),
        "name": ADMIN_NAME,
        "role": "admin",
        "credits": 10000,  # Admin gets lots of credits
        "subscription_plan": "365_days",
        "subscription_expiry": (datetime.now(timezone.utc).replace(year=datetime.now().year + 10)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(admin_user)
    print(f"Admin user created successfully!")
    print(f"Email: {ADMIN_EMAIL}")
    print(f"Password: {ADMIN_PASSWORD}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_admin())
