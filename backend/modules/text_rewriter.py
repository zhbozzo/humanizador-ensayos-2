import os
import json
from typing import Dict, List, Optional, Any, Callable, Awaitable
from openai import AsyncOpenAI
import re
import random
import asyncio


class TextRewriter:
    """
    Text rewriter module that uses OpenAI to humanize academic texts
    while preserving entities and respecting budget constraints.
    """
    
    def __init__(self):
        """Inicializa el cliente LLM priorizando Qwen (DashScope) con compatibilidad OpenAI."""
        print("[TextRewriter] Inicializando...")

        # Prioridad: Qwen (DashScope) → DeepSeek → OpenAI → demo
        self.api_key = os.getenv("DASHSCOPE_API_KEY")
        if self.api_key:
            self.client = AsyncOpenAI(
                api_key=self.api_key,
                base_url="https://dashscope.aliyun.com/compatible-mode/v1"
            )
            print("[API] Usando Qwen (DashScope) compatible OpenAI")
        else:
            # DeepSeek
            self.api_key = os.getenv("DEEPSEEK_API_KEY")
            if self.api_key:
                self.client = AsyncOpenAI(
                    api_key=self.api_key,
                    base_url="https://api.deepseek.com"
                )
                print("[API] Usando DeepSeek API")
            else:
                # OpenAI
                self.api_key = os.getenv("OPENAI_API_KEY")
                if self.api_key:
                    self.client = AsyncOpenAI(api_key=self.api_key)
                    print("[API] Usando OpenAI API")
                else:
                    self.client = None
                    print("[API] No hay API key válida - modo demo activado")
        
        
        # Prompt cognitivo (CEREZOS v2.1) más cercano a firma humana real
        self.system_prompt = """CEREZOS: REESCRITOR CON ESTILO DE PENSAMIENTO REAL (v2.1, anti-GPTZero v7+)

Tú no "reescribes" — piensas de nuevo. Reelabora el TEXTO como un escritor con trayectoria, ideas en desarrollo y voz no uniforme.

PREMISAS NEUROCOGNITIVAS
- Evidencia hesitación controlada, digresión reflexiva breve y variación atencional (ideas principales vs notas marginales).
- El ritmo sigue la atención: mezcla frases muy breves con otras desdobladas.
- Evita lo "perfecto"; pequeños desequilibrios de registro son aceptables si el razonamiento es sólido.
- No uses sinónimos por variedad: cámbialos sólo cuando abran un concepto paralelo o una implicación útil.
- No declares el mapa del ensayo; estructura por revelación conceptual.

OBJETIVO
Transmitir una voz humana genuina y razonamiento propio sin inventar datos.

FORMATO DE SALIDA (JSON)
{
  "rewritten": "TEXTO FINAL (mismo idioma del original; sin traducir)",
  "changed_tokens_ratio": float
}

REGLAS
• Preserva FROZEN_ENTITIES, números y citas tal como están.
• Si VOICE=collective, evita "tú" y usa marcadores colectivos cuando aporten.
• No enmascares comillas ni puntuación natural.
• Evita conectores formulaicos y sobrecohesión.
"""

        # Modo por defecto: humanización neurosemántica activa
        self._definitive_mode = True

    def enable_definitive_human_mode(self, enable: bool = True):
        self._definitive_mode = enable
        if enable:
            print("[🧠] Activando modo CEREZOS: humanización neurosemántica")

    
    def _clamp_max_tokens(self, requested: Optional[int]) -> int:
        """Limita max_tokens al rango permitido por deepseek-chat [1, 8192]."""
        limit = 8192
        if requested is None:
            requested = 1024
        try:
            requested = int(requested)
        except Exception:
            requested = 1024
        if requested < 1:
            requested = 1
        if requested > limit:
            requested = limit
        return requested

    def _extract_rewritten_from_partial(self, raw: str) -> str:
        """Extrae el valor (posiblemente incompleto) del campo JSON "rewritten" para streaming.
        Devuelve cadena ya des-escapada en lo posible.
        """
        try:
            key = '"rewritten"'
            idx = raw.find(key)
            if idx == -1:
                return ""
            colon = raw.find(":", idx)
            if colon == -1:
                return ""
            startq = raw.find('"', colon + 1)
            if startq == -1:
                return ""
            # Leer hasta la comilla de cierre no escapada (o fin si aún no llega)
            s = []
            escaped = False
            i = startq + 1
            while i < len(raw):
                ch = raw[i]
                if escaped:
                    if ch == 'n':
                        s.append("\n")
                    elif ch == 't':
                        s.append("\t")
                    elif ch == '"':
                        s.append('"')
                    elif ch == '\\':
                        s.append('\\')
                    else:
                        s.append(ch)
                    escaped = False
                else:
                    if ch == '\\':
                        escaped = True
                    elif ch == '"':
                        break
                    else:
                        s.append(ch)
                i += 1
            return "".join(s)
        except Exception:
            return ""
    
    def _clamp_max_tokens(self, requested: Optional[int]) -> int:
        """Limita max_tokens al rango permitido por deepseek-chat [1, 8192]."""
        limit = 8192
        if requested is None:
            requested = 1024
        try:
            requested = int(requested)
        except Exception:
            requested = 1024
        if requested < 1:
            requested = 1
        if requested > limit:
            requested = limit
        return requested
    
    async def rewrite(self, 
                      text: str, 
                      budget: float = 0.2, 
                      respect_style: bool = False, 
                      style_sample: Optional[str] = None,
                      frozen_entities: List[str] = None,
                      voice: Optional[str] = None,
                      progress_callback: Optional[Callable[[str, int, int], Awaitable[None]]] = None,
                      detector_feedback: Optional[Dict[str, float]] = None,
                      token_callback: Optional[Callable[[int, int], Awaitable[None]]] = None) -> Dict[str, Any]:
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
            # Modo heurístico local (sin API) para evitar 0% cambios
            rewritten = await self._heuristic_humanize(
                text=text,
                budget=budget,
                frozen_entities=frozen_entities or [],
                progress_callback=progress_callback,
                voice=voice
            )
            return rewritten
        
        try:
            # Si el texto es muy largo, procesarlo por párrafos
            # DeepSeek Reasoner soporta hasta 128K tokens de contexto
            MAX_CHARS = 8000  # Aumentado para aprovechar el contexto de 128K
            
            # Aplicar mínimo global de cambio
            min_change_ratio = 0.55
            effective_budget = max(budget, min_change_ratio)
            
            if len(text) > MAX_CHARS:
                print(f"[DeepSeek] Texto largo detectado ({len(text)} chars), procesando por partes...")
                
                # Dividir por párrafos
                paragraphs = text.split('\n\n')
                if len(paragraphs) == 1:
                    # Si no hay párrafos, dividir por puntos
                    sentences = text.split('. ')
                    # Reagrupar en chunks de tamaño apropiado
                    chunks = []
                    current_chunk = ""
                    for sentence in sentences:
                        if len(current_chunk) + len(sentence) < MAX_CHARS:
                            current_chunk += sentence + ". "
                        else:
                            if current_chunk:
                                chunks.append(current_chunk.strip())
                            current_chunk = sentence + ". "
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                else:
                    chunks = paragraphs
                
                # Procesar cada chunk
                rewritten_chunks = []
                total_changes = 0
                total_tokens = 0
                
                for i, chunk in enumerate(chunks):
                    if not chunk.strip():
                        continue
                    
                    if progress_callback:
                        await progress_callback("chunk_start", i + 1, len(chunks))
                    
                    print(f"[DeepSeek] Procesando parte {i+1}/{len(chunks)}...")
                    
                    chunk_prompt = self._build_user_prompt(
                        text=chunk,
                        budget=effective_budget,
                        respect_style=respect_style,
                        style_sample=style_sample,
                        frozen_entities=frozen_entities or [],
                        voice=voice,
                        detector_feedback=detector_feedback
                    )
                    
                    # Usar exclusivamente deepseek-chat
                    response = await self.client.chat.completions.create(
                        model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
                        messages=[
                            {"role": "system", "content": self.system_prompt},
                            {"role": "user", "content": chunk_prompt},
                        ],
                        temperature=0.7,
                        max_tokens=self._clamp_max_tokens(2000),
                    )
                    
                    try:
                        chunk_result = json.loads(response.choices[0].message.content)
                        rewritten_chunks.append(chunk_result.get("rewritten", chunk))
                        
                        # Acumular métricas
                        chunk_tokens = len(chunk.split())
                        chunk_changes = chunk_result.get("changed_tokens_ratio", 0) * chunk_tokens
                        total_tokens += chunk_tokens
                        total_changes += chunk_changes
                        
                    except (json.JSONDecodeError, KeyError):
                        print(f"[DeepSeek] Error en chunk {i+1}, usando texto original")
                        rewritten_chunks.append(chunk)
                    
                    if progress_callback:
                        await progress_callback("chunk_done", i + 1, len(chunks))
                
                # Combinar resultados
                final_text = "\n\n".join(rewritten_chunks) if paragraphs else " ".join(rewritten_chunks)
                final_ratio = total_changes / total_tokens if total_tokens > 0 else 0
                
                # Refuerzo: garantizar mínimo
                if final_ratio < min_change_ratio:
                    # Segundo intento con flag de fuerza (procesar cada chunk)
                    chunks2 = []
                    for chunk in chunks:
                        chunk_prompt = self._build_user_prompt(
                            text=chunk,
                            budget=max(effective_budget, 0.6),
                            respect_style=respect_style,
                            style_sample=style_sample,
                            frozen_entities=frozen_entities or [],
                            voice=voice,
                            detector_feedback=detector_feedback,
                            force_min_change=True,
                            min_change_ratio=min_change_ratio
                        )
                        response = await self.client.chat.completions.create(
                            model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
                            messages=[
                                {"role": "system", "content": self.system_prompt},
                                {"role": "user", "content": chunk_prompt}
                            ],
                            temperature=0.75,
                            max_tokens=self._clamp_max_tokens(8192)
                        )
                        raw2 = response.choices[0].message.content
                        try:
                            jr = json.loads(raw2)
                            chunks2.append(jr.get("rewritten", chunk))
                        except Exception:
                            chunks2.append(chunk)
                    final_text = ("\n\n".join(chunks2) if paragraphs else " ".join(chunks2)).strip()
                    final_ratio = self._calculate_token_change_ratio(text, final_text)
                
                return {
                    "rewritten": final_text,
                    "changed_tokens_ratio": final_ratio,
                    "notes": [
                        f"Texto largo procesado en {len(chunks)} partes",
                        "Cada sección humanizada independientemente",
                        "Coherencia mantenida entre secciones"
                    ]
                }
            
            # Para textos cortos, procesar normalmente
            user_prompt = self._build_user_prompt(
                text=text,
                frozen_entities=frozen_entities or [],
                voice=voice,
                include_titles=self._definitive_mode and True
            )
            
            if progress_callback:
                await progress_callback("chunk_start", 1, 1)
            
            # Llamada al modelo (con streaming real si hay token_callback)
            print("[DeepSeek] Enviando texto para edición...")
            use_streaming = token_callback is not None
            raw = ""
            if use_streaming:
                try:
                    # Modelo: prioriza Qwen si hay DASHSCOPE_API_KEY
                    dash_model = os.getenv("QWEN_MODEL", "qwen-plus")
                    deepseek_model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
                    model_name = dash_model if os.getenv("DASHSCOPE_API_KEY") else deepseek_model
                    stream = await self.client.chat.completions.create(
                        model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
                        messages=[
                            {"role": "system", "content": self.system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=0.7,
                        max_tokens=self._clamp_max_tokens(8192),
                        stream=True
                    )
                    # Timeout suave de 25s para no quedar colgados
                    async def _consume():
                        nonlocal raw
                        async for event in stream:
                            try:
                                choice = event.choices[0]
                                delta = getattr(choice, "delta", None)
                                content = getattr(delta, "content", None) if delta is not None else None
                                if content:
                                    raw += content
                                    partial_preview = self._extract_rewritten_from_partial(raw)
                                    if token_callback and partial_preview:
                                        await token_callback(
                                            len(partial_preview.split()),
                                            max(80, int(len(text.split()) * 1.4)),
                                            partial_preview
                                        )
                            except Exception:
                                pass
                    try:
                        await asyncio.wait_for(_consume(), timeout=25)
                    except asyncio.TimeoutError:
                        pass
                except Exception:
                    raw = ""
            if not raw:
                dash_model = os.getenv("QWEN_MODEL", "qwen-plus")
                deepseek_model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
                model_name = dash_model if os.getenv("DASHSCOPE_API_KEY") else deepseek_model
                response = await self.client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=self._clamp_max_tokens(8192)
                )
                raw = response.choices[0].message.content
            print("[DeepSeek] Respuesta recibida, procesando...")
            
            if progress_callback:
                await progress_callback("chunk_done", 1, 1)
            
            # Parse robusto de JSON (extrae primer objeto JSON válido)
            raw = raw
            try:
                result = json.loads(raw)
            except json.JSONDecodeError:
                import re as _re
                match = _re.search(r"\{[\s\S]*\}", raw)
                if not match:
                    # Intentar extraer solo el campo rewritten del stream
                    recovered = self._extract_rewritten_from_partial(raw)
                    if recovered:
                        return {
                            "rewritten": recovered,
                            "changed_tokens_ratio": self._calculate_token_change_ratio(text, recovered),
                            "notes": ["json_stream_recovered"]
                        }
                    # Si no llegó JSON válido, usar heurístico
                    return await self._heuristic_humanize(
                        text=text,
                        budget=budget,
                        frozen_entities=frozen_entities or [],
                        progress_callback=progress_callback,
                        voice=voice
                    )
                # Intentar parsear el bloque JSON encontrado; si falla, recuperar 'rewritten'
                try:
                    result = json.loads(match.group(0))
                except Exception:
                    recovered = self._extract_rewritten_from_partial(match.group(0)) or self._extract_rewritten_from_partial(raw)
                    if recovered:
                        result = {
                            "rewritten": recovered,
                            "changed_tokens_ratio": self._calculate_token_change_ratio(text, recovered),
                            "notes": ["json_block_recovered"]
                        }
                    else:
                        return await self._heuristic_humanize(
                            text=text,
                            budget=budget,
                            frozen_entities=frozen_entities or [],
                            progress_callback=progress_callback,
                            voice=voice
                        )
            
            # Validate the response structure
            if not all(key in result for key in ["rewritten", "changed_tokens_ratio", "notes"]):
                # Si la API no cumplió el contrato, forzamos cálculo mínimo
                rewritten_fallback = result.get("rewritten") if isinstance(result, dict) else text
                result = {
                    "rewritten": rewritten_fallback or text,
                    "changed_tokens_ratio": self._calculate_token_change_ratio(text, rewritten_fallback or text),
                    "notes": ["estructura_incompleta: calculado localmente"]
                }
            
            # Ensure budget compliance y estimación si falta
            actual_ratio = result.get("changed_tokens_ratio")
            if actual_ratio is None:
                actual_ratio = self._calculate_token_change_ratio(text, result.get("rewritten", text))
                result["changed_tokens_ratio"] = actual_ratio
            
            # Refuerzo de longitudes: si hay pocas oraciones largas, solicitar ajuste
            def _long_sentence_ratio(t: str) -> float:
                sents = [s.strip() for s in re.split(r'(?<=[\.!?])\s+', t) if s.strip()]
                if not sents:
                    return 0.0
                long_count = sum(1 for s in sents if len(s.split()) >= 28)
                return long_count / max(1, len(sents))
            
            long_ratio = _long_sentence_ratio(result.get("rewritten", text))
            if long_ratio < 0.5:
                reinforce_prompt = (
                    self._build_user_prompt(
                        text=result.get("rewritten", text),
                        budget=max(effective_budget, 0.65),
                        respect_style=respect_style,
                        style_sample=style_sample,
                        frozen_entities=frozen_entities or [],
                        voice=voice,
                        detector_feedback=detector_feedback,
                        force_min_change=False,
                        min_change_ratio=min_change_ratio
                    )
                    + "\n" +
                    "ENFASIS_LONG_SENTENCES=TRUE\nHARD_REQUIREMENTS: Al menos 50% de oraciones entre 28–70 palabras y 2 oraciones ≥65 palabras si el tema lo permite; mantiene la coherencia."
                )
                response_r = await self.client.chat.completions.create(
                    model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
                    messages=[
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": reinforce_prompt}
                    ],
                    temperature=0.65,
                    max_tokens=self._clamp_max_tokens(8192)
                )
                try:
                    result_r = json.loads(response_r.choices[0].message.content)
                    cand = result_r.get("rewritten", result.get("rewritten", text))
                    if _long_sentence_ratio(cand) >= long_ratio:
                        result = result_r
                        result["notes"] = list(set(result.get("notes", []) + ["refuerzo_longitudes"]))
                except Exception:
                    pass
            # Forzar cambios mínimos si el modelo devolvió casi sin modificar
            if (result.get("rewritten", text)).strip() == text.strip() or actual_ratio < min_change_ratio:
                # Segundo intento con "force"
                force_prompt = self._build_user_prompt(
                    text=text,
                    budget=max(effective_budget, 0.6),
                    respect_style=respect_style,
                    style_sample=style_sample,
                    frozen_entities=frozen_entities or [],
                    detector_feedback=detector_feedback,
                    force_min_change=True,
                    min_change_ratio=min_change_ratio
                )
                response2 = await self.client.chat.completions.create(
                    model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
                    messages=[{"role": "system", "content": self.system_prompt}, {"role": "user", "content": force_prompt}],
                    temperature=0.75,
                    max_tokens=self._clamp_max_tokens(8192)
                )
                raw2 = response2.choices[0].message.content
                try:
                    result2 = json.loads(raw2)
                except Exception:
                    result2 = {"rewritten": result.get("rewritten", text)}
                result2_ratio = self._calculate_token_change_ratio(text, result2.get("rewritten", text))
                if result2_ratio >= min_change_ratio:
                    return {
                        "rewritten": result2.get("rewritten", text),
                        "changed_tokens_ratio": result2_ratio,
                        "notes": result.get("notes", []) + ["force_min_change_aplicado"]
                    }
                heuristic = await self._heuristic_humanize(
                    text=text,
                    budget=effective_budget,
                    frozen_entities=frozen_entities or [],
                    progress_callback=progress_callback,
                    voice=voice
                )
                return heuristic
            # Nota informativa si ratio bajo (para trazas)
            if actual_ratio < min_change_ratio:
                result["notes"].append(f"ratio_bajo_detectado:{actual_ratio:.2f}<min:{min_change_ratio:.2f}")
            if actual_ratio > budget + 0.05:  # Small tolerance
                result["notes"].append(f"⚠️ Budget excedido: {actual_ratio:.2f} > {budget:.2f}")
            
            return result
            
        except asyncio.TimeoutError:
            print("Timeout error: La respuesta tardó más de 60 segundos")
            return await self._heuristic_humanize(
                text=text,
                budget=budget,
                frozen_entities=frozen_entities or [],
                progress_callback=progress_callback,
                voice=voice
            )
        except json.JSONDecodeError as e:
            # Fallback to original text if JSON parsing fails
            print(f"JSON Decode Error: {str(e)}")
            return await self._heuristic_humanize(
                text=text,
                budget=budget,
                frozen_entities=frozen_entities or [],
                progress_callback=progress_callback,
                voice=voice
            )
        except Exception as e:
            # General error fallback
            import traceback
            error_detail = f"Error: {type(e).__name__}: {str(e)}"
            print(f"\n=== Error en DeepSeek Rewriter ===")
            print(f"Error: {error_detail}")
            print(f"Traceback:\n{traceback.format_exc()}")
            print("==================================\n")
            return await self._heuristic_humanize(
                text=text,
                budget=budget,
                frozen_entities=frozen_entities or [],
                progress_callback=progress_callback,
                voice=voice
            )

    async def _heuristic_humanize(self,
                                  text: str,
                                  budget: float,
                                  frozen_entities: List[str],
                                  progress_callback: Optional[Callable[[str, int, int], Awaitable[None]]] = None,
                                  voice: Optional[str] = None) -> Dict[str, Any]:
        """Humanización heurística local para cuando no hay API.
        Aplica variación de longitudes, conectores menos típicos de IA y sinónimos controlados.
        """
        sentences = re.split(r'(?<=[\.!?])\s+', text.strip())
        sentences = [s.strip() for s in sentences if s.strip()]
        if not sentences:
            return {"rewritten": text, "changed_tokens_ratio": 0.0, "notes": ["texto vacío"]}

        # Conectores humanos
        human_connectors = [
            "Ahora bien,", "Con todo,", "Dicho esto,", "En cualquier caso,", "A propósito,",
            "De hecho,", "En última instancia,", "Con esto en mente,", "A fin de cuentas,"
        ]
        # Mapas de sinónimos básicos
        synonym_map = {
            "importante": ["crucial", "trascendental", "capital"],
            "entender": ["comprender", "asimilar", "captar"],
            "resultado": ["desenlace", "derivación", "consecuencia"],
            "cambio": ["variación", "mutación", "viraje", "alteración"],
            "necesario": ["preciso", "indispensable", "imperativo"],
            "clave": ["medular", "cardinal", "decisiva"],
        }

        # Simular progreso en 10 pasos
        total_steps = 10
        if progress_callback:
            await progress_callback("chunk_start", 1, 10)

        # Variación de longitudes: favorecer combinaciones para crear oraciones largas
        rewritten_sentences: List[str] = []
        i = 0
        while i < len(sentences):
            s = sentences[i]
            # Reemplazos léxicos ligeros
            for k, vs in synonym_map.items():
                s = re.sub(rf"\b{k}\b", random.choice(vs), s, flags=re.IGNORECASE) if random.random() < 0.35 else s

            # Insertar conector humano en ~30% de casos, evitando al inicio total
            if rewritten_sentences and random.random() < 0.3:
                s = random.choice(human_connectors) + " " + s

            # Decidir combinar con la siguiente para crear una oración larga (probabilidad alta)
            if i + 1 < len(sentences) and random.random() < 0.6:
                s2 = sentences[i + 1]
                s2 = s2[0].lower() + s2[1:] if len(s2) > 1 else s2
                combined = s.rstrip(".") + ", " + s2
                rewritten_sentences.append(combined)
                i += 2
            else:
                # Evitar dividir salvo casos extremos: mantener largas
                if len(s.split()) > 48 and random.random() < 0.2:
                    cut = max(8, min(len(s) - 5, len(s)//2))
                    # buscar espacio cercano
                    left = s[:cut]
                    right = s[cut:]
                    sp = right.find(' ')
                    if sp != -1:
                        rewritten_sentences.append(left.strip() + ".")
                        rewritten_sentences.append(right[sp+1:].strip().capitalize())
                    else:
                        rewritten_sentences.append(s)
                else:
                    rewritten_sentences.append(s)
                i += 1

            # Progreso incremental
            if progress_callback:
                step_index = min(len(rewritten_sentences), total_steps)
                await progress_callback("chunk_done", step_index, total_steps)

        # Ajuste simple de voz colectiva si se solicita (solo heurístico)
        if voice == 'collective':
            rewritten_sentences = [
                s.replace('¿Sabes', '¿Se han detenido a pensar').replace('¿Has', '¿Han').replace('¿Te has', '¿Se han')
                for s in rewritten_sentences
            ]

        # Reinstaurar placeholders de entidades (no tocar __ENTITY_X__)
        rewritten_text = " ".join(rewritten_sentences)
        
        # Refuerzo: si el texto quedó con pocas oraciones largas, combina más
        words = rewritten_text.split()
        if len(words) > 80:
            # unir puntos aislados para formar oraciones más extensas (suave)
            rewritten_text = re.sub(r"\.\s+(?=[a-záéíóúñ])", ", ", rewritten_text)
        # Asegurar que no se alteran placeholders
        for ph in frozen_entities:
            # si por error se removió, reinsertar simple (mejorable)
            if ph not in rewritten_text and ph in text:
                rewritten_text = rewritten_text.replace(ph, ph)

        ratio = self._calculate_token_change_ratio(text, rewritten_text)
        # Limitar por budget
        max_ratio = min(0.95, max(0.05, budget + 0.15))
        if ratio > max_ratio:
            ratio = max_ratio
            return {
            "rewritten": rewritten_text,
            "changed_tokens_ratio": ratio,
            "notes": [
                "Heurístico local: conectores humanos y variación de longitudes",
                f"budget_objetivo≈{budget:.2f}",
            ]
            }
    
    def _build_user_prompt(self,
                           text: str,
                           *,
                           frozen_entities: List[str],
                           voice: Optional[str] = None,
                           include_titles: bool = False) -> str:
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
            f"FROZEN_ENTITIES={json.dumps(frozen_entities, ensure_ascii=False)}",
        ]
        if voice:
            prompt_parts.append(f"VOICE={voice}")
        if include_titles:
            prompt_parts.append("INCLUDE_TITLES=true  # conserva los títulos tal como están")
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
