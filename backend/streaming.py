from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator
import json
import asyncio
from modules.text_rewriter import TextRewriter

async def stream_humanize(text: str, budget: float = 0.5) -> AsyncGenerator[str, None]:
    """
    Stream the humanization process in real-time
    """
    rewriter = TextRewriter()
    
    # Simulate streaming by yielding parts of the result
    # In a real implementation, you'd stream from the API
    
    yield f"data: {json.dumps({'type': 'status', 'message': 'Iniciando procesamiento...'})}\n\n"
    await asyncio.sleep(0.5)
    
    yield f"data: {json.dumps({'type': 'status', 'message': 'Analizando texto...'})}\n\n"
    await asyncio.sleep(0.5)
    
    yield f"data: {json.dumps({'type': 'status', 'message': 'Aplicando humanización...'})}\n\n"
    await asyncio.sleep(0.5)
    
    # Process the text
    result = await rewriter.rewrite(
        text=text,
        budget=budget,
        preserve_entities=True,
        respect_style=False,
        style_sample=None,
        frozen_entities=[]
    )
    
    # Stream the result word by word
    words = result['rewritten'].split()
    for i, word in enumerate(words):
        yield f"data: {json.dumps({'type': 'text', 'content': word + ' ', 'progress': (i+1)/len(words)})}\n\n"
        await asyncio.sleep(0.01)  # Small delay for streaming effect
    
    yield f"data: {json.dumps({'type': 'complete', 'metrics': result.get('notes', [])})}\n\n"
