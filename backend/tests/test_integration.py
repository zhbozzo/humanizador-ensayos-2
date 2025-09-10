import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from modules.entity_extractor import EntityExtractor
from modules.metrics_calculator import MetricsCalculator

client = TestClient(app)


class TestEntityPreservation:
    """Test suite for entity preservation functionality"""
    
    def test_preserve_numbers_and_dates(self):
        """Test that numbers, percentages, and dates are preserved"""
        test_text = "El estudio realizado en 2023 mostró que el 85% de los participantes, exactamente 1,234 personas, obtuvieron resultados positivos el 15/03/2023."
        
        request_data = {
            "text": test_text,
            "budget": 0.2,
            "preserve_entities": True,
            "respect_style": False,
            "style_sample": None
        }
        
        response = client.post("/api/humanize", json=request_data)
        
        assert response.status_code == 200
        result = response.json()
        
        # Check that key entities are preserved in the result
        assert "2023" in result["result"]
        assert "85%" in result["result"]
        assert "1,234" in result["result"] or "1.234" in result["result"]
        assert "15/03/2023" in result["result"]
    
    def test_preserve_citations(self):
        """Test that academic citations are preserved"""
        test_text = "Según García (2020) y el estudio de López et al. (2019), los resultados indican una correlación significativa."
        
        request_data = {
            "text": test_text,
            "budget": 0.15,
            "preserve_entities": True,
            "respect_style": False,
            "style_sample": None
        }
        
        response = client.post("/api/humanize", json=request_data)
        
        assert response.status_code == 200
        result = response.json()
        
        # Check that citations are preserved
        assert "(2020)" in result["result"]
        assert "(2019)" in result["result"]
        assert "García" in result["result"]
        assert "López" in result["result"]
    
    def test_entity_extractor_standalone(self):
        """Test the entity extractor module directly"""
        extractor = EntityExtractor()
        
        test_text = "En el año 2024, el 95% de 500 estudiantes participaron en la encuesta realizada el 12/06/2024."
        
        entities, processed_text = extractor.extract_and_freeze(test_text)
        
        # Verify entities were extracted
        assert len(entities) > 0
        assert any("2024" in entity for entity in entities)
        assert any("95%" in entity for entity in entities)
        assert any("500" in entity for entity in entities)
        
        # Verify placeholders were inserted
        assert "__ENTITY_" in processed_text


class TestBudgetCompliance:
    """Test suite for budget compliance"""
    
    def test_budget_respected_low(self):
        """Test that low budget (5%) is respected"""
        test_text = "Este es un texto de prueba que debe ser modificado mínimamente según el presupuesto establecido para la tarea de humanización."
        
        request_data = {
            "text": test_text,
            "budget": 0.05,
            "preserve_entities": True,
            "respect_style": False,
            "style_sample": None
        }
        
        response = client.post("/api/humanize", json=request_data)
        
        assert response.status_code == 200
        result = response.json()
        
        # Check that change ratio is within acceptable range (budget + small tolerance)
        change_ratio = result["metrics"]["change_ratio"]
        assert change_ratio <= 0.15  # Allow some tolerance for demo mode or minor variations
    
    def test_budget_respected_medium(self):
        """Test that medium budget (20%) is respected"""
        test_text = "La investigación académica requiere un análisis profundo y sistemático de los datos recopilados durante el proceso experimental."
        
        request_data = {
            "text": test_text,
            "budget": 0.20,
            "preserve_entities": True,
            "respect_style": False,
            "style_sample": None
        }
        
        response = client.post("/api/humanize", json=request_data)
        
        assert response.status_code == 200
        result = response.json()
        
        # Check that change ratio is reasonable
        change_ratio = result["metrics"]["change_ratio"]
        assert change_ratio <= 0.30  # Allow tolerance for various factors
    
    def test_budget_zero(self):
        """Test that zero budget results in minimal or no changes"""
        test_text = "Este texto no debería cambiar significativamente con un presupuesto de cero."
        
        request_data = {
            "text": test_text,
            "budget": 0.0,
            "preserve_entities": True,
            "respect_style": False,
            "style_sample": None
        }
        
        response = client.post("/api/humanize", json=request_data)
        
        assert response.status_code == 200
        result = response.json()
        
        # With zero budget, text should remain very similar
        change_ratio = result["metrics"]["change_ratio"]
        assert change_ratio <= 0.10  # Very low change ratio expected


