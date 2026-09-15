import unittest
from app.services.yield_adapter import YieldModelAdapter


class TestYieldModel(unittest.TestCase):
    """Test the real Random Forest yield prediction model and adapter."""

    def setUp(self):
        self.adapter = YieldModelAdapter()

    def test_yield_model_loaded(self):
        """Verify the model and preprocessor are loaded."""
        self.assertIsNotNone(self.adapter.model, "Yield model should be loaded")
        self.assertIsNotNone(self.adapter.preprocessor, "Yield preprocessor should be loaded")

    def test_predict_cotton_yield(self):
        """Verify inference returns a positive yield prediction with valid schema."""
        result = self.adapter.predict(
            crop="Cotton",
            inputs={
                "year": 2024,
                "season": "Kharif",
                "state": "Maharashtra",
                "area": 2.4,
                "fertilizer": 110.0,
                "pesticide": 1.8,
            }
        )
        self.assertEqual(result["model_status"], "MODEL_AVAILABLE")
        self.assertEqual(result["unit"], "tonnes/hectare")
        self.assertGreater(result["prediction"], 0)
        self.assertIn("Random Forest", result["source"])
        self.assertEqual(result["crop"], "Cotton")

    def test_predict_tomato_yield(self):
        """Verify tomato yield prediction gives reasonable horticulture tonnage."""
        result = self.adapter.predict(
            crop="Tomato",
            inputs={
                "year": 2024,
                "season": "Kharif",
                "state": "Maharashtra",
                "area": 1.8,
                "fertilizer": 140.0,
                "pesticide": 2.2,
            }
        )
        self.assertEqual(result["model_status"], "MODEL_AVAILABLE")
        # Tomato yields in India typically range from 15 to 35 tonnes/ha
        self.assertGreater(result["prediction"], 10.0)
