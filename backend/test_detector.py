#!/usr/bin/env python3
"""
Script de prueba para el detector de IA
"""

import requests
import json

API_URL = "http://localhost:8000/api/detect"

# Texto de prueba generado por IA
AI_TEXT = """
La inteligencia artificial es fundamental para el desarrollo tecnológico moderno. 
Mediante diversos algoritmos y técnicas de aprendizaje automático, es posible 
crear sistemas que pueden realizar tareas complejas de manera eficiente. 
Además, estos sistemas son capaces de mejorar continuamente su rendimiento 
a través del procesamiento de grandes cantidades de datos. Por lo tanto, 
la implementación de soluciones basadas en IA resulta crucial para mantener 
la competitividad en el mercado actual.
"""

# Texto escrito por humano (más natural)
HUMAN_TEXT = """
Mira, la verdad es que la IA está en todas partes ahora. O sea, literalmente
no puedes escapar de ella. El otro día estaba pensando... bueno, en realidad
fue hace como una semana, que es súper raro cómo las máquinas ahora pueden
escribir textos que parecen humanos. Aunque, pensándolo bien, no siempre
funcionan tan bien. A veces dicen cosas raras. Pero en fin, supongo que
es el futuro y hay que adaptarse, ¿no?
"""

def test_detection(text, label):
    print(f"\n{'='*60}")
    print(f"Probando: {label}")
    print('='*60)
    print(f"Texto: {text[:100]}...")
    
    response = requests.post(API_URL, json={"text": text, "language": "es"})
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ Resultado:")
        print(f"  • Puntuación Humana: {result['human_score']}%")
        print(f"  • Probabilidad IA: {result['ai_probability']}%")
        print(f"  • Clasificación: {result['classification']}")
        print(f"\n📊 Métricas:")
        for metric, value in result['metrics'].items():
            print(f"  • {metric}: {value:.1f}")
        print(f"\n💡 Análisis:")
        print(f"  {result['analysis']}")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    print("🔍 PRUEBA DEL DETECTOR DE IA")
    
    # Probar con texto de IA
    test_detection(AI_TEXT, "TEXTO GENERADO POR IA")
    
    # Probar con texto humano
    test_detection(HUMAN_TEXT, "TEXTO ESCRITO POR HUMANO")
    
    print(f"\n{'='*60}")
    print("✅ Pruebas completadas")
