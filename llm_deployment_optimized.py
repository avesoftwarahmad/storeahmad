"""
Optimized LLM Deployment for Google Colab + ngrok + Render Integration
This script provides both RAG (/chat) and simple generation (/generate) endpoints
"""

# Step 1: Install dependencies (run this first in Colab)
# !pip install -q transformers torch sentence-transformers faiss-cpu
# !pip install -q fastapi uvicorn pyngrok nest-asyncio
# !pip install -q accelerate bitsandbytes

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from sentence_transformers import SentenceTransformer
import faiss
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uvicorn
import threading
import time
import re
import json

# Check GPU availability
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🚀 Using device: {device}")

# ==================== CONFIGURATION ====================
# Use a lightweight model that works well in Colab free tier
LLM_MODEL = "microsoft/phi-2"  # Lightweight and efficient
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
MAX_TOKENS_LIMIT = 500

# ==================== KNOWLEDGE BASE ====================
# Your Shoplite knowledge base
KNOWLEDGE_BASE = [
    {
        "id": "doc1",
        "title": "Shoplite Registration",
        "content": "To register on Shoplite, buyers provide name, email, and password. Email verification required within 24 hours. Sellers need business documents, tax ID, bank info. Verification takes 2-3 days."
    },
    {
        "id": "doc2", 
        "title": "Shoplite Returns",
        "content": "Returns accepted within 14 days if unused with original packaging. Digital downloads and personalized items non-returnable. Refunds processed in 5-7 days to original payment method."
    },
    {
        "id": "doc3",
        "title": "Shoplite Shipping",
        "content": "We offer Standard (5-7 days, $5.99), Express (2-3 days, $12.99), and Overnight ($24.99) shipping. Free shipping on orders over $50."
    },
    {
        "id": "doc4",
        "title": "Shoplite Payment",
        "content": "We accept credit cards, PayPal, and mobile wallets. All payments are encrypted and secure. Refunds are processed to the original payment method."
    },
    {
        "id": "doc5",
        "title": "Shoplite Support",
        "content": "Contact us via email, live chat, or phone. Support hours are 9 AM to 6 PM EST. We respond to emails within 24 hours and live chat within 5 minutes."
    }
]

# ==================== MODEL LOADING ====================
print(f"📦 Loading LLM: {LLM_MODEL}")

# 4-bit quantization for memory efficiency
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16
)

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

# Load model with fallback
try:
    model = AutoModelForCausalLM.from_pretrained(
        LLM_MODEL,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True
    )
    print("✅ LLM loaded with 4-bit quantization")
except Exception as e:
    print(f"⚠️ Quantization failed, loading without: {e}")
    model = AutoModelForCausalLM.from_pretrained(
        LLM_MODEL,
        device_map="auto",
        trust_remote_code=True
    )
    print("✅ LLM loaded without quantization")

# ==================== RAG SETUP ====================
print("🔍 Setting up RAG system...")
embedder = SentenceTransformer(EMBEDDING_MODEL)

# Create embeddings
docs_text = [doc["content"] for doc in KNOWLEDGE_BASE]
doc_embeddings = embedder.encode(docs_text, convert_to_tensor=True)

# Build FAISS index
embedding_dim = doc_embeddings.shape[1]
index = faiss.IndexFlatL2(embedding_dim)
index.add(doc_embeddings.cpu().detach().numpy())
print(f"✅ FAISS index built with {index.ntotal} vectors")

# ==================== GENERATION FUNCTIONS ====================
def retrieve_documents(query: str, top_k: int = 3, threshold: float = 1.5):
    """Retrieve relevant documents for a query"""
    query_embedding = embedder.encode([query], convert_to_tensor=True)
    distances, indices = index.search(query_embedding.cpu().detach().numpy(), top_k)
    
    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if dist <= threshold:
            results.append({
                "doc": KNOWLEDGE_BASE[idx],
                "distance": float(dist)
            })
    return results

def generate_text(prompt: str, max_tokens: int = 200, temperature: float = 0.7) -> str:
    """Simple text generation - used by /generate endpoint"""
    try:
        # Tokenize
        inputs = tokenizer(
            prompt, 
            return_tensors="pt", 
            truncation=True, 
            max_length=1024
        )
        
        # Move to device
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        # Generate
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=min(max_tokens, MAX_TOKENS_LIMIT),
                temperature=temperature,
                do_sample=temperature > 0,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id
            )
        
        # Decode
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Remove input prompt
        if response.startswith(prompt):
            response = response[len(prompt):].strip()
        
        return response
    
    except Exception as e:
        print(f"❌ Generation error: {e}")
        return f"Sorry, I encountered an error generating a response."

