from datetime import datetime, timezone
from models import CREDIT_COSTS

def check_credits(user_credits: int, action: str) -> bool:
    """Check if user has enough credits for an action"""
    required = CREDIT_COSTS.get(action, 1)
    return user_credits >= required

def get_credit_cost(action: str) -> int:
    """Get the credit cost for an action"""
    return CREDIT_COSTS.get(action, 1)

def check_subscription_active(expiry_str: str | None) -> bool:
    """Check if subscription is still active"""
    if not expiry_str:
        return False
    try:
        expiry = datetime.fromisoformat(expiry_str)
        return expiry > datetime.now(timezone.utc)
    except (ValueError, TypeError):
        return False

async def deduct_credits(db, user_id: str, action: str, details: dict = None):
    """Deduct credits from user and log usage"""
    import uuid
    cost = get_credit_cost(action)
    
    # Deduct credits
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"credits": -cost}}
    )
    
    # Log usage
    usage_log = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": action,
        "credits_used": cost,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.usage_logs.insert_one(usage_log)
    
    return cost

async def add_credits(db, user_id: str, credits: int, reason: str = None):
    """Add credits to user account"""
    import uuid
    
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"credits": credits}}
    )
    
    # Log the credit addition
    usage_log = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": "credits_added",
        "credits_used": -credits,  # Negative to indicate addition
        "details": {"reason": reason},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.usage_logs.insert_one(usage_log)
