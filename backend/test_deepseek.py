#!/usr/bin/env python3
"""Test script para verificar que DeepSeek funciona correctamente"""

import os
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

async def test_deepseek():
    api_key = os.getenv("DEEPSEEK_API_KEY")
    
    if not api_key:
        print("❌ No se encontró DEEPSEEK_API_KEY en el .env")
        return
    
    print(f"✅ API Key encontrada: {api_key[:10]}...")
    
    try:
        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com"
        )
        
        print("📡 Conectando con DeepSeek...")
        
        response = await client.chat.completions.create(
            model="deepseek-reasoner",
            messages=[
                {
                    "role": "system",
                    "content": "Eres un asistente útil que responde en JSON."
                },
                {
                    "role": "user",
                    "content": "Di 'Hola mundo' en formato JSON con la clave 'mensaje'"
                }
            ],
            temperature=0.7,
            max_tokens=100,
            response_format={"type": "json_object"}
        )
        
        print("✅ Respuesta recibida:")
        print(response.choices[0].message.content)
        
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {str(e)}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(test_deepseek())
