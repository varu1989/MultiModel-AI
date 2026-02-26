"""
MCP Tool System - Modular tool registry
Each tool has: name, description, input_schema, run()
"""

import os
import uuid
from typing import Dict, Any, List, Callable
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')

@dataclass
class MCPTool:
    name: str
    description: str
    input_schema: Dict[str, Any]
    run: Callable

# Tool implementations
async def summarize_doc(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Summarize a document"""
    text = input_data.get("text", "")
    length = input_data.get("length", "medium")
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You are an expert at summarizing documents concisely."
    ).with_model("openai", "gpt-5.2")
    
    prompt = f"Summarize the following text in a {length} length:\n\n{text}"
    response = await chat.send_message(UserMessage(text=prompt))
    
    return {"summary": response}

async def extract_key_points(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract key points from text"""
    text = input_data.get("text", "")
    count = input_data.get("count", 5)
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You extract the most important points from text."
    ).with_model("openai", "gpt-5.2")
    
    prompt = f"Extract exactly {count} key points from this text:\n\n{text}"
    response = await chat.send_message(UserMessage(text=prompt))
    
    points = [line.strip("- •").strip() for line in response.split("\n") if line.strip()]
    return {"key_points": points[:count]}

async def generate_quiz(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate quiz questions from content"""
    text = input_data.get("text", "")
    num_questions = input_data.get("num_questions", 5)
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You create educational quiz questions with multiple choice answers."
    ).with_model("openai", "gpt-5.2")
    
    prompt = f"""Create {num_questions} multiple choice questions based on this content:

{text}

Format each question as:
Q: [Question]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct letter]"""
    
    response = await chat.send_message(UserMessage(text=prompt))
    return {"quiz": response}

async def seo_audit(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Perform SEO audit on content"""
    content = input_data.get("content", "")
    target_keyword = input_data.get("keyword", "")
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You are an SEO expert who analyzes content for search optimization."
    ).with_model("openai", "gpt-5.2")
    
    prompt = f"""Perform an SEO audit on this content targeting the keyword "{target_keyword}":

{content}

Provide:
1. Keyword density analysis
2. Readability score (Flesch)
3. Meta description suggestion
4. Title tag suggestion
5. Improvement recommendations"""
    
    response = await chat.send_message(UserMessage(text=prompt))
    return {"audit": response}

async def code_review(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Review code for quality and issues"""
    code = input_data.get("code", "")
    language = input_data.get("language", "python")
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message=f"You are a senior {language} developer reviewing code."
    ).with_model("openai", "gpt-5.2")
    
    prompt = f"""Review this {language} code:

```{language}
{code}
```

Provide:
1. Code quality score (1-10)
2. Security issues
3. Performance concerns
4. Best practice violations
5. Specific improvement suggestions"""
    
    response = await chat.send_message(UserMessage(text=prompt))
    return {"review": response}

async def create_storyboard(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a video storyboard"""
    concept = input_data.get("concept", "")
    duration = input_data.get("duration", 60)
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You are a professional video storyboard artist."
    ).with_model("openai", "gpt-5.2")
    
    prompt = f"""Create a storyboard for a {duration}-second video about:

{concept}

For each scene include:
- Scene number
- Duration (seconds)
- Visual description
- Camera movement
- Audio/voiceover notes"""
    
    response = await chat.send_message(UserMessage(text=prompt))
    return {"storyboard": response}

async def image_prompt_enhancer(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Enhance an image generation prompt"""
    prompt = input_data.get("prompt", "")
    style = input_data.get("style", "")
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You enhance image generation prompts for better results."
    ).with_model("openai", "gpt-5.2")
    
    request = f"""Enhance this image generation prompt for better, more detailed results:

Original: {prompt}
{"Preferred style: " + style if style else ""}

Provide an enhanced prompt with:
- More specific visual details
- Lighting and atmosphere
- Composition suggestions
- Style modifiers"""
    
    response = await chat.send_message(UserMessage(text=request))
    return {"enhanced_prompt": response}

async def video_prompt_enhancer(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Enhance a video generation prompt"""
    prompt = input_data.get("prompt", "")
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You enhance video generation prompts for AI video generators."
    ).with_model("openai", "gpt-5.2")
    
    request = f"""Enhance this video generation prompt:

Original: {prompt}

Create an improved prompt that includes:
- Scene setting and environment
- Motion and action descriptions
- Camera movement suggestions
- Lighting and mood
- Style and aesthetic notes"""
    
    response = await chat.send_message(UserMessage(text=request))
    return {"enhanced_prompt": response}

