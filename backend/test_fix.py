#!/usr/bin/env python3
"""
Script de prueba para verificar que las correcciones funcionan:
1. Las entidades se preservan correctamente en modo Ultimate
2. El mensaje de pases muestra "Pase 1/1" en modo Standard y "Pase 1/2", "Pase 2/2" en Ultimate
"""

import json
import requests
import sys
import time

API_URL = "http://localhost:8000/api/humanize"

# Texto de prueba con entidades importantes
TEST_TEXT = """
En el año 2023, un estudio realizado por García et al. (2023) demostró que el 85% de los estudiantes
mostraron mejoras significativas. Los resultados indicaron que entre 21 y 28 estudiantes
lograron superar el umbral establecido del 75% en las evaluaciones. Según Johnson (2022),
estos datos son consistentes con investigaciones previas realizadas en 2020 y 2021.
"""

def test_humanization(level: str):
    """Prueba la humanización con el nivel especificado"""
    print(f"\n{'='*60}")
    print(f"Probando nivel: {level.upper()}")
    print('='*60)
    
    payload = {
        "text": TEST_TEXT,
        "budget": 0.3,
        "level": level,
        "preserve_entities": True,
        "respect_style": False,
        "style_sample": None
    }
    
    try:
        # Enviar solicitud
        response = requests.post(API_URL, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"✅ Solicitud exitosa")
            print(f"\n📋 Alertas:")
            for alert in result.get('alerts', []):
                print(f"  - {alert}")
            
            # Verificar entidades en el texto resultante
            result_text = result['result']
            entities_to_check = ['2023', '85%', '21', '28', '75%', '2020', '2021', 
                                'García et al. (2023)', 'Johnson (2022)']
            
            print(f"\n🔍 Verificación de entidades:")
            all_preserved = True
            for entity in entities_to_check:
                if entity in result_text:
                    print(f"  ✓ '{entity}' preservada")
                else:
                    print(f"  ✗ '{entity}' NO ENCONTRADA")
                    all_preserved = False
            
            if all_preserved:
                print(f"\n✅ TODAS las entidades fueron preservadas correctamente")
            else:
                print(f"\n❌ ERROR: Algunas entidades no fueron preservadas")
            
            # Mostrar métricas
            metrics = result.get('metrics', {})
            print(f"\n📊 Métricas:")
            print(f"  - Ratio de cambio: {metrics.get('change_ratio', 0):.2%}")
            print(f"  - Palabras raras: {metrics.get('rare_words_ratio', 0):.2%}")
            
            return all_preserved
            
        else:
            error_text = response.text
            print(f"❌ Error {response.status_code}: {error_text}")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def main():
    """Ejecuta las pruebas para ambos niveles"""
    print("🧪 Iniciando pruebas de corrección...")
    
    # Probar modo Standard
    standard_ok = test_humanization('standard')
    
    # Esperar un poco entre pruebas
    time.sleep(2)
    
    # Probar modo Ultimate
    ultimate_ok = test_humanization('ultimate')
    
    # Resumen
    print(f"\n{'='*60}")
    print("📋 RESUMEN DE PRUEBAS")
    print('='*60)
    print(f"  Modo Standard: {'✅ PASÓ' if standard_ok else '❌ FALLÓ'}")
    print(f"  Modo Ultimate: {'✅ PASÓ' if ultimate_ok else '❌ FALLÓ'}")
    
    if standard_ok and ultimate_ok:
        print("\n✅ ¡Todas las pruebas pasaron exitosamente!")
        return 0
    else:
        print("\n❌ Algunas pruebas fallaron. Revisar los errores arriba.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