def generate_rag_response(query: str) -> Dict[str, Any]:
    """RAG-based generation for /chat endpoint"""
    # Retrieve documents
    retrieved_docs = retrieve_documents(query, top_k=2, threshold=1.5)
    
    if not retrieved_docs:
        return {
            "answer": "I couldn't find information about this in Shoplite documentation. Please contact our support team for assistance.",
            "sources": [],
            "confidence": "low"
        }
    
    # Build context
    context = "\n".join([d['doc']['content'] for d in retrieved_docs])
    sources = [d['doc']['title'] for d in retrieved_docs]
    
    # Build prompt
    prompt = f"""You are Alex, a helpful customer support specialist at ahmad store. Answer the customer's question using only the provided context. Be friendly, professional, and concise.

Context: {context}

Customer question: {query}

Answer:"""
    
    # Generate
    answer = generate_text(prompt, max_tokens=150, temperature=0.3)
    
    # Confidence
    min_dist = min(r['distance'] for r in retrieved_docs)
    confidence = "high" if min_dist < 0.5 else "medium" if min_dist < 1.0 else "low"
    
    return {
        "answer": answer.strip(),
        "sources": sources,
        "confidence": confidence
    }

# ==================== FASTAPI SETUP ====================
app = FastAPI(
    title="Shoplite LLM API", 
    version="2.0",
    description="Custom LLM API for Shoplite AI Assistant"
)

# Request models
class ChatRequest(BaseModel):
    question: str

class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: Optional[int] = 200
    temperature: Optional[float] = 0.7

# Endpoints
@app.get("/")
async def root():
    return {
        "status": "online",
        "model": LLM_MODEL,
        "device": device,
        "endpoints": ["/chat", "/generate", "/health"],
        "message": "Shoplite LLM API is running!"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "llm_model": LLM_MODEL,
        "device": device,
        "knowledge_base_size": len(KNOWLEDGE_BASE)
    }

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """RAG endpoint for intelligent responses"""
    try:
        result = generate_rag_response(request.question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_endpoint(request: GenerateRequest):
    """Simple generation endpoint - used by your website"""
    try:
        text = generate_text(
            request.prompt,
            request.max_tokens,
            request.temperature
        )
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SERVER STARTUP ====================
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 Starting Shoplite LLM API Server")
    print("="*60)
    
    # For Colab, use ngrok
    USE_NGROK = True
    
    if USE_NGROK:
        from pyngrok import ngrok, conf
        import nest_asyncio
        nest_asyncio.apply()
        
        # Start server in background
        def run_server():
            uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
        
        thread = threading.Thread(target=run_server, daemon=True)
        thread.start()
        time.sleep(5)  # Give server time to start
        
        # Setup ngrok
        print("\n🔑 Enter your ngrok token:")
        token = input("Token: ").strip()
        
        if token:
            conf.get_default().auth_token = token
            public_url = ngrok.connect(8000).public_url
            
            print(f"\n✅ API is live at: {public_url}")
            print(f"📚 API Docs: {public_url}/docs")
            print(f"\n🎯 Key Endpoints:")
            print(f"  POST {public_url}/generate - For your website AI assistant")
            print(f"  POST {public_url}/chat - For RAG-based responses")
            print(f"  GET  {public_url}/health - Health check")
            
            print(f"\n🔧 Add this to your Render environment:")
            print(f"LLM_ENDPOINT={public_url}/generate")
            
            # Test the endpoint
            print(f"\n🧪 Testing endpoint...")
            try:
                import requests
                test_response = requests.post(f"{public_url}/generate", json={
                    "prompt": "Hello, how can I help you today?",
                    "max_tokens": 50
                })
                if test_response.status_code == 200:
                    print("✅ Endpoint test successful!")
                    print(f"Response: {test_response.json()}")
                else:
                    print(f"❌ Test failed: {test_response.status_code}")
            except Exception as e:
                print(f"⚠️ Test error: {e}")
            
            # Keep running
            print(f"\n🔄 Server is running... Press Ctrl+C to stop")
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n👋 Shutting down...")
    else:
        # Local server
        uvicorn.run(app, host="0.0.0.0", port=8000)