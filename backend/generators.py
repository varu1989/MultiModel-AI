import os
import uuid
import base64
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

# Import emergent integrations
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from emergentintegrations.llm.openai import OpenAITextToSpeech, OpenAISpeechToText
from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Content Generator
async def generate_content(
    content_type: str,
    topic: str,
    tone: str = "professional",
    length: str = "medium",
    additional_context: str = None,
    rag_context: str = None
) -> str:
    """Generate content using GPT-5.2"""
    
    length_guide = {
        "short": "Keep it brief, around 150-200 words.",
        "medium": "Write a moderate length piece, around 400-600 words.",
        "long": "Write a comprehensive piece, around 800-1200 words."
    }
    
    content_prompts = {
        "blog": f"Write a {tone} blog post about: {topic}",
        "ad": f"Write compelling ad copy for: {topic}. Make it catchy and persuasive.",
        "email": f"Write a {tone} email about: {topic}",
        "social": f"Write engaging social media captions for: {topic}. Create 3-5 variations.",
        "slide": f"Create slide outline for a presentation about: {topic}. Include title and bullet points for each slide.",
        "script": f"Write a {tone} script for: {topic}. Include speaker cues and timing suggestions."
    }
    
    system_message = f"""You are an expert content creator. Create high-quality, engaging content.
{length_guide.get(length, length_guide['medium'])}
Tone: {tone}"""
    
    if rag_context:
        system_message += f"\n\nUse the following context from the user's documents to inform your response:\n{rag_context}"
    
    prompt = content_prompts.get(content_type, f"Write content about: {topic}")
    if additional_context:
        prompt += f"\n\nAdditional context: {additional_context}"
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system_message
    ).with_model("openai", "gpt-5.2")
    
    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    return response

# Code Generator
async def generate_code(
    action: str,
    code: str = None,
    language: str = "python",
    description: str = None,
    rag_context: str = None
) -> Dict[str, str]:
    """Generate or modify code using GPT-5.2"""
    
    system_message = f"""You are an expert {language} programmer. You help with:
- Writing clean, efficient code
- Debugging and fixing issues
- Explaining code clearly
- Refactoring for better practices
- Writing comprehensive unit tests

Always provide well-commented, production-ready code."""
    
    if rag_context:
        system_message += f"\n\nUse the following context from the user's documents:\n{rag_context}"
    
    action_prompts = {
        "write": f"Write {language} code for: {description}",
        "debug": f"Debug and fix the following {language} code:\n```{language}\n{code}\n```\n\nDescription of issue: {description}",
        "explain": f"Explain the following {language} code in detail:\n```{language}\n{code}\n```",
        "refactor": f"Refactor the following {language} code for better readability and performance:\n```{language}\n{code}\n```",
        "test": f"Write comprehensive unit tests for the following {language} code:\n```{language}\n{code}\n```"
    }
    
    prompt = action_prompts.get(action, f"Help with {language} code: {description}")
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system_message
    ).with_model("openai", "gpt-5.2")
    
    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    
    # Try to separate code and explanation
    code_result = response
    explanation = None
    
    if "```" in response:
        parts = response.split("```")
        if len(parts) >= 3:
            code_result = parts[1]
            if code_result.startswith(language):
                code_result = code_result[len(language):].strip()
            explanation = parts[2].strip() if len(parts) > 2 else None
    
    return {"code": code_result, "explanation": explanation or response}

# Research Expert
async def generate_research(
    topic: str,
    depth: str = "comprehensive",
    focus_areas: List[str] = None,
    rag_context: str = None
) -> Dict[str, Any]:
    """Generate research report using GPT-5.2"""
    
    system_message = """You are an expert research analyst. Generate structured research reports with:
1. Executive Summary (2-3 paragraphs)
2. Key Insights (5-7 bullet points)
3. Risks (3-5 potential risks)
4. Action Steps (4-6 recommended actions)
5. Sources (list relevant sources/references)

Be thorough, analytical, and provide actionable insights."""
    
    if rag_context:
        system_message += f"\n\nIncorporate insights from the user's documents:\n{rag_context}"
    
    focus_str = ""
    if focus_areas:
        focus_str = f"\n\nFocus areas: {', '.join(focus_areas)}"
    
    prompt = f"""Create a {depth} research report on: {topic}{focus_str}

Format your response as follows:
## Executive Summary
[Your summary here]

## Key Insights
- Insight 1
- Insight 2
...

## Risks
- Risk 1
- Risk 2
...

## Action Steps
1. Step 1
2. Step 2
...

## Sources
- Source 1
- Source 2
..."""
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system_message
    ).with_model("openai", "gpt-5.2")
    
    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    
    # Parse the response
    result = {
        "executive_summary": "",
        "key_insights": [],
        "risks": [],
        "action_steps": [],
        "sources": []
    }
    
    sections = response.split("##")
    for section in sections:
        section = section.strip()
        if section.lower().startswith("executive summary"):
            result["executive_summary"] = section.replace("Executive Summary", "").strip()
        elif section.lower().startswith("key insights"):
            lines = section.replace("Key Insights", "").strip().split("\n")
            result["key_insights"] = [l.strip("- ").strip() for l in lines if l.strip() and l.strip() != "-"]
        elif section.lower().startswith("risks"):
            lines = section.replace("Risks", "").strip().split("\n")
            result["risks"] = [l.strip("- ").strip() for l in lines if l.strip() and l.strip() != "-"]
        elif section.lower().startswith("action steps"):
            lines = section.replace("Action Steps", "").strip().split("\n")
            result["action_steps"] = [l.strip("0123456789. ").strip() for l in lines if l.strip()]
        elif section.lower().startswith("sources"):
            lines = section.replace("Sources", "").strip().split("\n")
            result["sources"] = [l.strip("- ").strip() for l in lines if l.strip() and l.strip() != "-"]
    
    return result

