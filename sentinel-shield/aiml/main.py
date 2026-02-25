from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import re

app = FastAPI(title="SentinelShield AI - ML Microservice", version="1.0.0")

class AnalyzeRequest(BaseModel):
    content: str
    type: str  # 'text', 'url', 'image'

class AnalyzeResponse(BaseModel):
    riskScore: int
    categories: list[str]
    confidence: float
    explanation: str

# Mock AI models - In a real scenario, this uses HuggingFace Transformers
def analyze_text(text: str):
    score = 0
    categories = []
    
    text_lower = text.lower()
    
    # Simple NLP heuristics representing an AI classifier
    if "urgent" in text_lower or "wire transfer" in text_lower or "free" in text_lower:
        score += 40
        categories.append("phishing")
        
    if "kill" in text_lower or "attack" in text_lower:
        score += 50
        categories.append("violence_threat")
        
    if "password" in text_lower and "verify" in text_lower:
        score += 35
        categories.append("credential_harvesting")
        
    confidence = 0.85 if score > 0 else 0.40
    
    # Cap score
    score = min(100, score)
    
    explanation = f"Text analyzed. Risk score is {score}. Detected categories: {', '.join(categories) if categories else 'None'}."
    return {"riskScore": score, "categories": categories, "confidence": confidence, "explanation": explanation}


@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
async def analyze_threat(request: AnalyzeRequest):
    if request.type == 'text':
        return analyze_text(request.content)
    elif request.type == 'url':
        # Simulated URL analysis
        score = 80 if ".ru" in request.content or "login" in request.content else 10
        cats = ["malicious_url"] if score > 50 else []
        return {
            "riskScore": score,
            "categories": cats,
            "confidence": 0.92,
            "explanation": f"URL scan completed. Suspicion level: {score}."
        }
    else:
        # Simulated Image analysis
        return {
            "riskScore": 15,
            "categories": ["safe_image"],
            "confidence": 0.99,
            "explanation": "Image analyzed. No illicit content detected."
        }

@app.get("/health")
async def health_check():
    return {"status": "ok", "model": "loaded"}
