#!/usr/bin/env python3
"""
Script de prueba para verificar el sistema de humanización con:
1. Nuevo prompt mejorado anti-detección
2. Detector de IA interno
3. Sistema de progreso con barra visual
"""

import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from modules.entity_extractor import EntityExtractor
from modules.text_rewriter import TextRewriter
from modules.metrics_calculator import MetricsCalculator
from modules.ai_detector import AIDetector

# Texto de prueba con elementos académicos
TEST_TEXT = """
En el contexto actual de la educación superior, se observa que el 85% de los estudiantes 
universitarios utilizan herramientas digitales para el aprendizaje (García et al., 2023). 
Además, estudios recientes indican que la implementación de metodologías activas mejora 
significativamente el rendimiento académico. Por consiguiente, es fundamental considerar 
la integración de estas tecnologías en el diseño curricular. Sin embargo, es importante 
destacar que no todas las instituciones cuentan con los recursos necesarios para 
implementar estos cambios de manera efectiva. En conclusión, se requiere un enfoque 
integral que considere tanto los aspectos tecnológicos como los pedagógicos para 
lograr una transformación educativa exitosa.
"""

async def test_humanization_and_detection():
    """Prueba el sistema completo de humanización y detección"""
    
    print("=" * 80)
    print("PRUEBA DEL SISTEMA DE HUMANIZACIÓN MEJORADO")
    print("=" * 80)
    
    # Inicializar módulos
    entity_extractor = EntityExtractor()
    text_rewriter = TextRewriter()
    metrics_calculator = MetricsCalculator()
    ai_detector = AIDetector()
    
    print("\n1. TEXTO ORIGINAL:")
    print("-" * 40)
    print(TEST_TEXT)
    
    # Detectar IA en texto original
    print("\n2. DETECCIÓN DE IA EN TEXTO ORIGINAL:")
    print("-" * 40)
    original_detection = ai_detector.detect(TEST_TEXT, 'es')
    print(f"🤖 Probabilidad de IA: {original_detection['ai_probability']}%")
    print(f"👤 Probabilidad humana: {original_detection['human_score']}%")
    print(f"📊 Clasificación: {original_detection['classification']}")
    
    # Imprimir métricas clave
    print("\nMétricas detectadas:")
    for key, value in original_detection['metrics'].items():
        if isinstance(value, float):
            print(f"  • {key}: {value:.2f}")
    
    # Extraer y congelar entidades
    print("\n3. EXTRACCIÓN DE ENTIDADES:")
    print("-" * 40)
    frozen_entities, processed_text = entity_extractor.extract_and_freeze(TEST_TEXT)
    print(f"✅ {len(frozen_entities)} entidades preservadas:")
    for entity in frozen_entities[:5]:  # Mostrar solo las primeras 5
        print(f"  • {entity['text']} ({entity['type']})")
    
    # Humanizar texto
    print("\n4. HUMANIZANDO TEXTO...")
    print("-" * 40)
    
    # Callback de progreso simple
    async def on_progress(event: str, i: int, total: int):
        if event == "chunk_start":
            print(f"  ⏳ Procesando parte {i}/{total}...")
        elif event == "chunk_done":
            print(f"  ✅ Parte {i}/{total} completada")
    
    rewrite_result = await text_rewriter.rewrite(
        text=processed_text,
        budget=0.5,
        preserve_entities=True,
        frozen_entities=frozen_entities,
        progress_callback=on_progress
    )
    
    # Restaurar entidades
    humanized_text = entity_extractor.restore_entities(rewrite_result["rewritten"])
    
    print("\n5. TEXTO HUMANIZADO:")
    print("-" * 40)
    print(humanized_text)
    
    # Detectar IA en texto humanizado
    print("\n6. DETECCIÓN DE IA EN TEXTO HUMANIZADO:")
    print("-" * 40)
    humanized_detection = ai_detector.detect(humanized_text, 'es')
    print(f"🤖 Probabilidad de IA: {humanized_detection['ai_probability']}%")
    print(f"👤 Probabilidad humana: {humanized_detection['human_score']}%")
    print(f"📊 Clasificación: {humanized_detection['classification']}")
    
    # Comparación de métricas
    print("\n7. COMPARACIÓN DE MÉTRICAS:")
    print("-" * 40)
    print("Métrica                  | Original | Humanizado | Mejora")
    print("-" * 60)
    
    for key in original_detection['metrics'].keys():
        orig_val = original_detection['metrics'].get(key, 0)
        human_val = humanized_detection['metrics'].get(key, 0)
        if isinstance(orig_val, (int, float)):
            diff = human_val - orig_val
            sign = "+" if diff > 0 else ""
            print(f"{key:23} | {orig_val:8.2f} | {human_val:10.2f} | {sign}{diff:.2f}")
    
    # Calcular métricas de calidad
    print("\n8. MÉTRICAS DE CALIDAD:")
    print("-" * 40)
    quality_metrics = metrics_calculator.calculate(TEST_TEXT, humanized_text)
    print(f"📈 Ratio de cambio: {quality_metrics['change_ratio']:.2%}")
    print(f"📖 Palabras raras: {quality_metrics['rare_words_ratio']:.2%}")
    print(f"📏 Longitud promedio de oraciones: {quality_metrics['avg_sentence_len']:.1f} palabras")
    print(f"📊 Índice LIX: {quality_metrics['lix']:.1f}")
    
    # Resultado final
    print("\n" + "=" * 80)
    print("RESULTADO FINAL:")
    print("=" * 80)
    
    improvement = original_detection['ai_probability'] - humanized_detection['ai_probability']
    
    if humanized_detection['ai_probability'] < 20:
        print("✅ ¡ÉXITO TOTAL! El texto humanizado es prácticamente indetectable.")
    elif humanized_detection['ai_probability'] < 40:
        print("✅ ¡MUY BIEN! El texto humanizado pasa como mayormente humano.")
    elif humanized_detection['ai_probability'] < 60:
        print("⚠️ MEJORABLE. El texto aún tiene características detectables de IA.")
    else:
        print("❌ NECESITA MEJORAS. El texto sigue siendo detectado como IA.")
    
    print(f"\n🎯 Mejora lograda: {improvement:.1f}% menos detectable como IA")
    
    # Verificar entidades preservadas
    print("\n9. VERIFICACIÓN DE ENTIDADES:")
    print("-" * 40)
    try:
        entity_extractor.verify_entities_preserved(TEST_TEXT, humanized_text, frozen_entities)
        print("✅ Todas las entidades fueron preservadas correctamente")
    except Exception as e:
        print(f"❌ Error en preservación de entidades: {e}")

if __name__ == "__main__":
    print("\n🚀 Iniciando prueba del sistema de humanización...")
    print("Este script probará:")
    print("  1. El nuevo prompt mejorado anti-detección")
    print("  2. El detector de IA interno")
    print("  3. La preservación de entidades")
    print("  4. Las métricas de calidad\n")
    
    try:
        asyncio.run(test_humanization_and_detection())
        print("\n✅ Prueba completada exitosamente")
    except Exception as e:
        print(f"\n❌ Error durante la prueba: {e}")
        import traceback
        traceback.print_exc()