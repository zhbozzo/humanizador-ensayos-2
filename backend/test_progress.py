#!/usr/bin/env python3
"""
Script de prueba para verificar que los mensajes de progreso muestran:
- "Pase 1/1" en modo Standard
- "Pase 1/2" y "Pase 2/2" en modo Ultimate
"""

import json
import requests
import sys
import time
import threading

API_START_URL = "http://localhost:8000/api/humanize/start"
API_PROGRESS_URL = "http://localhost:8000/api/humanize/progress"
API_RESULT_URL = "http://localhost:8000/api/humanize/result"

# Texto de prueba corto para rapidez
TEST_TEXT = """
En el año 2023, un estudio demostró que el 85% de los estudiantes
mostraron mejoras. Entre 21 y 28 estudiantes lograron el 75%.
"""

def stream_progress(task_id, level, progress_messages):
    """Stream progress updates via SSE"""
    try:
        url = f"{API_PROGRESS_URL}/{task_id}"
        with requests.get(url, stream=True, timeout=30) as response:
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        data = json.loads(line_str[6:])
                        message = data.get('message', '')
                        
                        # Buscar mensajes de pase
                        if 'Pase' in message and 'procesando parte' in message:
                            progress_messages.append(message)
                            print(f"  📍 {message}")
                        
                        # Terminar si completado
                        if data.get('status') == 'completed':
                            break
                            
    except Exception as e:
        print(f"Error streaming progress: {e}")

def test_level_progress(level: str):
    """Prueba el progreso con el nivel especificado"""
    print(f"\n{'='*60}")
    print(f"Probando progreso para nivel: {level.upper()}")
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
        # Iniciar tarea
        response = requests.post(API_START_URL, json=payload, timeout=10)
        if response.status_code != 200:
            print(f"❌ Error iniciando tarea: {response.text}")
            return False
            
        task_id = response.json()['task_id']
        print(f"✅ Tarea iniciada: {task_id}")
        
        # Capturar mensajes de progreso
        progress_messages = []
        
        # Stream progress en thread separado
        progress_thread = threading.Thread(
            target=stream_progress, 
            args=(task_id, level, progress_messages)
        )
        progress_thread.start()
        
        # Esperar a que termine
        progress_thread.join(timeout=30)
        
        # Obtener resultado
        time.sleep(1)  # Pequeña espera
        result_url = f"{API_RESULT_URL}/{task_id}"
        result_response = requests.get(result_url, timeout=10)
        
        if result_response.status_code == 200:
            print(f"✅ Proceso completado exitosamente")
        else:
            print(f"⚠️ Resultado con código: {result_response.status_code}")
        
        # Analizar mensajes de progreso
        print(f"\n📊 Análisis de mensajes de pase:")
        
        if level == 'standard':
            # Debe tener solo "Pase 1/1"
            pase_1_1 = any('Pase 1/1' in msg for msg in progress_messages)
            pase_1_2 = any('Pase 1/2' in msg for msg in progress_messages)
            pase_2_2 = any('Pase 2/2' in msg for msg in progress_messages)
            
            if pase_1_1 and not pase_1_2 and not pase_2_2:
                print(f"  ✅ Correcto: Solo muestra 'Pase 1/1'")
                return True
            else:
                print(f"  ❌ Error: Debería mostrar solo 'Pase 1/1'")
                print(f"     - Pase 1/1: {pase_1_1}")
                print(f"     - Pase 1/2: {pase_1_2} (no debería)")
                print(f"     - Pase 2/2: {pase_2_2} (no debería)")
                return False
                
        elif level == 'ultimate':
            # Debe tener "Pase 1/2" y "Pase 2/2"
            pase_1_1 = any('Pase 1/1' in msg for msg in progress_messages)
            pase_1_2 = any('Pase 1/2' in msg for msg in progress_messages)
            pase_2_2 = any('Pase 2/2' in msg for msg in progress_messages)
            
            if not pase_1_1 and pase_1_2 and pase_2_2:
                print(f"  ✅ Correcto: Muestra 'Pase 1/2' y 'Pase 2/2'")
                return True
            else:
                print(f"  ❌ Error: Debería mostrar 'Pase 1/2' y 'Pase 2/2'")
                print(f"     - Pase 1/1: {pase_1_1} (no debería)")
                print(f"     - Pase 1/2: {pase_1_2}")
                print(f"     - Pase 2/2: {pase_2_2}")
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Ejecuta las pruebas de progreso"""
    print("🧪 Iniciando pruebas de mensajes de progreso...")
    
    # Probar modo Standard
    standard_ok = test_level_progress('standard')
    
    # Esperar entre pruebas
    time.sleep(2)
    
    # Probar modo Ultimate
    ultimate_ok = test_level_progress('ultimate')
    
    # Resumen
    print(f"\n{'='*60}")
    print("📋 RESUMEN DE PRUEBAS DE PROGRESO")
    print('='*60)
    print(f"  Modo Standard (solo Pase 1/1): {'✅ PASÓ' if standard_ok else '❌ FALLÓ'}")
    print(f"  Modo Ultimate (Pase 1/2 y 2/2): {'✅ PASÓ' if ultimate_ok else '❌ FALLÓ'}")
    
    if standard_ok and ultimate_ok:
        print("\n✅ ¡Todas las pruebas de progreso pasaron!")
        return 0
    else:
        print("\n❌ Algunas pruebas de progreso fallaron.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
