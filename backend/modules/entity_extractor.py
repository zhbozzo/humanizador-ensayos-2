import re
from typing import List, Tuple, Dict
import uuid


class EntityExtractor:
    """
    Extracts and preserves entities like numbers, dates, citations, and proper names
    to prevent them from being modified during text rewriting.
    """
    
    def __init__(self):
        # Regex patterns for different entity types
        self.patterns = {
            # Numbers: integers, decimals, percentages
            'numbers': r'\b\d+(?:[.,]\d+)*%?\b',
            
            # Years: 4-digit years (1900-2099)
            'years': r'\b(?:19|20)\d{2}\b',
            
            # Dates: various Spanish date formats
            'dates': r'\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+de\s+\w+\s+de\s+\d{4}|\w+\s+\d{1,2},?\s+\d{4})\b',
            
            # ISO dates
            'iso_dates': r'\b\d{4}-\d{2}-\d{2}\b',
            
            # Citations: (Author, Year) or (Author et al., Year)
            'citations': r'\([^)]*(?:\d{4}|et\s+al\.)[^)]*\)',
            
            # References like "1", "2", etc. in superscript context or between brackets
            'references': r'\b\[\d+\]\b|\b\(\d+\)\b',
            
            # URLs and DOIs
            'urls': r'https?://[^\s]+|doi:[^\s]+',
            
            # Proper names (capitalized words, especially in Spanish context)
            'proper_names': r'\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*\b',
        }
        
        # Combined pattern for efficiency
        self.combined_pattern = '|'.join(f'({pattern})' for pattern in self.patterns.values())
        self.entity_placeholders = {}
    
    def extract_and_freeze(self, text: str) -> Tuple[List[str], str]:
        """
        Extract entities from text and replace them with placeholders.
        
        Args:
            text: Original text
            
        Returns:
            Tuple of (list of frozen entities, text with placeholders)
        """
        frozen_entities = []
        processed_text = text
        self.entity_placeholders = {}
        
        # Find all entities
        matches = list(re.finditer(self.combined_pattern, text, re.IGNORECASE))
        
        # Sort matches by position (descending) to replace from end to beginning
        matches.sort(key=lambda x: x.start(), reverse=True)
        
        for match in matches:
            entity = match.group().strip()
            
            # Skip if it's just a single common word (to avoid over-preservation)
            if self._is_common_word(entity):
                continue
            
            # Generate unique placeholder
            placeholder = f"__ENTITY_{len(frozen_entities)}_{uuid.uuid4().hex[:8]}__"
            
            # Store the entity and its placeholder
            frozen_entities.append(entity)
            self.entity_placeholders[placeholder] = entity
            
            # Replace in text
            start, end = match.span()
            processed_text = processed_text[:start] + placeholder + processed_text[end:]
        
        return frozen_entities, processed_text
    
    def restore_entities(self, text_with_placeholders: str) -> str:
        """
        Restore original entities from placeholders.
        
        Args:
            text_with_placeholders: Text containing entity placeholders
            
        Returns:
            Text with original entities restored
        """
        restored_text = text_with_placeholders
        
        for placeholder, entity in self.entity_placeholders.items():
            restored_text = restored_text.replace(placeholder, entity)
        
        return restored_text
    
    def verify_entities_preserved(self, original_text: str, rewritten_text: str, frozen_entities: List[str]) -> bool:
        """
        Verify that all frozen entities are preserved in the rewritten text.
        
        Args:
            original_text: Original text
            rewritten_text: Rewritten text
            frozen_entities: List of entities that should be preserved
            
        Returns:
            True if all entities are preserved
            
        Raises:
            ValueError: If entities are not properly preserved
        """
        missing_entities = []
        
        for entity in frozen_entities:
            # Use regex to find exact matches (accounting for word boundaries)
            pattern = re.escape(entity)
            if not re.search(pattern, rewritten_text):
                missing_entities.append(entity)
        
        if missing_entities:
            raise ValueError(f"Las siguientes entidades no fueron preservadas: {missing_entities}")
        
        return True
    
    def _is_common_word(self, word: str) -> bool:
        """
        Check if a word is a common Spanish word that shouldn't be preserved.
        
        Args:
            word: Word to check
            
        Returns:
            True if it's a common word that can be modified
        """
        # List of common Spanish words that might match proper name patterns
        # but should not be preserved as entities
        common_words = {
            'El', 'La', 'Los', 'Las', 'Un', 'Una', 'De', 'Del', 'Al', 'En', 'Con', 'Por', 'Para',
            'Este', 'Esta', 'Estos', 'Estas', 'Ese', 'Esa', 'Esos', 'Esas', 'Aquel', 'Aquella',
            'Que', 'Quien', 'Como', 'Cuando', 'Donde', 'Porque', 'Si', 'No', 'Muy', 'Más', 'Menos',
            'Todo', 'Toda', 'Todos', 'Todas', 'Otro', 'Otra', 'Otros', 'Otras', 'Mismo', 'Misma',
            'También', 'Solo', 'Sólo', 'Así', 'Aquí', 'Allí', 'Ahí', 'Ahora', 'Antes', 'Después',
            'Durante', 'Mientras', 'Según', 'Sin', 'Sobre', 'Entre', 'Hacia', 'Hasta', 'Desde'
        }
        
        return word in common_words
    
    def get_entity_stats(self, frozen_entities: List[str]) -> Dict[str, int]:
        """
        Get statistics about the types of entities found.
        
        Args:
            frozen_entities: List of extracted entities
            
        Returns:
            Dictionary with counts of different entity types
        """
        stats = {
            'numbers': 0,
            'years': 0,
            'dates': 0,
            'citations': 0,
            'references': 0,
            'urls': 0,
            'proper_names': 0,
            'total': len(frozen_entities)
        }
        
        for entity in frozen_entities:
            # Check what type of entity it is
            if re.match(r'\b\d+(?:[.,]\d+)*%?\b', entity):
                stats['numbers'] += 1
            elif re.match(r'\b(?:19|20)\d{2}\b', entity):
                stats['years'] += 1
            elif re.match(r'\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+de\s+\w+\s+de\s+\d{4}|\w+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})\b', entity):
                stats['dates'] += 1
            elif re.match(r'\([^)]*(?:\d{4}|et\s+al\.)[^)]*\)', entity):
                stats['citations'] += 1
            elif re.match(r'\b\[\d+\]\b|\b\(\d+\)\b', entity):
                stats['references'] += 1
            elif re.match(r'https?://[^\s]+|doi:[^\s]+', entity):
                stats['urls'] += 1
            elif re.match(r'\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*\b', entity):
                stats['proper_names'] += 1
        
        return stats
