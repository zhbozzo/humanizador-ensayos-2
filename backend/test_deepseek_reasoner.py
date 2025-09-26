#!/usr/bin/env python3
"""
Test script para verificar que DeepSeek Reasoner funciona correctamente
"""

import os
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

async def test_deepseek_reasoner():
    # Obtener API key
    api_key = os.getenv("DEEPSEEK_API_KEY")
    
    if not api_key or api_key == "sk-f50fcdbbea8c499cb9f72124754391f4":
        print("❌ ERROR: No hay API key de DeepSeek configurada")
        print("Por favor, edita el archivo .env y agrega tu DEEPSEEK_API_KEY")
        return False
    
    print(f"✅ API Key encontrada: {api_key[:10]}...")
    
    # Crear cliente
    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com"
    )
    
    # Texto de prueba
    test_text = "La inteligencia artificial ha transformado el mundo del trabajo de manera profunda."
    
    try:
        print("\n🚀 Probando DeepSeek Reasoner V3.1...")
        print(f"Texto original: {test_text}")
        print("\nEnviando solicitud...")
        
        response = await client.chat.completions.create(
            model="deepseek-reasoner",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Eres un editor experto que transforma textos en versiones "
                        "más naturales y humanas. Responde SOLO con el texto reescrito, "
                        "sin explicaciones adicionales."
                    )
                },
                {
                    "role": "user",
                    "content": f"Reescribe este texto de forma más natural y humana: {test_text}"
                }
            ],
            temperature=0.85,
            max_tokens=10000
        )
        
        result = response.choices[0].message.content
        print(f"\n✅ ÉXITO! Respuesta recibida:")
        print(f"Texto humanizado: {result}")
        
        # Información del modelo
        print(f"\n📊 Información del modelo:")
        print(f"- Modelo usado: {response.model}")
        print(f"- Tokens usados: {response.usage.total_tokens if response.usage else 'N/A'}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR al llamar a la API: {e}")
        print(f"Tipo de error: {type(e).__name__}")
        
        if "authentication" in str(e).lower():
            print("\n⚠️  La API key parece ser inválida. Verifica que:")
            print("1. La API key es correcta")
            print("2. Tienes créditos disponibles en tu cuenta DeepSeek")
            print("3. La API key tiene permisos para usar deepseek-reasoner")
        
        return False

if __name__ == "__main__":
    success = asyncio.run(test_deepseek_reasoner())
    
    if success:
        print("\n✅ Todo funcionando correctamente!")
        print("El humanizador debería funcionar ahora.")
    else:
        print("\n❌ Hay problemas con la configuración.")
        print("\nPasos para solucionarlo:")
        print("1. Ve a https://platform.deepseek.com/")
        print("2. Obtén tu API key")
        print("3. Edita backend/.env y agrega: DEEPSEEK_API_KEY=sk-f50fcdbbea8c499cb9f72124754391f4")
