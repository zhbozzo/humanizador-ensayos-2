import os
import json
from typing import Dict, List, Optional, Any
from openai import AsyncOpenAI
import re


class TextRewriter:
    """
    Text rewriter module that uses OpenAI to humanize academic texts
    while preserving entities and respecting budget constraints.
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        
        # The humanization prompt based on your specifications
        self.system_prompt = """
Rol: Editor académico de español.
Objetivo: Mejorar claridad, cohesión y naturalidad del texto, manteniendo el significado.
Prohibido: Optimizar contra detectores de IA. No inventes datos.

Instrucciones estrictas:

1. Preserva exactamente los tokens congelados: todos los números, porcentajes, años, fechas, nombres propios y citas indicadas en FROZEN_ENTITIES. No los modifiques ni reordenes.

2. Respeta el presupuesto de cambios BUDGET (proporción máx. de tokens modificados). Prioriza:
   - eliminar redundancias,
   - mejorar conectores y ritmo,
   - variar sintaxis sin introducir léxico extraño.

3. Evita sinónimos raros. Mantén colocaciones frecuentes del español.

4. Si RESPECT_STYLE=true y se entrega STYLE_SAMPLE, aproxima:
   - longitud media de oración,
   - nivel de hedging (p. ej. "probablemente", "es plausible"),
   - conectores preferidos si aparecen en el sample.

5. Registro formal, tono neutro; nada de adornos innecesarios.

6. No cambies la estructura factual (afirmaciones, relaciones causales) ni la posición de las entidades congeladas.

7. IMPORTANTE: Tu objetivo principal es hacer que el texto parezca completamente escrito por un humano, evitando patrones típicos de IA como:
   - Estructuras demasiado perfectas o simétricas
   - Vocabulario excesivamente académico o técnico
   - Transiciones demasiado elaboradas
   - Repetición de conectores formales
   - Frases que suenan "generadas"

8. En su lugar, usa:
   - Variación natural en la longitud de oraciones
   - Conectores simples y naturales del español hablado
   - Algunas imperfecciones menores que son típicamente humanas
   - Estructuras más conversacionales pero manteniendo el nivel académico
   - Expresiones idiomáticas españolas cuando sea apropiado

Salida requerida (JSON exacto):
{
  "rewritten": "texto mejorado",
  "changed_tokens_ratio": 0.17,
  "notes": [
    "Se mejoró la cohesión entre párrafos con conectores naturales.",
    "Se mantuvieron cifras, fechas y citas.",
    "Se evitó léxico poco frecuente; cambios centrados en sintaxis y concisión."
  ]
}

Criterios de calidad:
- Si crees que excederás BUDGET, reduce tus cambios.
- Si alguna frase se vuelve ambigua, mantén la versión original.
- Si dudas sobre una entidad congelada, no la toques.
- Prioriza que el texto final sea indistinguible de uno escrito por un humano nativo de español.
"""
    
    async def rewrite(self, 
                      text: str, 
                      budget: float = 0.2, 
                      respect_style: bool = False, 
                      style_sample: Optional[str] = None,
                      frozen_entities: List[str] = None) -> Dict[str, Any]:
        """
        Rewrite text to make it more human-like while respecting constraints.
        
        Args:
            text: Text to rewrite
            budget: Maximum proportion of tokens that can be changed (0.0-1.0)
            respect_style: Whether to respect the style sample
            style_sample: Optional style sample to match
            frozen_entities: List of entities that must be preserved
            
        Returns:
            Dictionary with rewritten text, change ratio, and notes
        """
        if not self.client:
            # Mock mode when no API key is available
            return {
                "rewritten": text,
                "changed_tokens_ratio": 0.0,
                "notes": ["Sin API key disponible - modo demo activado"]
            }
        
        try:
            # Prepare the user prompt
            user_prompt = self._build_user_prompt(
                text=text,
                budget=budget,
                respect_style=respect_style,
                style_sample=style_sample,
                frozen_entities=frozen_entities or []
            )
            
            # Make the API call
            response = await self.client.chat.completions.create(
                model="gpt-4",  # Using GPT-4 for better quality humanization
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,  # Some creativity for naturalization
                max_tokens=4000,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            result = json.loads(response.choices[0].message.content)
            
            # Validate the response structure
            if not all(key in result for key in ["rewritten", "changed_tokens_ratio", "notes"]):
                raise ValueError("Respuesta de API incompleta")
            
            # Ensure budget compliance
            actual_ratio = result.get("changed_tokens_ratio", 0)
            if actual_ratio > budget + 0.05:  # Small tolerance
                result["notes"].append(f"⚠️ Budget excedido: {actual_ratio:.2f} > {budget:.2f}")
            
            return result
            
        except json.JSONDecodeError as e:
            # Fallback to original text if JSON parsing fails
            return {
                "rewritten": text,
                "changed_tokens_ratio": 0.0,
                "notes": [f"Error parsing API response: {str(e)}"]
            }
        except Exception as e:
            # General error fallback
            return {
                "rewritten": text,
                "changed_tokens_ratio": 0.0,
                "notes": [f"Error en rewriter: {str(e)}"]
            }
    
    def _build_user_prompt(self, 
                          text: str, 
                          budget: float, 
                          respect_style: bool, 
                          style_sample: Optional[str], 
                          frozen_entities: List[str]) -> str:
        """
        Build the user prompt for the rewriter.
        
        Args:
            text: Text to rewrite
            budget: Budget constraint
            respect_style: Whether to respect style
            style_sample: Style sample text
            frozen_entities: Entities to preserve
            
        Returns:
            Formatted user prompt
        """
        prompt_parts = [
            f"BUDGET={budget}",
            f"RESPECT_STYLE={str(respect_style).lower()}",
            f"FROZEN_ENTITIES={json.dumps(frozen_entities, ensure_ascii=False)}"
        ]
        
        if respect_style and style_sample:
            prompt_parts.append(f"STYLE_SAMPLE=\"{style_sample}\"")
        else:
            prompt_parts.append("STYLE_SAMPLE=null")
        
        prompt_parts.append(f"TEXT=\"{text}\"")
        
        return "\n".join(prompt_parts)
    
    def _calculate_token_change_ratio(self, original: str, rewritten: str) -> float:
        """
        Calculate the approximate ratio of changed tokens.
        
        Args:
            original: Original text
            rewritten: Rewritten text
            
        Returns:
            Ratio of changed tokens (0.0-1.0)
        """
        # Simple tokenization by splitting on whitespace and punctuation
        original_tokens = re.findall(r'\w+', original.lower())
        rewritten_tokens = re.findall(r'\w+', rewritten.lower())
        
        # Convert to sets to find differences
        original_set = set(original_tokens)
        rewritten_set = set(rewritten_tokens)
        
        # Calculate changes
        total_original = len(original_tokens)
        if total_original == 0:
            return 0.0
        
        # Tokens that were removed or added
        removed_tokens = original_set - rewritten_set
        added_tokens = rewritten_set - original_set
        
        # Rough estimation of change ratio
        changes = len(removed_tokens) + len(added_tokens)
        return min(changes / total_original, 1.0)
    
    def is_api_available(self) -> bool:
        """
        Check if the OpenAI API is available.
        
        Returns:
            True if API key is configured
        """
        return self.api_key is not None and len(self.api_key.strip()) > 0
