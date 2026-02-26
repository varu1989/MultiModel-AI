from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime, timezone
from enum import Enum
import uuid

# Enums
class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class SubscriptionPlan(str, Enum):
    DAY_1 = "1_day"
    DAYS_7 = "7_days"
    DAYS_15 = "15_days"
    DAYS_30 = "30_days"
    DAYS_180 = "180_days"
    DAYS_365 = "365_days"

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ContentType(str, Enum):
    BLOG = "blog"
    AD = "ad"
    EMAIL = "email"
    SOCIAL = "social"
    SLIDE = "slide"
    SCRIPT = "script"

class CodeAction(str, Enum):
    WRITE = "write"
    DEBUG = "debug"
    EXPLAIN = "explain"
    REFACTOR = "refactor"
    TEST = "test"

# Plan details
PLAN_DETAILS = {
    SubscriptionPlan.DAY_1: {"days": 1, "credits": 5, "price": 250, "name": "1 Day Plan"},
    SubscriptionPlan.DAYS_7: {"days": 7, "credits": 50, "price": 1400, "name": "7 Days Plan"},
    SubscriptionPlan.DAYS_15: {"days": 15, "credits": 100, "price": 2500, "name": "15 Days Plan"},
    SubscriptionPlan.DAYS_30: {"days": 30, "credits": 200, "price": 4500, "name": "30 Days Plan"},
    SubscriptionPlan.DAYS_180: {"days": 180, "credits": 500, "price": 11000, "name": "180 Days Plan"},
    SubscriptionPlan.DAYS_365: {"days": 365, "credits": 1000, "price": 20000, "name": "365 Days Plan"},
}

# Credit costs
CREDIT_COSTS = {
    "content": 2,
    "code": 2,
    "research": 3,
    "image": 5,
    "video": 20,
    "tts": 1,
    "stt": 2,
}

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: UserRole = UserRole.USER
    credits: int = 0
    subscription_plan: Optional[str] = None
    subscription_expiry: Optional[str] = None
    created_at: str

class UserInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    name: str
    role: UserRole = UserRole.USER
    credits: int = 0
    subscription_plan: Optional[str] = None
    subscription_expiry: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: str
    email: str
    role: UserRole

# Document Models (RAG)
class DocumentUpload(BaseModel):
    filename: str
    content_type: str

class DocumentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    filename: str
    file_type: str
    chunk_count: int
    created_at: str

class ChunkResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    document_id: str
    text: str
    chunk_index: int
    embedding: Optional[List[float]] = None

# Generation Request Models
class ContentRequest(BaseModel):
    content_type: ContentType
    topic: str
    tone: Optional[str] = "professional"
    length: Optional[str] = "medium"
    additional_context: Optional[str] = None

class CodeRequest(BaseModel):
    action: CodeAction
    code: Optional[str] = None
    language: str = "python"
    description: Optional[str] = None

class ResearchRequest(BaseModel):
    topic: str
    depth: Optional[str] = "comprehensive"
    focus_areas: Optional[List[str]] = None

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "alloy"
    speed: Optional[float] = 1.0

class ImageRequest(BaseModel):
    prompt: str
    style: Optional[str] = None

class ImageEditRequest(BaseModel):
    image_base64: str
    prompt: str
    edit_type: Optional[str] = "enhance"

class VideoRequest(BaseModel):
    prompt: str
    duration: Optional[int] = 4
    size: Optional[str] = "1280x720"

# Generation Response Models
class ContentResponse(BaseModel):
    content: str
    content_type: str
    credits_used: int
    citations: Optional[List[Dict[str, Any]]] = None

class CodeResponse(BaseModel):
    code: str
    explanation: Optional[str] = None
    action: str
    credits_used: int
    citations: Optional[List[Dict[str, Any]]] = None

class ResearchResponse(BaseModel):
    executive_summary: str
    key_insights: List[str]
    risks: List[str]
    action_steps: List[str]
    sources: List[str]
    credits_used: int
    citations: Optional[List[Dict[str, Any]]] = None

class TTSResponse(BaseModel):
    audio_base64: str
    format: str = "mp3"
    credits_used: int

class STTResponse(BaseModel):
    text: str
    credits_used: int

class ImageResponse(BaseModel):
    image_base64: str
    credits_used: int

class VideoResponse(BaseModel):
    job_id: str
    status: JobStatus
    message: str

# Job Model
class JobResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    job_type: str
    status: JobStatus
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None

# Subscription Models
class SubscriptionRequest(BaseModel):
    plan: SubscriptionPlan

class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class SubscriptionResponse(BaseModel):
    order_id: str
    amount: int
    currency: str = "INR"
    plan: str
    key_id: str

# Admin Models
class AdminGrantCredits(BaseModel):
    user_id: str
    credits: int
    reason: Optional[str] = None

class AdminUserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    credits: int
    subscription_plan: Optional[str] = None
    subscription_expiry: Optional[str] = None
    created_at: str

class UsageLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    action: str
    credits_used: int
    details: Optional[Dict[str, Any]] = None
    timestamp: str

class ErrorLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: Optional[str] = None
    error_type: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: str

# MCP Tool Models
class MCPToolRequest(BaseModel):
    tool_name: str
    input_data: Dict[str, Any]

class MCPToolResponse(BaseModel):
    tool_name: str
    result: Any
    success: bool
    error: Optional[str] = None

# Credits Models
class CreditsBalance(BaseModel):
    credits: int
    subscription_plan: Optional[str] = None
    subscription_expiry: Optional[str] = None
    subscription_active: bool = False

# RAG Query
class RAGQueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 6
