import unittest

from app.services.decision_engine import DecisionIntelligenceEngine
from app.services.farm_state import FarmStateService


class DecisionEngineTest(unittest.TestCase):
    def setUp(self):
        self.service = FarmStateService()
        self.engine = DecisionIntelligenceEngine()

    def test_low_risk_healthy_crop(self):
        state = self.service.get_farm_state("farm-01", "partition-03")
        payload = self.engine.decision_payload(state)
        self.assertIn("risk", payload)
        self.assertIn("decision", payload)
        self.assertIn("recommendation", payload)
        self.assertIn("farm_state", payload)

    def test_disease_risk_scenario(self):
        state = self.service.get_farm_state("farm-01", "partition-01")
        payload = self.engine.decision_payload(state)
        self.assertGreaterEqual(payload["risk"]["riskScore"], 0)
        self.assertIn(payload["decision"]["decision"], {"PROTECT", "INSPECT", "RECHECK"})

    def test_pest_risk_scenario(self):
        state = self.service.get_farm_state("farm-01", "partition-02")
        payload = self.engine.decision_payload(state)
        self.assertIn("riskFactors", payload["risk"])
        self.assertIn("recommendation", payload)

    def test_rain_window_scenario(self):
        state = self.service.get_farm_state("farm-01", "partition-02")
        payload = self.engine.decision_payload(state)
        self.assertIn("timing", payload["recommendation"])

    def test_low_soil_moisture_scenario(self):
        state = self.service.get_farm_state("farm-01", "partition-02")
        state["soil"]["moisture_pct"] = 25
        payload = self.engine.decision_payload(state)
        self.assertIn("decision", payload)

    def test_economic_comparison(self):
        state = self.service.get_farm_state("farm-01", "partition-01")
        payload = self.engine.decision_payload(state)
        self.assertIn("economic", payload)
        self.assertIn("roi", payload["economic"])

    def test_selected_partition_a(self):
        state = self.service.get_farm_state("farm-01", "partition-01")
        payload = self.engine.decision_payload(state)
        self.assertEqual(payload["context"]["partitionId"], "partition-01")

    def test_selected_partition_b(self):
        state = self.service.get_farm_state("farm-01", "partition-03")
        payload = self.engine.decision_payload(state)
        self.assertEqual(payload["context"]["partitionId"], "partition-03")

    def test_missing_weather(self):
        state = self.service.get_farm_state("farm-01", "partition-02")
        state["weather"] = {}
        payload = self.engine.decision_payload(state)
        self.assertIn("decision", payload)

    def test_missing_model_data(self):
        state = self.service.get_farm_state("farm-01", "partition-02")
        state["metadata"] = {"model_status": "MODEL_NOT_AVAILABLE", "data_status": "DATA_UNAVAILABLE"}
        payload = self.engine.decision_payload(state)
        self.assertIn("status", payload["risk"])
        self.assertIn("RULE_BASED", payload["risk"]["status"])


if __name__ == "__main__":
    unittest.main()
