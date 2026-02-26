import os
import uuid
import tiktoken
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from io import BytesIO
import PyPDF2
from docx import Document
import csv

# Chunk settings
CHUNK_SIZE = 800
CHUNK_OVERLAP = 120

def count_tokens(text: str) -> int:
    """Count tokens in text using tiktoken"""
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text))
    except Exception:
        # Fallback to word-based estimation
        return len(text.split())

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Split text into overlapping chunks based on token count"""
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        tokens = encoding.encode(text)
    except Exception:
        # Fallback to word-based chunking
        words = text.split()
        chunks = []
        i = 0
        while i < len(words):
            chunk_words = words[i:i + chunk_size]
            chunks.append(' '.join(chunk_words))
            i += chunk_size - overlap
        return chunks
    
    chunks = []
    i = 0
    while i < len(tokens):
        chunk_tokens = tokens[i:i + chunk_size]
        chunk_text = encoding.decode(chunk_tokens)
        chunks.append(chunk_text)
        i += chunk_size - overlap
    
    return chunks

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF file"""
    pdf_file = BytesIO(file_bytes)
    reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX file"""
    doc_file = BytesIO(file_bytes)
    doc = Document(doc_file)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text

def extract_text_from_csv(file_bytes: bytes) -> str:
    """Extract text from CSV file"""
    csv_file = BytesIO(file_bytes)
    text_content = csv_file.read().decode('utf-8', errors='ignore')
    return text_content

def extract_text_from_txt(file_bytes: bytes) -> str:
    """Extract text from TXT file"""
    return file_bytes.decode('utf-8', errors='ignore')

def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extract text based on file type"""
    ext = filename.lower().split('.')[-1]
    
    if ext == 'pdf':
        return extract_text_from_pdf(file_bytes)
    elif ext == 'docx':
        return extract_text_from_docx(file_bytes)
    elif ext == 'csv':
        return extract_text_from_csv(file_bytes)
    elif ext == 'txt':
        return extract_text_from_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

async def store_document(db, user_id: str, filename: str, file_bytes: bytes) -> Dict[str, Any]:
    """Store document and create chunks"""
    # Extract text
    text = extract_text(file_bytes, filename)
    
    # Create chunks
    chunks = chunk_text(text)
    
    # Create document record
    doc_id = str(uuid.uuid4())
    doc = {
        "id": doc_id,
        "user_id": user_id,
        "filename": filename,
        "file_type": filename.split('.')[-1].lower(),
        "full_text": text,
        "chunk_count": len(chunks),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.documents.insert_one(doc)
    
    # Store chunks
    chunk_docs = []
    for i, chunk_text_content in enumerate(chunks):
        chunk_doc = {
            "id": str(uuid.uuid4()),
            "document_id": doc_id,
            "user_id": user_id,
            "text": chunk_text_content,
            "chunk_index": i,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        chunk_docs.append(chunk_doc)
    
    if chunk_docs:
        await db.chunks.insert_many(chunk_docs)
    
    return {
        "id": doc_id,
        "user_id": user_id,
        "filename": filename,
        "file_type": doc["file_type"],
        "chunk_count": len(chunks),
        "created_at": doc["created_at"]
    }

async def get_user_documents(db, user_id: str) -> List[Dict[str, Any]]:
    """Get all documents for a user"""
    docs = await db.documents.find(
        {"user_id": user_id},
        {"_id": 0, "full_text": 0}
    ).to_list(1000)
    return docs

async def delete_document(db, user_id: str, doc_id: str) -> bool:
    """Delete a document and its chunks"""
    # Delete chunks
    await db.chunks.delete_many({"document_id": doc_id, "user_id": user_id})
    
    # Delete document
    result = await db.documents.delete_one({"id": doc_id, "user_id": user_id})
    return result.deleted_count > 0

async def search_chunks(db, user_id: str, query: str, top_k: int = 6) -> List[Dict[str, Any]]:
    """Search for relevant chunks using text similarity"""
    # Get all chunks for user
    chunks = await db.chunks.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(10000)
    
    if not chunks:
        return []
    
    # Simple keyword-based relevance scoring
    query_words = set(query.lower().split())
    scored_chunks = []
    
    for chunk in chunks:
        chunk_words = set(chunk["text"].lower().split())
        score = len(query_words.intersection(chunk_words)) / max(len(query_words), 1)
        scored_chunks.append({
            **chunk,
            "relevance_score": score
        })
    
    # Sort by score and return top_k
    scored_chunks.sort(key=lambda x: x["relevance_score"], reverse=True)
    return scored_chunks[:top_k]

async def get_rag_context(db, user_id: str, query: str, top_k: int = 6) -> tuple[str, List[Dict]]:
    """Get RAG context for a query - returns context string and citations"""
    # Check if user has documents
    doc_count = await db.documents.count_documents({"user_id": user_id})
    
    if doc_count == 0:
        return "", []
    
    # Search for relevant chunks
    relevant_chunks = await search_chunks(db, user_id, query, top_k)
    
    if not relevant_chunks:
        return "", []
    
    # Build context string
    context_parts = []
    citations = []
    
    for chunk in relevant_chunks:
        if chunk["relevance_score"] > 0:
            # Get document name
            doc = await db.documents.find_one(
                {"id": chunk["document_id"]},
                {"_id": 0, "filename": 1}
            )
            doc_name = doc["filename"] if doc else "Unknown"
            
            context_parts.append(f"[From {doc_name}]: {chunk['text']}")
            citations.append({
                "doc_name": doc_name,
                "chunk_id": chunk["id"],
                "relevance_score": round(chunk["relevance_score"], 3)
            })
    
    context = "\n\n".join(context_parts)
    return context, citations
