import os
import razorpay
import hmac
import hashlib
from datetime import datetime, timezone, timedelta
from models import PLAN_DETAILS, SubscriptionPlan

RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def create_order(plan: SubscriptionPlan) -> dict:
    """Create a Razorpay order for subscription"""
    plan_info = PLAN_DETAILS[plan]
    
    order_data = {
        "amount": plan_info["price"] * 100,  # Amount in paise
        "currency": "INR",
        "receipt": f"sub_{plan.value}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "notes": {
            "plan": plan.value,
            "credits": plan_info["credits"],
            "days": plan_info["days"]
        }
    }
    
    order = client.order.create(data=order_data)
    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "plan": plan.value,
        "key_id": RAZORPAY_KEY_ID
    }

def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify Razorpay payment signature"""
    message = f"{order_id}|{payment_id}"
    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)

def get_subscription_expiry(plan: SubscriptionPlan) -> str:
    """Calculate subscription expiry date"""
    plan_info = PLAN_DETAILS[plan]
    expiry = datetime.now(timezone.utc) + timedelta(days=plan_info["days"])
    return expiry.isoformat()

def get_plan_credits(plan: SubscriptionPlan) -> int:
    """Get credits for a plan"""
    return PLAN_DETAILS[plan]["credits"]

async def process_subscription(db, user_id: str, plan: SubscriptionPlan, payment_id: str):
    """Process successful subscription payment"""
    plan_info = PLAN_DETAILS[plan]
    expiry = get_subscription_expiry(plan)
    
    # Update user subscription and credits
    await db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "subscription_plan": plan.value,
                "subscription_expiry": expiry
            },
            "$inc": {
                "credits": plan_info["credits"]
            }
        }
    )
    
    # Log the subscription
    import uuid
    subscription_log = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "plan": plan.value,
        "payment_id": payment_id,
        "credits_added": plan_info["credits"],
        "amount": plan_info["price"],
        "expiry": expiry,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.subscriptions.insert_one(subscription_log)
    
    return {
        "plan": plan.value,
        "credits_added": plan_info["credits"],
        "expiry": expiry
    }