class TestMetricsCalculation:
    """Test suite for metrics calculation stability and accuracy"""
    
    def test_metrics_calculator_change_ratio(self):
        """Test that change ratio calculation is stable and accurate"""
        calculator = MetricsCalculator()
        
        original = "Este es el texto original."
        modified = "Este es el texto modificado."
        
        metrics = calculator.calculate(original, modified)
        
        # Verify all metrics are present and reasonable
        assert "change_ratio" in metrics
        assert "rare_word_ratio" in metrics
        assert "avg_sentence_len" in metrics
        assert "lix" in metrics
        
        # Change ratio should be between 0 and 1
        assert 0 <= metrics["change_ratio"] <= 1
        
        # For identical texts, change ratio should be 0
        identical_metrics = calculator.calculate(original, original)
        assert identical_metrics["change_ratio"] == 0
    
    def test_metrics_lix_calculation(self):
        """Test LIX calculation for readability"""
        calculator = MetricsCalculator()
        
        # Simple text should have lower LIX
        simple_text = "Este es un texto muy simple. Tiene palabras cortas. Es fácil de leer."
        
        # Complex text should have higher LIX
        complex_text = "La investigación epistemológica contemporánea establece paradigmas metodológicos fundamentalmente innovadores."
        
        simple_metrics = calculator.calculate(simple_text, simple_text)
        complex_metrics = calculator.calculate(complex_text, complex_text)
        
        # Complex text should have higher LIX score
        assert complex_metrics["lix"] > simple_metrics["lix"]
        
        # Both should be positive
        assert simple_metrics["lix"] > 0
        assert complex_metrics["lix"] > 0
    
    def test_diff_generation(self):
        """Test that diff generation works correctly"""
        calculator = MetricsCalculator()
        
        original = "El gato come pescado."
        modified = "El gato come atún fresco."
        
        diff = calculator.generate_diff(original, modified)
        
        # Diff should be a list
        assert isinstance(diff, list)
        assert len(diff) > 0
        
        # Each diff item should have type and token
        for item in diff:
            assert "type" in item
            assert "token" in item
            assert item["type"] in ["equal", "insert", "delete"]
    
    def test_api_response_structure(self):
        """Test that API response has all required fields and correct structure"""
        test_text = "Texto de prueba para verificar la estructura de respuesta de la API."
        
        request_data = {
            "text": test_text,
            "budget": 0.15,
            "preserve_entities": True,
            "respect_style": False,
            "style_sample": None
        }
        
        response = client.post("/api/humanize", json=request_data)
        
        assert response.status_code == 200
        result = response.json()
        
        # Verify required fields are present
        required_fields = ["result", "diff", "metrics", "alerts"]
        for field in required_fields:
            assert field in result
        
        # Verify metrics structure
        metrics_fields = ["change_ratio", "rare_word_ratio", "avg_sentence_len", "lix"]
        for field in metrics_fields:
            assert field in result["metrics"]
            assert isinstance(result["metrics"][field], (int, float))
        
        # Verify diff structure
        assert isinstance(result["diff"], list)
        if result["diff"]:  # If diff is not empty
            assert "type" in result["diff"][0]
            assert "token" in result["diff"][0]
        
        # Verify alerts is a list
        assert isinstance(result["alerts"], list)


class TestErrorHandling:
    """Test suite for error handling"""
    
    def test_empty_text_error(self):
        """Test that empty text returns appropriate error"""
        request_data = {
            "text": "",
            "budget": 0.2,
            "preserve_entities": True,
            "respect_style": False,
            "style_sample": None
        }
        
        response = client.post("/api/humanize", json=request_data)
        assert response.status_code == 400
    
    def test_invalid_budget_error(self):
        """Test that invalid budget values return appropriate error"""
        request_data = {
            "text": "Texto de prueba",
            "budget": 1.5,  # Invalid: > 1
            "preserve_entities": True,
            "respect_style": False,
            "style_sample": None
        }
        
        response = client.post("/api/humanize", json=request_data)
        assert response.status_code == 400
        
        # Test negative budget
        request_data["budget"] = -0.1
        response = client.post("/api/humanize", json=request_data)
        assert response.status_code == 400


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])
