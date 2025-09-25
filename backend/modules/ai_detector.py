"""
AI Detection Module - GPT-Zero Alternative
Detects AI-generated text using perplexity, burstiness, and pattern analysis
"""

import re
import math
import numpy as np
from typing import Dict, List, Tuple, Optional
import os
from collections import Counter
import statistics


class AIDetector:
    """
    Advanced AI text detector using multiple metrics similar to GPT-Zero.
    Analyzes perplexity, burstiness, sentence patterns, and vocabulary distribution.
    """
    
    def __init__(self):
        # Conectores típicos de IA (detectados por GPT-Zero)
        self.AI_CONNECTORS = {
            "además", "por lo tanto", "en conclusión", "sin embargo", 
            "no obstante", "por consiguiente", "en resumen", "asimismo", 
            "en consecuencia", "del mismo modo", "en este sentido",
            "es importante destacar", "cabe mencionar", "es necesario señalar",
            "en primer lugar", "en segundo lugar", "finalmente"
        }
        
        # Conectores humanos naturales
        self.HUMAN_CONNECTORS = {
            "bueno", "mira", "la verdad es que", "resulta que",
            "eso sí", "ahora", "lo que pasa es que", "total que",
            "al final", "o sea", "vamos que", "en fin",
            "por cierto", "a todo esto", "el caso es que", "claro"
        }
        
        # Common AI patterns and phrases to detect
        self.ai_patterns = {
            'transitional': [
                r'\bfurthermore\b', r'\bmoreover\b', r'\badditionally\b',
                r'\bhowever\b', r'\bnonetheless\b', r'\bnevertheless\b',
                r'\bin conclusion\b', r'\bto summarize\b', r'\bin summary\b'
            ],
            'hedging': [
                r'\bit is important to note\b', r'\bit should be noted\b',
                r'\bone could argue\b', r'\bit can be said\b',
                r'\bit is worth mentioning\b', r'\binterestingly\b'
            ],
            'formal': [
                r'\bfundamental\b', r'\bcrucial\b', r'\bsignificant\b',
                r'\bsubstantial\b', r'\bcomprehensive\b', r'\bextensive\b',
                r'\bdiverse\b', r'\bvarious\b', r'\bnumerous\b'
            ]
        }
        
        # Spanish AI patterns
        self.spanish_ai_patterns = {
            'transitional': [
                r'\bademás\b', r'\basimismo\b', r'\bpor otro lado\b',
                r'\bsin embargo\b', r'\bno obstante\b', r'\ben consecuencia\b',
                r'\ben resumen\b', r'\ben conclusión\b', r'\bpor lo tanto\b'
            ],
            'hedging': [
                r'\bes importante señalar\b', r'\bcabe mencionar\b',
                r'\bes necesario destacar\b', r'\bresulta relevante\b',
                r'\bconviene subrayar\b', r'\bes preciso indicar\b'
            ],
            'formal': [
                r'\bfundamental\b', r'\bcrucial\b', r'\bmediante\b',
                r'\bdiversos\b', r'\bmúltiples\b', r'\bsignificativo\b',
                r'\bsubstancial\b', r'\bamplio\b', r'\bextenso\b'
            ]
        }
        
        # Stopwords for different languages
        self.spanish_stopwords = {
            'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se',
            'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar',
            'tener', 'le', 'lo', 'todo', 'pero', 'más', 'hacer', 'o',
            'poder', 'decir', 'este', 'ir', 'otro', 'ese', 'si', 'me',
            'ya', 'ver', 'porque', 'dar', 'cuando', 'muy', 'sin', 'vez',
            'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo',
            'yo', 'también', 'hasta', 'año', 'dos', 'querer', 'entre'
        }
    
    def detect(self, text: str, language: str = 'es') -> Dict:
        """
        Main detection method that analyzes text for AI patterns.
        
        Args:
            text: Text to analyze
            language: Language code ('es' for Spanish, 'en' for English)
            
        Returns:
            Dictionary with detection results and metrics
        """
        if not text or len(text.strip()) < 50:
            return {
                'is_ai': False,
                'ai_probability': 0.0,
                'human_score': 100.0,
                'metrics': {},
                'analysis': 'Text too short for reliable analysis'
            }
        
        # Calculate all metrics
        metrics = {
            'perplexity': self._calculate_perplexity(text, language),
            'burstiness': self._calculate_burstiness(text),
            'sentence_variation': self._calculate_sentence_variation(text),
            'vocabulary_diversity': self._calculate_vocabulary_diversity(text, language),
            'pattern_score': self._calculate_pattern_score(text, language),
            'readability': self._calculate_readability(text),
            'repetition_score': self._calculate_repetition_score(text)
        }
        
        # Añadir métricas de conectores y cláusulas
        conn_metrics = self._connector_metrics(text)
        metrics['connector_variety'] = conn_metrics['connector_variety']
        metrics['connector_overuse'] = 100 - conn_metrics['connector_overuse']  # Invertido para que menor sea mejor
        metrics['clause_depth_variance'] = self._clause_depth_variance(text)
        
        # Calculate overall AI probability
        ai_probability = self._calculate_ai_probability(metrics)
        human_score = 100.0 - ai_probability
        
        # Determine if text is AI-generated
        is_ai = ai_probability > 50.0
        
        # Generate detailed analysis
        analysis = self._generate_analysis(metrics, ai_probability)
        
        return {
            'is_ai': is_ai,
            'ai_probability': round(ai_probability, 2),
            'human_score': round(human_score, 2),
            'metrics': metrics,
            'analysis': analysis,
            'classification': self._get_classification(human_score)
        }
    
    def _calculate_perplexity(self, text: str, language: str) -> float:
        """
        Calculate perplexity score based on word predictability.
        Higher perplexity = more human-like
        """
        words = re.findall(r'\b\w+\b', text.lower())
        if len(words) < 2:
            return 0.0
        
        # Calculate word frequency distribution
        word_freq = Counter(words)
        total_words = len(words)
        
        # Calculate entropy
        entropy = 0.0
        for count in word_freq.values():
            probability = count / total_words
            if probability > 0:
                entropy -= probability * math.log2(probability)
        
        # Normalize perplexity (higher is more human)
        # Human text typically has perplexity 50-100
        # AI text typically has perplexity 20-50
        perplexity = 2 ** entropy
        normalized = min(100, (perplexity / 100) * 100)
        
        return round(normalized, 2)
    
    def _calculate_burstiness(self, text: str) -> float:
        """
        Calculate burstiness (variation in sentence length).
        Higher burstiness = more human-like
        
        CRITICAL: AI tends to write sentences of similar lengths.
        Humans vary dramatically between very short and very long sentences.
        """
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if len(sentences) < 3:
            return 50.0
        
        # Calculate sentence lengths
        lengths = [len(s.split()) for s in sentences]
        
        # Analyze length patterns
        very_short = sum(1 for l in lengths if l <= 5)  # <= 5 palabras
        short = sum(1 for l in lengths if 6 <= l <= 10)
        medium = sum(1 for l in lengths if 11 <= l <= 20)
        long = sum(1 for l in lengths if 21 <= l <= 35)
        very_long = sum(1 for l in lengths if l > 35)
        
        # Check for repetitive patterns (AI signature)
        consecutive_similar = 0
        for i in range(1, len(lengths)):
            if abs(lengths[i] - lengths[i-1]) <= 3:  # Similar length
                consecutive_similar += 1
        
        # Calculate metrics
        mean_length = statistics.mean(lengths)
        if mean_length == 0:
            return 50.0
            
        std_dev = statistics.stdev(lengths) if len(lengths) > 1 else 0
        
        # Variance coefficient
        cv = (std_dev / mean_length) * 100 if mean_length > 0 else 0
        
        # Diversity score (presence of different lengths)
        diversity_score = 0
        if very_short > 0: diversity_score += 20
        if short > 0: diversity_score += 20
        if medium > 0: diversity_score += 20
        if long > 0: diversity_score += 20
        if very_long > 0: diversity_score += 20
        
        # Penalty for consecutive similar lengths (AI pattern)
        similarity_penalty = (consecutive_similar / max(len(lengths) - 1, 1)) * 50
        
        # Final score combining all factors
        burstiness = (cv * 0.5) + (diversity_score * 0.3) - (similarity_penalty * 0.2)
        
        # Normalize to 0-100
        normalized = max(0, min(100, burstiness))
        
        return round(normalized, 2)
    
    def _calculate_sentence_variation(self, text: str) -> float:
        """
        Calculate variation in sentence structure and length.
        """
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if len(sentences) < 2:
            return 50.0
        
        # Analyze sentence patterns
        patterns = []
        for sentence in sentences:
            words = sentence.split()
            if not words:
                continue
                
            # Classify sentence pattern
            pattern = []
            if len(words) < 5:
                pattern.append('very_short')
            elif len(words) < 10:
                pattern.append('short')
            elif len(words) < 20:
                pattern.append('medium')
            elif len(words) < 30:
                pattern.append('long')
            else:
                pattern.append('very_long')
            
            # Check starting word
            first_word = words[0].lower()
            if first_word in ['the', 'a', 'an', 'el', 'la', 'un', 'una']:
                pattern.append('article_start')
            elif first_word in ['however', 'furthermore', 'moreover', 'además', 'sin embargo']:
                pattern.append('transition_start')
            elif first_word.endswith('ing') or first_word.endswith('ando') or first_word.endswith('iendo'):
                pattern.append('gerund_start')
            
            patterns.append(tuple(pattern))
        
        # Calculate pattern diversity
        unique_patterns = len(set(patterns))
        total_patterns = len(patterns)
        
        diversity = (unique_patterns / total_patterns) * 100 if total_patterns > 0 else 50
        
        return round(diversity, 2)
    
    def _calculate_vocabulary_diversity(self, text: str, language: str) -> float:
        """
        Calculate lexical diversity (unique words / total words).
        """
        words = re.findall(r'\b\w+\b', text.lower())
        
        # Remove stopwords
        stopwords = self.spanish_stopwords if language == 'es' else set()
        content_words = [w for w in words if w not in stopwords and len(w) > 2]
        
        if not content_words:
            return 50.0
        
        unique_words = len(set(content_words))
        total_words = len(content_words)
        
        # Type-token ratio
        ttr = (unique_words / total_words) * 100
        
        # Normalize (AI tends to have lower diversity)
        # Human text: 40-70% TTR
        # AI text: 20-40% TTR
        normalized = min(100, (ttr / 0.7) * 100)
        
        return round(normalized, 2)
    
    def _calculate_pattern_score(self, text: str, language: str) -> float:
        """
        Detect common AI patterns and phrases.
        Lower score = more AI-like
        
        ENHANCED: Detects typical AI connectors and formulaic expressions
        """
        text_lower = text.lower()
        patterns = self.spanish_ai_patterns if language == 'es' else self.ai_patterns
        
        # Extended AI connector patterns (very typical of AI)
        ai_connectors = [
            r'\bademás\b', r'\bpor lo tanto\b', r'\bsin embargo\b', 
            r'\ben conclusión\b', r'\bpor otro lado\b', r'\ben primer lugar\b',
            r'\ben segundo lugar\b', r'\ben resumen\b', r'\bfinalmente\b',
            r'\basimismo\b', r'\bde igual manera\b', r'\ben consecuencia\b',
            r'\bpor consiguiente\b', r'\bno obstante\b', r'\ben efecto\b'
        ]
        
        # Human-like connectors (less formal, more natural)
        human_connectors = [
            r'\bahora bien\b', r'\beso sí\b', r'\bla cosa es que\b',
            r'\blo cierto es que\b', r'\bvale la pena\b', r'\bcuriosamente\b',
            r'\bde hecho\b', r'\bpor cierto\b', r'\ba propósito\b',
            r'\bentre otras cosas\b', r'\ben cualquier caso\b', r'\bvisto así\b',
            r'\bmirándolo bien\b', r'\ba fin de cuentas\b', r'\bdicho esto\b'
        ]
        
        total_patterns = 0
        pattern_counts = {}
        ai_connector_count = 0
        human_connector_count = 0
        
        # Count standard AI patterns
        for category, pattern_list in patterns.items():
            pattern_counts[category] = 0
            for pattern in pattern_list:
                matches = len(re.findall(pattern, text_lower))
                pattern_counts[category] += matches
                total_patterns += matches
        
        # Count AI connectors
        for connector in ai_connectors:
            ai_connector_count += len(re.findall(connector, text_lower))
        
        # Count human connectors
        for connector in human_connectors:
            human_connector_count += len(re.findall(connector, text_lower))
        
        # Calculate metrics
        word_count = len(text.split())
        if word_count == 0:
            return 50.0
        
        # Pattern density
        pattern_density = (total_patterns / word_count) * 100
        ai_connector_density = (ai_connector_count / word_count) * 100
        human_connector_density = (human_connector_count / word_count) * 100
        
        # Score calculation
        # Penalize AI patterns and connectors
        ai_penalty = (pattern_density * 15) + (ai_connector_density * 25)
        # Reward human connectors
        human_bonus = human_connector_density * 20
        
        # Final score
        human_score = max(0, min(100, 100 - ai_penalty + human_bonus))
        
        return round(human_score, 2)
    
    def _calculate_readability(self, text: str) -> float:
        """
        Calculate readability complexity.
        AI text tends to be more uniformly readable.
        """
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if not sentences:
            return 50.0
        
        # Calculate average sentence length
        words = text.split()
        avg_sentence_length = len(words) / len(sentences) if sentences else 0
        
        # Calculate average word length
        avg_word_length = sum(len(w) for w in words) / len(words) if words else 0
        
        # Simple readability score (inverse of Flesch score concept)
        # More complex = more likely human in academic context
        complexity = (avg_sentence_length * 0.5) + (avg_word_length * 2)
        
        # Normalize (AI tends to have moderate complexity)
        # Very low or very high complexity = more human
        deviation_from_ai_norm = abs(complexity - 15)
        human_score = min(100, deviation_from_ai_norm * 5)
        
        return round(human_score, 2)
    
    def _calculate_repetition_score(self, text: str) -> float:
        """
        Calculate phrase and structure repetition.
        AI tends to repeat structures more.
        """
        # Extract 2-grams and 3-grams
        words = text.lower().split()
        
        if len(words) < 10:
            return 50.0
        
        bigrams = [' '.join(words[i:i+2]) for i in range(len(words)-1)]
        trigrams = [' '.join(words[i:i+3]) for i in range(len(words)-2)]
        
        # Count repetitions
        bigram_counts = Counter(bigrams)
        trigram_counts = Counter(trigrams)
        
        # Calculate repetition rate
        repeated_bigrams = sum(1 for count in bigram_counts.values() if count > 1)
        repeated_trigrams = sum(1 for count in trigram_counts.values() if count > 1)
        
        repetition_rate = ((repeated_bigrams + repeated_trigrams * 2) / 
                          (len(bigrams) + len(trigrams))) * 100
        
        # Higher repetition = more AI-like
        human_score = max(0, 100 - (repetition_rate * 3))
        
        return round(human_score, 2)
    
    def _connector_metrics(self, text: str) -> Dict[str, float]:
        """
        Analiza el uso de conectores para detectar patrones de IA.
        """
        t = text.lower()
        counts = {}
        
        # Contar conectores de IA y humanos
        all_connectors = self.AI_CONNECTORS | self.HUMAN_CONNECTORS
        for connector in all_connectors:
            counts[connector] = t.count(connector)
        
        total = sum(counts.values()) or 1
        
        # Calcular sobreuso de conectores de IA (típico de IA)
        overuse_ai = sum(counts.get(c, 0) for c in self.AI_CONNECTORS) / total
        
        # Calcular variedad de conectores
        variety = len([c for c, n in counts.items() if n > 0]) / max(len(counts), 1)
        
        return {
            "connector_overuse": round(overuse_ai * 100, 2),
            "connector_variety": round(variety * 100, 2)
        }
    
    def _clause_depth_variance(self, text: str) -> float:
        """
        Calcula la varianza en la profundidad de cláusulas por oración.
        Mayor varianza = más humano.
        """
        import statistics
        
        # Dividir por oraciones
        sents = re.split(r'(?<=[\.\.\?\!])\s+', text.strip())
        if not sents:
            return 0.0
        
        clause_counts = []
        for s in sents:
            # Aproximar cláusulas por signos de puntuación y conjunciones
            clauses = 1 + len(re.findall(
                r'[,:;]|\b(que|y|pero|aunque|sin embargo|no obstante)\b', 
                s.lower()
            ))
            clause_counts.append(clauses)
        
        # Calcular desviación estándar de cláusulas
        if len(clause_counts) > 1:
            return round(statistics.pstdev(clause_counts), 2)
        return 0.0
    
    def _calculate_ai_probability(self, metrics: Dict) -> float:
        """
        Calculate overall AI probability based on all metrics.
        """
        # Weight for each metric (sum to 1.0)
        weights = {
            'perplexity': 0.22,        # Important
            'burstiness': 0.18,        # Very important  
            'sentence_variation': 0.13,
            'vocabulary_diversity': 0.13,
            'pattern_score': 0.10,
            'readability': 0.08,
            'repetition_score': 0.06,
            'connector_variety': 0.05,     # Nuevo
            'connector_overuse': 0.03,     # Nuevo (ya invertido)
            'clause_depth_variance': 0.02  # Nuevo
        }
        
        # Calculate weighted score (higher = more human)
        human_score = sum(
            metrics.get(metric, 50) * weight 
            for metric, weight in weights.items()
        )
        
        # Convert to AI probability (inverse of human score)
        ai_probability = 100 - human_score

        # Heurísticas adicionales (más sensibles a firmas típicas de IA)
        try:
            burst = metrics.get('burstiness', 50)
            perp = metrics.get('perplexity', 50)
            patt = metrics.get('pattern_score', 50)
            rep  = metrics.get('repetition_score', 50)
            conn = metrics.get('connector_overuse', 50)  # ya invertido (bajo = sobreuso IA)
            vocab= metrics.get('vocabulary_diversity', 50)

            if burst < 45: ai_probability += 10
            if perp  < 35: ai_probability += 10
            if patt  < 45: ai_probability += 10
            if rep   < 45: ai_probability += 8
            if conn  < 40: ai_probability += 8
            if vocab < 35: ai_probability += 6

            # Firma combinada de IA: baja burstiness + patrones IA + repetición
            if burst < 40 and patt < 45 and rep < 50:
                ai_probability += 12
        except Exception:
            pass

        # Suavizado leve para evitar extremos erráticos, manteniendo sensibilidad
        ai_probability = max(0.0, min(100.0, ai_probability))
        
        return ai_probability
    
    def _generate_analysis(self, metrics: Dict, ai_probability: float) -> str:
        """
        Generate human-readable analysis of the detection results.
        """
        analysis_parts = []
        
        # Overall assessment
        if ai_probability > 70:
            analysis_parts.append("Este texto muestra fuertes indicadores de generación por IA.")
        elif ai_probability > 50:
            analysis_parts.append("Este texto probablemente fue generado por IA con algunas ediciones.")
        elif ai_probability > 30:
            analysis_parts.append("Este texto muestra una mezcla de características humanas y de IA.")
        else:
            analysis_parts.append("Este texto presenta características predominantemente humanas.")
        
        # Specific metric insights
        if metrics['perplexity'] < 40:
            analysis_parts.append("• Baja perplejidad: vocabulario predecible típico de IA")
        elif metrics['perplexity'] > 70:
            analysis_parts.append("• Alta perplejidad: variabilidad léxica humana")
        
        if metrics['burstiness'] < 40:
            analysis_parts.append("• Baja explosividad: longitudes de oración uniformes (IA)")
        elif metrics['burstiness'] > 70:
            analysis_parts.append("• Alta explosividad: variación natural en longitud de oraciones")
        
        if metrics['pattern_score'] < 50:
            analysis_parts.append("• Detectados patrones comunes de IA")
        
        if metrics['vocabulary_diversity'] < 40:
            analysis_parts.append("• Diversidad léxica limitada")
        elif metrics['vocabulary_diversity'] > 60:
            analysis_parts.append("• Rica diversidad de vocabulario")
        
        # Añadir análisis de conectores y cláusulas
        if 'connector_variety' in metrics:
            if metrics['connector_variety'] < 30:
                analysis_parts.append("• Baja variedad de conectores: repetitivo")
            elif metrics['connector_variety'] > 60:
                analysis_parts.append("• Buena variedad de conectores")
        
        if 'clause_depth_variance' in metrics:
            if metrics['clause_depth_variance'] < 1.5:
                analysis_parts.append("• Estructura de cláusulas muy uniforme (IA)")
            elif metrics['clause_depth_variance'] > 3.0:
                analysis_parts.append("• Variación natural en complejidad de oraciones")
        
        # Añadir nota de responsabilidad
        analysis_parts.append("\n⚠️ Nota: Esta es una estimación probabilística, no una prueba concluyente.")
        
        return '\n'.join(analysis_parts)
    
    def _get_classification(self, human_score: float) -> str:
        """
        Get classification label based on human score.
        """
        if human_score >= 90:
            return "Muy Humano"
        elif human_score >= 75:
            return "Probablemente Humano"
        elif human_score >= 50:
            return "Mixto"
        elif human_score >= 25:
            return "Probablemente IA"
        else:
            return "Muy Probablemente IA"
    
    def get_detailed_report(self, text: str, language: str = 'es') -> str:
        """
        Generate a detailed detection report.
        """
        result = self.detect(text, language)
        
        report = f"""
╔══════════════════════════════════════════════════════════════╗
║                  INFORME DE DETECCIÓN DE IA                  ║
╚══════════════════════════════════════════════════════════════╝

📊 RESULTADO PRINCIPAL:
   • Puntuación Humana: {result['human_score']}%
   • Probabilidad IA: {result['ai_probability']}%
   • Clasificación: {result['classification']}

📈 MÉTRICAS DETALLADAS:
   • Perplejidad: {result['metrics']['perplexity']:.1f}/100
   • Explosividad: {result['metrics']['burstiness']:.1f}/100
   • Variación de Oraciones: {result['metrics']['sentence_variation']:.1f}/100
   • Diversidad de Vocabulario: {result['metrics']['vocabulary_diversity']:.1f}/100
   • Puntuación de Patrones: {result['metrics']['pattern_score']:.1f}/100
   • Legibilidad: {result['metrics']['readability']:.1f}/100
   • Puntuación de Repetición: {result['metrics']['repetition_score']:.1f}/100

💡 ANÁLISIS:
{result['analysis']}

════════════════════════════════════════════════════════════════
"""
        return report

    async def calibrate_with_deepseek(self, text: str, base_ai_probability: float, metrics: Dict) -> Optional[float]:
        """
        Calibra opcionalmente la probabilidad IA usando DeepSeek (chat o reasoner) si hay API key.
        Retorna una probabilidad IA (0-100) o None si no disponible.
        """
        api_key = os.getenv("DEEPSEEK_API_KEY") or os.getenv("OPENAI_API_KEY")
        if not api_key:
            return None
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                api_key=api_key,
                base_url="https://api.deepseek.com" if os.getenv("DEEPSEEK_API_KEY") else None
            )
            system = (
                "ROL: Eres un sistema de análisis de texto avanzado para evaluar la probabilidad de que un texto haya sido generado total o parcialmente por IA. "
                "Devuelve SOLO un JSON con una clave 'ai_probability' (0–100 float). "
                "Sigue estas pautas: combina observaciones lingüísticas (patrones, conectores, repetición) con métricas cuantitativas (perplejidad, burstiness, diversidad léxica). "
                "Reconoce las limitaciones: tu salida es probabilística, no concluyente."
            )
            user = (
                "INSTRUCCIONES:\n"
                "1) Considera las métricas calculadas como señal cuantitativa.\n"
                "2) Detecta conectores típicos de IA y estructuras formulaicas.\n"
                "3) Penaliza longitudes de oración uniformes y repetición de n-gramas; recompensa diversidad y variación.\n"
                "4) Ajusta la probabilidad cerca de BASE, moviéndola solo si hay evidencia clara.\n\n"
                "METRICS=" + str({k: round(float(v), 3) for k, v in metrics.items()}) +
                f"\nBASE={round(float(base_ai_probability), 2)}\n" +
                "TEXTO (ES):\n" + text[:5000]
            )
            # Usar exclusivamente deepseek-chat
            model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
            resp = await client.chat.completions.create(
                model=model,
                messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
                temperature=0.2,
                max_tokens=500
            )
            import json as _json
            content = resp.choices[0].message.content
            data = _json.loads(content)
            value = float(data.get("ai_probability"))
            # Acotar 0-100
            return max(0.0, min(100.0, value))
        except Exception:
            return None
