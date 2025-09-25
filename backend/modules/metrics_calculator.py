import re
from typing import List, Dict, Any
from difflib import SequenceMatcher

# Simple Levenshtein distance implementation since the library has compatibility issues
def levenshtein_distance(s1, s2):
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    
    if len(s2) == 0:
        return len(s1)
    
    previous_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    
    return previous_row[-1]


class MetricsCalculator:
    """
    Calculate various text metrics and generate diffs between original and rewritten texts.
    Specialized for Spanish academic texts.
    """
    
    def __init__(self):
        # Spanish stopwords for rare word calculation
        self.spanish_stopwords = {
            'a', 'al', 'algo', 'algunas', 'algunos', 'ante', 'antes', 'como', 'con', 'contra', 'cual', 'cuando',
            'de', 'del', 'desde', 'donde', 'durante', 'e', 'el', 'ella', 'ellas', 'ellos', 'en', 'entre', 'era',
            'erais', 'eran', 'eras', 'eres', 'es', 'esa', 'esas', 'ese', 'eso', 'esos', 'esta', 'estaba',
            'estabais', 'estaban', 'estabas', 'estad', 'estada', 'estadas', 'estado', 'estados', 'estamos',
            'estando', 'estar', 'estaremos', 'estará', 'estarán', 'estarás', 'estaré', 'estaréis', 'estaría',
            'estaríais', 'estaríamos', 'estarían', 'estarías', 'estas', 'este', 'estemos', 'esto', 'estos',
            'estoy', 'estuve', 'estuviera', 'estuvierais', 'estuvieran', 'estuvieras', 'estuvieron', 'estuviese',
            'estuvieseis', 'estuviesen', 'estuvieses', 'estuvimos', 'estuviste', 'estuvisteis', 'estuvo', 'está',
            'estábamos', 'estáis', 'están', 'estás', 'esté', 'estéis', 'estén', 'estés', 'fue', 'fuera', 'fuerais',
            'fueran', 'fueras', 'fueron', 'fuese', 'fueseis', 'fuesen', 'fueses', 'fui', 'fuimos', 'fuiste',
            'fuisteis', 'ha', 'habida', 'habidas', 'habido', 'habidos', 'habiendo', 'habremos', 'habrá',
            'habrán', 'habrás', 'habré', 'habréis', 'habría', 'habríais', 'habríamos', 'habrían', 'habrías',
            'habéis', 'había', 'habíais', 'habíamos', 'habían', 'habías', 'han', 'has', 'hasta', 'hay', 'haya',
            'hayamos', 'hayan', 'hayas', 'hayáis', 'he', 'hemos', 'hube', 'hubiera', 'hubierais', 'hubieran',
            'hubieras', 'hubieron', 'hubiese', 'hubieseis', 'hubiesen', 'hubieses', 'hubimos', 'hubiste',
            'hubisteis', 'hubo', 'la', 'las', 'le', 'les', 'lo', 'los', 'me', 'mi', 'mis', 'mucho', 'muchos',
            'muy', 'más', 'mí', 'mía', 'mías', 'mío', 'míos', 'nada', 'ni', 'no', 'nos', 'nosotras', 'nosotros',
            'nuestra', 'nuestras', 'nuestro', 'nuestros', 'o', 'os', 'otra', 'otras', 'otro', 'otros', 'para',
            'pero', 'poco', 'por', 'porque', 'que', 'quien', 'se', 'sea', 'seamos', 'sean', 'seas', 'sentid',
            'sentida', 'sentidas', 'sentido', 'sentidos', 'seremos', 'será', 'serán', 'serás', 'seré', 'seréis',
            'sería', 'seríais', 'seríamos', 'serían', 'serías', 'seáis', 'sido', 'siendo', 'sin', 'sobre',
            'sois', 'somos', 'son', 'soy', 'su', 'sus', 'suya', 'suyas', 'suyo', 'suyos', 'sí', 'también',
            'tanto', 'te', 'tendremos', 'tendrá', 'tendrán', 'tendrás', 'tendré', 'tendréis', 'tendría',
            'tendríais', 'tendríamos', 'tendrían', 'tendrías', 'tened', 'tenemos', 'tenga', 'tengamos', 'tengan',
            'tengas', 'tengo', 'tengáis', 'tenida', 'tenidas', 'tenido', 'tenidos', 'teniendo', 'tenéis',
            'tenía', 'teníais', 'teníamos', 'tenían', 'tenías', 'ti', 'tiene', 'tienen', 'tienes', 'todo',
            'todos', 'tu', 'tus', 'tuve', 'tuviera', 'tuvierais', 'tuvieran', 'tuvieras', 'tuvieron', 'tuviese',
            'tuvieseis', 'tuviesen', 'tuvieses', 'tuvimos', 'tuviste', 'tuvisteis', 'tuvo', 'tuya', 'tuyas',
            'tuyo', 'tuyos', 'tú', 'un', 'una', 'uno', 'unos', 'vosotras', 'vosotros', 'vuestra', 'vuestras',
            'vuestro', 'vuestros', 'y', 'ya', 'yo', 'él', 'éramos'
        }
    
    def calculate(self, original_text: str, rewritten_text: str) -> Dict[str, float]:
        """
        Calculate comprehensive metrics comparing original and rewritten texts.
        
        Args:
            original_text: Original text
            rewritten_text: Rewritten text
            
        Returns:
            Dictionary with calculated metrics
        """
        return {
            "change_ratio": self._calculate_change_ratio(original_text, rewritten_text),
            "rare_words_ratio": self._calculate_rare_word_ratio(rewritten_text),
            "avg_sentence_len": self._calculate_avg_sentence_length(rewritten_text),
            "lix": self._calculate_lix(rewritten_text)
        }
    
    def generate_diff(self, original_text: str, rewritten_text: str) -> List[Dict[str, str]]:
        """
        Generate a token-based diff between original and rewritten texts.
        
        Args:
            original_text: Original text
            rewritten_text: Rewritten text
            
        Returns:
            List of diff items with type and token
        """
        # Tokenize both texts
        original_tokens = self._tokenize(original_text)
        rewritten_tokens = self._tokenize(rewritten_text)
        
        # Use SequenceMatcher to find differences
        matcher = SequenceMatcher(None, original_tokens, rewritten_tokens)
        
        diff = []
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                # Unchanged tokens
                for token in original_tokens[i1:i2]:
                    diff.append({"type": "equal", "token": token})
            elif tag == 'delete':
                # Deleted tokens
                for token in original_tokens[i1:i2]:
                    diff.append({"type": "delete", "token": token})
            elif tag == 'insert':
                # Inserted tokens
                for token in rewritten_tokens[j1:j2]:
                    diff.append({"type": "insert", "token": token})
            elif tag == 'replace':
                # Replaced tokens - mark old as deleted and new as inserted
                for token in original_tokens[i1:i2]:
                    diff.append({"type": "delete", "token": token})
                for token in rewritten_tokens[j1:j2]:
                    diff.append({"type": "insert", "token": token})
        
        return diff
    
    def _calculate_change_ratio(self, original: str, rewritten: str) -> float:
        """
        Calculate the ratio of changed characters using Levenshtein distance.
        
        Args:
            original: Original text
            rewritten: Rewritten text
            
        Returns:
            Change ratio (0.0 to 1.0)
        """
        if not original:
            return 1.0 if rewritten else 0.0
        
        # Use Levenshtein distance for accurate change calculation
        distance = levenshtein_distance(original, rewritten)
        max_length = max(len(original), len(rewritten))
        
        return distance / max_length if max_length > 0 else 0.0
    
    def _calculate_rare_word_ratio(self, text: str) -> float:
        """
        Calculate the ratio of rare words in the text.
        A word is considered rare if it's longer than 12 characters and not a stopword.
        
        Args:
            text: Text to analyze
            
        Returns:
            Ratio of rare words (0.0 to 1.0)
        """
        words = self._extract_words(text)
        if not words:
            return 0.0
        
        rare_words = 0
        for word in words:
            word_lower = word.lower()
            # Consider rare if longer than 12 chars and not a common stopword
            if len(word) > 12 and word_lower not in self.spanish_stopwords:
                rare_words += 1
        
        return rare_words / len(words)
    
    def _calculate_avg_sentence_length(self, text: str) -> float:
        """
        Calculate the average sentence length in words.
        
        Args:
            text: Text to analyze
            
        Returns:
            Average sentence length
        """
        sentences = self._split_sentences(text)
        if not sentences:
            return 0.0
        
        total_words = 0
        for sentence in sentences:
            words = self._extract_words(sentence)
            total_words += len(words)
        
        return total_words / len(sentences)
    
    def _calculate_lix(self, text: str) -> float:
        """
        Calculate LIX (Readability Index) approximation for Spanish.
        LIX = (words/sentences) + (long_words * 100 / words)
        Long words are defined as words with more than 6 characters.
        
        Args:
            text: Text to analyze
            
        Returns:
            LIX score
        """
        sentences = self._split_sentences(text)
        words = self._extract_words(text)
        
        if not sentences or not words:
            return 0.0
        
        # Count long words (more than 6 characters)
        long_words = sum(1 for word in words if len(word) > 6)
        
        # Calculate LIX
        avg_sentence_length = len(words) / len(sentences)
        long_word_percentage = (long_words * 100) / len(words)
        
        return avg_sentence_length + long_word_percentage
    
    def _tokenize(self, text: str) -> List[str]:
        """
        Tokenize text into words and punctuation marks.
        
        Args:
            text: Text to tokenize
            
        Returns:
            List of tokens
        """
        # Split on whitespace and keep punctuation as separate tokens
        tokens = []
        current_token = ""
        
        for char in text:
            if char.isalnum() or char in "áéíóúñüÁÉÍÓÚÑÜ":
                current_token += char
            else:
                if current_token:
                    tokens.append(current_token)
                    current_token = ""
                if not char.isspace():
                    tokens.append(char)
        
        if current_token:
            tokens.append(current_token)
        
        return tokens
    
    def _extract_words(self, text: str) -> List[str]:
        """
        Extract only words (no punctuation) from text.
        
        Args:
            text: Text to process
            
        Returns:
            List of words
        """
        return re.findall(r'\b[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]+\b', text)
    
    def _split_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences using Spanish sentence boundaries.
        
        Args:
            text: Text to split
            
        Returns:
            List of sentences
        """
        # Spanish sentence endings
        sentence_pattern = r'[.!?]+(?:\s|$)'
        sentences = re.split(sentence_pattern, text)
        
        # Filter out empty sentences
        sentences = [s.strip() for s in sentences if s.strip()]
        
        return sentences
    
    def get_text_stats(self, text: str) -> Dict[str, Any]:
        """
        Get basic statistics about a text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary with text statistics
        """
        words = self._extract_words(text)
        sentences = self._split_sentences(text)
        
        return {
            "char_count": len(text),
            "word_count": len(words),
            "sentence_count": len(sentences),
            "avg_word_length": sum(len(word) for word in words) / len(words) if words else 0,
            "longest_word": max(words, key=len) if words else "",
            "shortest_word": min(words, key=len) if words else ""
        }
