from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header, Request
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
import uuid
from datetime import datetime, timezone
from typing import Optional, List

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import local modules
from models import (
    UserCreate, UserLogin, UserResponse, UserInDB, Token, TokenData,
    ContentRequest, ContentResponse, CodeRequest, CodeResponse,
    ResearchRequest, ResearchResponse, TTSRequest, TTSResponse, STTResponse,
    ImageRequest, ImageResponse, ImageEditRequest, VideoRequest, VideoResponse,
    JobResponse, JobStatus, SubscriptionRequest, SubscriptionResponse,
    PaymentVerifyRequest, AdminGrantCredits, AdminUserResponse, UsageLog, ErrorLog,
    MCPToolRequest, MCPToolResponse, CreditsBalance, DocumentResponse, RAGQueryRequest,
    UserRole, SubscriptionPlan, PLAN_DETAILS, CREDIT_COSTS
)
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_admin_user
)
from credits import check_credits, get_credit_cost, deduct_credits, add_credits, check_subscription_active
from rag import store_document, get_user_documents, delete_document, get_rag_context
from generators import (
    generate_content, generate_code, generate_research,
    generate_tts, generate_stt, generate_image, edit_image,
    start_video_job, get_job_status
)
from mcp_tools import get_all_tools, run_tool
import razorpay_service

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="JaipurEyeVision Studio API")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/signup", response_model=Token)
async def signup(user_data: UserCreate):
    """Register a new user"""
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = UserInDB(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        name=user_data.name
    )
    
    await db.users.insert_one(user.model_dump())
    
    # Create token
    token = create_access_token(user.id, user.email, user.role)
    
    return Token(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            credits=user.credits,
            subscription_plan=user.subscription_plan,
            subscription_expiry=user.subscription_expiry,
            created_at=user.created_at
        )
    )

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = create_access_token(user["id"], user["email"], UserRole(user["role"]))
    
    return Token(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=UserRole(user["role"]),
            credits=user["credits"],
            subscription_plan=user.get("subscription_plan"),
            subscription_expiry=user.get("subscription_expiry"),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: TokenData = Depends(get_current_user)):
    """Get current user info"""
    user = await db.users.find_one({"id": current_user.user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(**user)

# ============ CREDITS ENDPOINTS ============

@api_router.get("/credits/balance", response_model=CreditsBalance)
async def get_credits_balance(current_user: TokenData = Depends(get_current_user)):
    """Get user's credits balance"""
    user = await db.users.find_one({"id": current_user.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return CreditsBalance(
        credits=user["credits"],
        subscription_plan=user.get("subscription_plan"),
        subscription_expiry=user.get("subscription_expiry"),
        subscription_active=check_subscription_active(user.get("subscription_expiry"))
    )

# ============ RAG ENDPOINTS ============

@api_router.post("/rag/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(get_current_user)
):
    """Upload a document for RAG"""
    # Validate file type
    allowed_types = ["pdf", "docx", "txt", "csv"]
    ext = file.filename.split(".")[-1].lower()
    if ext not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type not supported. Allowed: {allowed_types}")
    
    # Read file
    file_bytes = await file.read()
    
    try:
        doc = await store_document(db, current_user.user_id, file.filename, file_bytes)
        return DocumentResponse(**doc)
    except Exception as e:
        logger.error(f"Document upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@api_router.get("/rag/docs", response_model=List[DocumentResponse])
async def list_documents(current_user: TokenData = Depends(get_current_user)):
    """List user's uploaded documents"""
    docs = await get_user_documents(db, current_user.user_id)
    return [DocumentResponse(**doc) for doc in docs]

@api_router.delete("/rag/docs/{doc_id}")
async def remove_document(doc_id: str, current_user: TokenData = Depends(get_current_user)):
    """Delete a document"""
    success = await delete_document(db, current_user.user_id, doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted"}

@api_router.post("/rag/query")
async def query_rag(request: RAGQueryRequest, current_user: TokenData = Depends(get_current_user)):
    """Query the RAG system directly"""
    context, citations = await get_rag_context(db, current_user.user_id, request.query, request.top_k)
    return {"context": context, "citations": citations}

# ============ GENERATION ENDPOINTS ============

async def validate_and_deduct(user_id: str, action: str):
    """Validate credits and deduct"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check subscription
    if not check_subscription_active(user.get("subscription_expiry")):
        raise HTTPException(status_code=403, detail="Subscription expired. Please renew to continue.")
    
    # Check credits
    if not check_credits(user["credits"], action):
        raise HTTPException(status_code=403, detail=f"Insufficient credits. Need {get_credit_cost(action)} credits.")
    
    return user

@api_router.post("/gen/content", response_model=ContentResponse)
async def gen_content(request: ContentRequest, current_user: TokenData = Depends(get_current_user)):
    """Generate content"""
    await validate_and_deduct(current_user.user_id, "content")
    
    try:
        # Get RAG context
        rag_context, citations = await get_rag_context(db, current_user.user_id, request.topic)
        
        # Generate content
        content = await generate_content(
            content_type=request.content_type.value,
            topic=request.topic,
            tone=request.tone,
            length=request.length,
            additional_context=request.additional_context,
            rag_context=rag_context if rag_context else None
        )
        
        # Deduct credits
        credits_used = await deduct_credits(db, current_user.user_id, "content", {"type": request.content_type.value})
        
        return ContentResponse(
            content=content,
            content_type=request.content_type.value,
            credits_used=credits_used,
            citations=citations if citations else None
        )
    except Exception as e:
        logger.error(f"Content generation failed: {e}")
        # Log error
        await db.error_logs.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user.user_id,
            "error_type": "content_generation",
            "message": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@api_router.post("/gen/code", response_model=CodeResponse)
async def gen_code(request: CodeRequest, current_user: TokenData = Depends(get_current_user)):
    """Generate or process code"""
    await validate_and_deduct(current_user.user_id, "code")
    
    try:
        # Get RAG context
        rag_context, citations = await get_rag_context(db, current_user.user_id, request.description or request.code or "")
        
        result = await generate_code(
            action=request.action.value,
            code=request.code,
            language=request.language,
            description=request.description,
            rag_context=rag_context if rag_context else None
        )
        
        credits_used = await deduct_credits(db, current_user.user_id, "code", {"action": request.action.value})
        
        return CodeResponse(
            code=result["code"],
            explanation=result.get("explanation"),
            action=request.action.value,
            credits_used=credits_used,
            citations=citations if citations else None
        )
    except Exception as e:
        logger.error(f"Code generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@api_router.post("/gen/research", response_model=ResearchResponse)
async def gen_research(request: ResearchRequest, current_user: TokenData = Depends(get_current_user)):
    """Generate research report"""
    await validate_and_deduct(current_user.user_id, "research")
    
    try:
        # Get RAG context
        rag_context, citations = await get_rag_context(db, current_user.user_id, request.topic)
        
        result = await generate_research(
            topic=request.topic,
            depth=request.depth,
            focus_areas=request.focus_areas,
            rag_context=rag_context if rag_context else None
        )
        
        credits_used = await deduct_credits(db, current_user.user_id, "research", {"topic": request.topic})
        
        return ResearchResponse(
            executive_summary=result["executive_summary"],
            key_insights=result["key_insights"],
            risks=result["risks"],
            action_steps=result["action_steps"],
            sources=result["sources"],
            credits_used=credits_used,
            citations=citations if citations else None
        )
    except Exception as e:
        logger.error(f"Research generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@api_router.post("/gen/tts", response_model=TTSResponse)
async def gen_tts(request: TTSRequest, current_user: TokenData = Depends(get_current_user)):
    """Generate text-to-speech"""
    await validate_and_deduct(current_user.user_id, "tts")
    
    try:
        audio_base64 = await generate_tts(
            text=request.text,
            voice=request.voice,
            speed=request.speed
        )
        
        credits_used = await deduct_credits(db, current_user.user_id, "tts", {"chars": len(request.text)})
        
        return TTSResponse(
            audio_base64=audio_base64,
            format="mp3",
            credits_used=credits_used
        )
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@api_router.post("/gen/stt", response_model=STTResponse)
async def gen_stt(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(get_current_user)
):
    """Generate speech-to-text"""
    await validate_and_deduct(current_user.user_id, "stt")
    
    try:
        file_bytes = await file.read()
        text = await generate_stt(file_bytes, file.filename)
        
        credits_used = await deduct_credits(db, current_user.user_id, "stt", {"filename": file.filename})
        
        return STTResponse(
            text=text,
            credits_used=credits_used
        )
    except Exception as e:
        logger.error(f"STT generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@api_router.post("/gen/image", response_model=ImageResponse)
async def gen_image(request: ImageRequest, current_user: TokenData = Depends(get_current_user)):
    """Generate image"""
    await validate_and_deduct(current_user.user_id, "image")
    
    try:
        image_base64 = await generate_image(
            prompt=request.prompt,
            style=request.style
        )
        
        credits_used = await deduct_credits(db, current_user.user_id, "image", {"prompt": request.prompt[:100]})
        
        return ImageResponse(
            image_base64=image_base64,
            credits_used=credits_used
        )
    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@api_router.post("/gen/image/edit", response_model=ImageResponse)
async def gen_image_edit(request: ImageEditRequest, current_user: TokenData = Depends(get_current_user)):
    """Edit image"""
    await validate_and_deduct(current_user.user_id, "image")
    
    try:
        edited_image = await edit_image(
            image_base64=request.image_base64,
            prompt=request.prompt,
            edit_type=request.edit_type
        )
        
        credits_used = await deduct_credits(db, current_user.user_id, "image", {"edit_type": request.edit_type})
        
        return ImageResponse(
            image_base64=edited_image,
            credits_used=credits_used
        )
    except Exception as e:
        logger.error(f"Image edit failed: {e}")
        raise HTTPException(status_code=500, detail=f"Edit failed: {str(e)}")

@api_router.post("/gen/video", response_model=VideoResponse)
async def gen_video(request: VideoRequest, current_user: TokenData = Depends(get_current_user)):
    """Start video generation job"""
    await validate_and_deduct(current_user.user_id, "video")
    
    try:
        # Deduct credits upfront
        await deduct_credits(db, current_user.user_id, "video", {"prompt": request.prompt[:100]})
        
        # Start async job
        job_id = await start_video_job(
            db,
            current_user.user_id,
            request.prompt,
            request.duration,
            request.size
        )
        
        return VideoResponse(
            job_id=job_id,
            status=JobStatus.PENDING,
            message="Video generation started. Check job status for progress."
        )
    except Exception as e:
        logger.error(f"Video generation failed to start: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start job: {str(e)}")

@api_router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, current_user: TokenData = Depends(get_current_user)):
    """Get job status"""
    job = await get_job_status(db, job_id, current_user.user_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse(**job)

@api_router.get("/jobs/{job_id}/download")
async def download_video(job_id: str, current_user: TokenData = Depends(get_current_user)):
    """Download completed video"""
    job = await get_job_status(db, job_id, current_user.user_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Video not ready")
    
    video_path = job.get("result", {}).get("video_path")
    if not video_path or not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(video_path, media_type="video/mp4", filename=f"{job_id}.mp4")

# ============ MCP TOOL ENDPOINTS ============

@api_router.get("/mcp/tools")
async def list_mcp_tools():
    """List all available MCP tools"""
    return get_all_tools()

@api_router.post("/mcp/run", response_model=MCPToolResponse)
async def run_mcp_tool(request: MCPToolRequest, current_user: TokenData = Depends(get_current_user)):
    """Run an MCP tool"""
    try:
        result = await run_tool(request.tool_name, request.input_data)
        return MCPToolResponse(
            tool_name=request.tool_name,
            result=result,
            success=True
        )
    except ValueError as e:
        return MCPToolResponse(
            tool_name=request.tool_name,
            result=None,
            success=False,
            error=str(e)
        )
    except Exception as e:
        logger.error(f"MCP tool error: {e}")
        return MCPToolResponse(
            tool_name=request.tool_name,
            result=None,
            success=False,
            error=f"Tool execution failed: {str(e)}"
        )

# ============ SUBSCRIPTION ENDPOINTS ============

@api_router.get("/subscription/plans")
async def get_plans():
    """Get available subscription plans"""
    plans = []
    for plan, details in PLAN_DETAILS.items():
        plans.append({
            "id": plan.value,
            "name": details["name"],
            "days": details["days"],
            "credits": details["credits"],
            "price": details["price"]
        })
    return plans

@api_router.post("/subscription/create", response_model=SubscriptionResponse)
async def create_subscription(
    request: SubscriptionRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Create a subscription order"""
    try:
        order = razorpay_service.create_order(request.plan)
        
        # Store order in DB
        await db.orders.insert_one({
            "id": str(uuid.uuid4()),
            "order_id": order["order_id"],
            "user_id": current_user.user_id,
            "plan": request.plan.value,
            "amount": order["amount"],
            "status": "created",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return SubscriptionResponse(**order)
    except Exception as e:
        logger.error(f"Order creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@api_router.post("/subscription/verify")
async def verify_subscription(
    request: PaymentVerifyRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Verify payment and activate subscription"""
    # Verify signature
    if not razorpay_service.verify_payment_signature(
        request.razorpay_order_id,
        request.razorpay_payment_id,
        request.razorpay_signature
    ):
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    
    # Get order
    order = await db.orders.find_one({"order_id": request.razorpay_order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Order does not belong to you")
    
    try:
        # Process subscription
        plan = SubscriptionPlan(order["plan"])
        result = await razorpay_service.process_subscription(
            db, current_user.user_id, plan, request.razorpay_payment_id
        )
        
        # Update order status
        await db.orders.update_one(
            {"order_id": request.razorpay_order_id},
            {"$set": {"status": "completed", "payment_id": request.razorpay_payment_id}}
        )
        
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"Subscription processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process subscription: {str(e)}")

# ============ ADMIN ENDPOINTS ============

@api_router.get("/admin/users", response_model=List[AdminUserResponse])
async def admin_list_users(current_user: TokenData = Depends(get_admin_user)):
    """Admin: List all users"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [AdminUserResponse(**u) for u in users]

@api_router.post("/admin/credits/grant")
async def admin_grant_credits(
    request: AdminGrantCredits,
    current_user: TokenData = Depends(get_admin_user)
):
    """Admin: Grant or deduct credits"""
    user = await db.users.find_one({"id": request.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await add_credits(db, request.user_id, request.credits, request.reason)
    
    return {"success": True, "credits_added": request.credits}

@api_router.get("/admin/usage", response_model=List[UsageLog])
async def admin_get_usage(
    limit: int = 100,
    current_user: TokenData = Depends(get_admin_user)
):
    """Admin: Get usage logs"""
    logs = await db.usage_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return [UsageLog(**log) for log in logs]

@api_router.get("/admin/errors", response_model=List[ErrorLog])
async def admin_get_errors(
    limit: int = 100,
    current_user: TokenData = Depends(get_admin_user)
):
    """Admin: Get error logs"""
    logs = await db.error_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return [ErrorLog(**log) for log in logs]

@api_router.get("/admin/documents")
async def admin_get_documents(current_user: TokenData = Depends(get_admin_user)):
    """Admin: Get all uploaded documents"""
    docs = await db.documents.find({}, {"_id": 0, "full_text": 0}).to_list(1000)
    return docs

@api_router.get("/admin/subscriptions")
async def admin_get_subscriptions(current_user: TokenData = Depends(get_admin_user)):
    """Admin: Get subscription history"""
    subs = await db.subscriptions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return subs

@api_router.get("/admin/revenue")
async def admin_get_revenue(current_user: TokenData = Depends(get_admin_user)):
    """Admin: Get revenue overview"""
    # Get all completed subscriptions
    subs = await db.subscriptions.find({}, {"_id": 0}).to_list(10000)
    
    total_revenue = sum(s.get("amount", 0) for s in subs)
    total_credits_sold = sum(s.get("credits_added", 0) for s in subs)
    
    return {
        "total_revenue": total_revenue,
        "total_credits_sold": total_credits_sold,
        "total_subscriptions": len(subs)
    }

@api_router.post("/admin/subscription/override")
async def admin_override_subscription(
    user_id: str,
    expiry_date: str,
    current_user: TokenData = Depends(get_admin_user)
):
    """Admin: Override user subscription expiry"""
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"subscription_expiry": expiry_date}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "new_expiry": expiry_date}

@api_router.get("/admin/export/usage")
async def admin_export_usage(current_user: TokenData = Depends(get_admin_user)):
    """Admin: Export usage logs as CSV"""
    import csv
    from io import StringIO
    from fastapi.responses import StreamingResponse
    
    logs = await db.usage_logs.find({}, {"_id": 0}).to_list(10000)
    
    output = StringIO()
    if logs:
        writer = csv.DictWriter(output, fieldnames=logs[0].keys())
        writer.writeheader()
        writer.writerows(logs)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=usage_logs.csv"}
    )

# ============ UTILITY ENDPOINTS ============

@api_router.get("/")
async def root():
    return {"message": "JaipurEyeVision Studio API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

@api_router.get("/history")
async def get_history(
    limit: int = 50,
    current_user: TokenData = Depends(get_current_user)
):
    """Get user's generation history"""
    logs = await db.usage_logs.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    return logs

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Run seed script on startup"""
    try:
        from seed_admin import seed_admin
        await seed_admin()
    except Exception as e:
        logger.warning(f"Admin seed skipped: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