# Text-to-Speech
async def generate_tts(
    text: str,
    voice: str = "alloy",
    speed: float = 1.0
) -> str:
    """Generate speech from text, returns base64 audio"""
    tts = OpenAITextToSpeech(api_key=EMERGENT_KEY)
    
    audio_bytes = await tts.generate_speech(
        text=text,
        model="tts-1",
        voice=voice,
        speed=speed
    )
    
    return base64.b64encode(audio_bytes).decode('utf-8')

# Speech-to-Text
async def generate_stt(file_bytes: bytes, filename: str) -> str:
    """Transcribe audio to text"""
    from io import BytesIO
    
    stt = OpenAISpeechToText(api_key=EMERGENT_KEY)
    
    audio_file = BytesIO(file_bytes)
    audio_file.name = filename
    
    response = await stt.transcribe(
        file=audio_file,
        model="whisper-1",
        response_format="json"
    )
    
    return response.text

# Image Generation
async def generate_image(prompt: str, style: str = None) -> str:
    """Generate image using Gemini Nano Banana, returns base64"""
    full_prompt = prompt
    if style:
        full_prompt = f"{prompt}, style: {style}"
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You are a creative AI assistant that generates images."
    ).with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
    
    msg = UserMessage(text=f"Create an image: {full_prompt}")
    text, images = await chat.send_message_multimodal_response(msg)
    
    if images and len(images) > 0:
        return images[0]['data']  # Already base64
    
    raise Exception("No image generated")

# Image Editing
async def edit_image(image_base64: str, prompt: str, edit_type: str = "enhance") -> str:
    """Edit image using Gemini Nano Banana"""
    
    edit_prompts = {
        "enhance": f"Enhance this image: {prompt}",
        "remove_bg": f"Remove the background from this image. {prompt}",
        "style_transfer": f"Apply style transfer to this image: {prompt}",
        "add_object": f"Add to this image: {prompt}"
    }
    
    full_prompt = edit_prompts.get(edit_type, prompt)
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You are a creative AI assistant that edits images."
    ).with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
    
    msg = UserMessage(
        text=full_prompt,
        file_contents=[ImageContent(image_base64)]
    )
    
    text, images = await chat.send_message_multimodal_response(msg)
    
    if images and len(images) > 0:
        return images[0]['data']
    
    raise Exception("No edited image generated")

# Video Generation (Async Job)
def generate_video_sync(prompt: str, duration: int = 4, size: str = "1280x720", output_path: str = None) -> str:
    """Generate video using Sora 2 (synchronous)"""
    video_gen = OpenAIVideoGeneration(api_key=EMERGENT_KEY)
    
    video_bytes = video_gen.text_to_video(
        prompt=prompt,
        model="sora-2",
        size=size,
        duration=duration,
        max_wait_time=600
    )
    
    if video_bytes and output_path:
        video_gen.save_video(video_bytes, output_path)
        return output_path
    elif video_bytes:
        return base64.b64encode(video_bytes).decode('utf-8')
    
    return None

async def start_video_job(db, user_id: str, prompt: str, duration: int = 4, size: str = "1280x720") -> str:
    """Start async video generation job"""
    job_id = str(uuid.uuid4())
    
    job = {
        "id": job_id,
        "user_id": user_id,
        "job_type": "video",
        "status": "pending",
        "params": {
            "prompt": prompt,
            "duration": duration,
            "size": size
        },
        "result": None,
        "error": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    
    await db.jobs.insert_one(job)
    
    # Start background task
    asyncio.create_task(process_video_job(db, job_id, prompt, duration, size))
    
    return job_id

async def process_video_job(db, job_id: str, prompt: str, duration: int, size: str):
    """Process video generation in background"""
    try:
        # Update status to processing
        await db.jobs.update_one(
            {"id": job_id},
            {"$set": {"status": "processing"}}
        )
        
        # Generate video
        output_path = f"/app/backend/videos/{job_id}.mp4"
        os.makedirs("/app/backend/videos", exist_ok=True)
        
        # Run sync function in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            generate_video_sync,
            prompt,
            duration,
            size,
            output_path
        )
        
        if result:
            await db.jobs.update_one(
                {"id": job_id},
                {
                    "$set": {
                        "status": "completed",
                        "result": {"video_path": result},
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        else:
            raise Exception("Video generation returned no result")
            
    except Exception as e:
        await db.jobs.update_one(
            {"id": job_id},
            {
                "$set": {
                    "status": "failed",
                    "error": str(e),
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )

async def get_job_status(db, job_id: str, user_id: str) -> Optional[Dict]:
    """Get job status"""
    job = await db.jobs.find_one(
        {"id": job_id, "user_id": user_id},
        {"_id": 0}
    )
    return job
