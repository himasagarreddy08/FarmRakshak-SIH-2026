import unittest

from app.services.evidence import EvidenceRecord
from app.services.plant_health_adapter import PlantVillageAdapter
from app.services.pest_adapter import PestopiaAdapter
from app.services.soil_adapter import SoilYieldAdapter
from app.services.yield_adapter import YieldModelAdapter


class AIAdapterFoundationTest(unittest.TestCase):
    def test_plant_adapter_returns_structured_result(self):
        result = PlantVillageAdapter().analyze(
            image="sample.jpg",
            crop="Cotton",
            disease="leaf spot",
            label="affected",
            source="PlantVillage",
        )

        self.assertIn("image", result)
        self.assertIn("source", result)
        self.assertIn("model_status", result)
        self.assertIn("evidence", result)
        self.assertTrue(result["is_demo"] or result["model_status"] in {"MODEL_NOT_AVAILABLE", "DEVELOPMENT"})

    def test_pest_adapter_reports_missing_dataset_state(self):
        result = PestopiaAdapter().analyze(
            crop="Cotton",
            pest="Bollworm",
            region="Punjab",
            occurrence=0.7,
            severity=0.6,
            threshold=0.5,
            source="Pestopia",
        )

        self.assertEqual(result["source"], "Pestopia")
        self.assertIn("model_status", result)
        self.assertIn("status", result)
        self.assertIn("evidence", result)

    def test_soil_adapter_keeps_separate_yield_and_soil_contracts(self):
        soil_result = SoilYieldAdapter().analyze_soil(
            crop="Cotton",
            crop_stage="Flowering",
            soil={"ph": 6.7, "moisture_pct": 31, "nitrogen": 49, "phosphorus": 37, "potassium": 51},
            weather={"temperature_c": 29, "humidity_pct": 68, "rainfall_chance_pct": 42},
            inputs={"fertilizer": 100, "pesticide": 30},
        )
        self.assertIn("nutrient_status", soil_result)
        self.assertIn("evidence", soil_result)

    def test_yield_adapter_uses_explicit_model_status(self):
        result = YieldModelAdapter().predict(
            crop="Cotton",
            soil={"nitrogen": 49, "phosphorus": 37, "potassium": 51},
            weather={"temperature_c": 29, "humidity_pct": 68, "rainfall_chance_pct": 42},
            inputs={"area": 1.2, "fertilizer": 100, "pesticide": 30},
        )

        self.assertIn("prediction", result)
        self.assertIn("model_status", result)
        self.assertIn("is_demo", result)

    def test_evidence_record_supports_metadata(self):
        evidence = EvidenceRecord(
            source="PlantVillage",
            source_type="dataset",
            reference="PlantVillage sample",
            dataset_version="v1",
            confidence=0.8,
            evidence_text="Leaf lesion pattern observed in the image",
            is_demo=True,
        )

        self.assertEqual(evidence.source, "PlantVillage")
        self.assertTrue(evidence.is_demo)
        self.assertEqual(evidence.source_type, "dataset")


if __name__ == "__main__":
    unittest.main()