async def meeting_minutes(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate meeting minutes from transcript"""
    transcript = input_data.get("transcript", "")
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You create professional meeting minutes from transcripts."
    ).with_model("openai", "gpt-5.2")
    
    prompt = f"""Create formal meeting minutes from this transcript:

{transcript}

Include:
- Date and attendees (if mentioned)
- Agenda items discussed
- Key decisions made
- Action items with owners
- Next steps"""
    
    response = await chat.send_message(UserMessage(text=prompt))
    return {"minutes": response}

async def speech_cleanup(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Clean up transcribed speech"""
    text = input_data.get("text", "")
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You clean up and format transcribed speech into readable text."
    ).with_model("openai", "gpt-5.2")
    
    prompt = f"""Clean up this transcribed speech:

{text}

- Remove filler words (um, uh, like, you know)
- Fix grammar and punctuation
- Add proper paragraph breaks
- Maintain the original meaning and tone"""
    
    response = await chat.send_message(UserMessage(text=prompt))
    return {"cleaned_text": response}

# Tool Registry
MCP_TOOLS: Dict[str, MCPTool] = {
    "summarize_doc": MCPTool(
        name="summarize_doc",
        description="Summarize a document or text into key points",
        input_schema={
            "text": {"type": "string", "description": "Text to summarize", "required": True},
            "length": {"type": "string", "description": "short, medium, or long", "required": False}
        },
        run=summarize_doc
    ),
    "extract_key_points": MCPTool(
        name="extract_key_points",
        description="Extract key points from text",
        input_schema={
            "text": {"type": "string", "description": "Text to analyze", "required": True},
            "count": {"type": "integer", "description": "Number of points to extract", "required": False}
        },
        run=extract_key_points
    ),
    "generate_quiz": MCPTool(
        name="generate_quiz",
        description="Generate quiz questions from content",
        input_schema={
            "text": {"type": "string", "description": "Content to create quiz from", "required": True},
            "num_questions": {"type": "integer", "description": "Number of questions", "required": False}
        },
        run=generate_quiz
    ),
    "seo_audit": MCPTool(
        name="seo_audit",
        description="Perform SEO analysis on content",
        input_schema={
            "content": {"type": "string", "description": "Content to audit", "required": True},
            "keyword": {"type": "string", "description": "Target keyword", "required": False}
        },
        run=seo_audit
    ),
    "code_review": MCPTool(
        name="code_review",
        description="Review code for quality and issues",
        input_schema={
            "code": {"type": "string", "description": "Code to review", "required": True},
            "language": {"type": "string", "description": "Programming language", "required": False}
        },
        run=code_review
    ),
    "create_storyboard": MCPTool(
        name="create_storyboard",
        description="Create a video storyboard from concept",
        input_schema={
            "concept": {"type": "string", "description": "Video concept", "required": True},
            "duration": {"type": "integer", "description": "Video duration in seconds", "required": False}
        },
        run=create_storyboard
    ),
    "image_prompt_enhancer": MCPTool(
        name="image_prompt_enhancer",
        description="Enhance image generation prompts",
        input_schema={
            "prompt": {"type": "string", "description": "Original prompt", "required": True},
            "style": {"type": "string", "description": "Preferred style", "required": False}
        },
        run=image_prompt_enhancer
    ),
    "video_prompt_enhancer": MCPTool(
        name="video_prompt_enhancer",
        description="Enhance video generation prompts",
        input_schema={
            "prompt": {"type": "string", "description": "Original prompt", "required": True}
        },
        run=video_prompt_enhancer
    ),
    "meeting_minutes": MCPTool(
        name="meeting_minutes",
        description="Generate meeting minutes from transcript",
        input_schema={
            "transcript": {"type": "string", "description": "Meeting transcript", "required": True}
        },
        run=meeting_minutes
    ),
    "speech_cleanup": MCPTool(
        name="speech_cleanup",
        description="Clean up transcribed speech",
        input_schema={
            "text": {"type": "string", "description": "Transcribed text", "required": True}
        },
        run=speech_cleanup
    )
}

def get_all_tools() -> List[Dict[str, Any]]:
    """Get list of all available tools"""
    return [
        {
            "name": tool.name,
            "description": tool.description,
            "input_schema": tool.input_schema
        }
        for tool in MCP_TOOLS.values()
    ]

async def run_tool(tool_name: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Run a specific MCP tool"""
    if tool_name not in MCP_TOOLS:
        raise ValueError(f"Tool '{tool_name}' not found")
    
    tool = MCP_TOOLS[tool_name]
    return await tool.run(input_data)
