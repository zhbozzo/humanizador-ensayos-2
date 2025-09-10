from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv

from modules.entity_extractor import EntityExtractor
from modules.text_rewriter import TextRewriter
from modules.metrics_calculator import MetricsCalculator

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Humanizador de Ensayos API",
    description="API para humanizar textos académicos manteniendo naturalidad y preservando entidades",
    version="1.0.0"
)

# Configure CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize modules
entity_extractor = EntityExtractor()
text_rewriter = TextRewriter()
metrics_calculator = MetricsCalculator()


class HumanizeRequest(BaseModel):
    text: str
    budget: float = 0.2
    preserve_entities: bool = True
    respect_style: bool = False
    style_sample: Optional[str] = None


class DiffItem(BaseModel):
    type: str  # "insert", "delete", "equal"
    token: str


class Metrics(BaseModel):
    change_ratio: float
    rare_word_ratio: float
    avg_sentence_len: float
    lix: float


class HumanizeResponse(BaseModel):
    result: str
    diff: List[DiffItem]
    metrics: Metrics
    alerts: List[str]


@app.get("/")
async def root():
    return {"message": "Humanizador de Ensayos API v1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/humanize", response_model=HumanizeResponse)
async def humanize_text(request: HumanizeRequest):
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío")
    
    if request.budget < 0 or request.budget > 1:
        raise HTTPException(status_code=400, detail="El budget debe estar entre 0 y 1")
    
    try:
        # Extract and freeze entities if preserve_entities is True
        frozen_entities = []
        processed_text = request.text
        
        if request.preserve_entities:
            frozen_entities, processed_text = entity_extractor.extract_and_freeze(request.text)
        
        # Rewrite the text
        rewrite_result = await text_rewriter.rewrite(
            text=processed_text,
            budget=request.budget,
            respect_style=request.respect_style,
            style_sample=request.style_sample,
            frozen_entities=frozen_entities
        )
        
        # Verify frozen entities weren't changed
        if request.preserve_entities:
            entity_extractor.verify_entities_preserved(
                original_text=request.text,
                rewritten_text=rewrite_result["rewritten"],
                frozen_entities=frozen_entities
            )
        
        # Calculate metrics
        metrics = metrics_calculator.calculate(
            original_text=request.text,
            rewritten_text=rewrite_result["rewritten"]
        )
        
        # Generate diff
        diff = metrics_calculator.generate_diff(
            original_text=request.text,
            rewritten_text=rewrite_result["rewritten"]
        )
        
        # Generate alerts
        alerts = []
        if request.preserve_entities and frozen_entities:
            alerts.append(f"Se preservaron {len(frozen_entities)} entidades (cifras, fechas, citas)")
        
        if not os.getenv("OPENAI_API_KEY"):
            alerts.append("⚠️ Sin API key - usando modo demo (texto sin modificar)")
        
        # Add rewriter notes to alerts
        alerts.extend(rewrite_result.get("notes", []))
        
        return HumanizeResponse(
            result=rewrite_result["rewritten"],
            diff=diff,
            metrics=Metrics(**metrics),
            alerts=alerts
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando el texto: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "localhost")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    uvicorn.run("main:app", host=host, port=port, reload=debug)
