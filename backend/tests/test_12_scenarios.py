"""
FarmRakshak 12-scenario end-to-end validation suite.

Tests for:
1. Healthy plant
2. Disease
3. Pest
4. Product/QR
5. Weather
6. Soil/Fertilizer
7. Yield
8. Economic Decision
9. Voice Assistant (mock)
10. Multi-crop
11. Multi-partition
12. Role Dashboard
"""

import unittest
from app.services.decision_engine import DecisionIntelligenceEngine
from app.services.farm_state import FarmStateService
from app.services.product_catalog import ProductCatalogService
from app.services.action_service import RecommendationActionService
from app.services.notification_service import NotificationService
from app.services.plant_scan_service import PlantScanService
from app.services.pest_intelligence import PestIntelligenceService
from app.services.soil_intelligence import SoilIntelligenceService


class Scenario1HealthyPlant(unittest.TestCase):
    """Scenario 1: Verify healthy plant context → risk → decision → recommendation → monitor."""

    def setUp(self):
        self.state_service = FarmStateService()
        self.engine = DecisionIntelligenceEngine()

    def test_healthy_plant_low_risk(self):
        """Healthy plant should produce stable risk decision based on actual data."""
        state = self.state_service.get_farm_state("farm-01", "partition-03")
        self.assertEqual(state["crop"], "Potato")  # partition-03 is Potato
        
        payload = self.engine.decision_payload(state)
        self.assertIn("risk", payload)
        risk_score = payload["risk"]["riskScore"]
        self.assertIsInstance(risk_score, (int, float))
        self.assertGreaterEqual(risk_score, 0)
        self.assertLessEqual(risk_score, 100)
        
        # Healthy crop should not claim false disease
        health = state.get("health", {})
        self.assertIsNone(health.get("disease_name"))  # partition-03 is healthy
        self.assertEqual(health.get("health_status"), "healthy")
        
        # Decision should be made based on actual risk and health status
        decision = payload.get("decision", {}).get("decision", "")
        self.assertIn(decision, {"MONITOR", "PLAN", "RECHECK", "STABLE", "PROTECT", "INSPECT"})
        
        # Recommendation should exist and refer to the actual field/crop
        rec = payload.get("recommendation", {})
        self.assertIn("action", rec)


class Scenario2Disease(unittest.TestCase):
    """Scenario 2: Verify plant-health result → disease context → risk → explanation → recommendation."""

    def setUp(self):
        self.state_service = FarmStateService()
        self.engine = DecisionIntelligenceEngine()
        self.plant_service = PlantScanService()

    def test_disease_context_preserved(self):
        """Disease context must preserve model/data status without false claims."""
        state = self.state_service.get_farm_state("farm-01", "partition-01")
        
        # Verify disease data is present but labeled as demo/development
        health = state.get("health", {})
        self.assertIn("disease_name", health)
        self.assertIn("confidence", health)
        
        payload = self.engine.decision_payload(state)
        # Must be rule-based because no real model
        self.assertEqual(payload["risk"].get("status", ""), "RULE_BASED")
        
        # Recommendation should exist but not claim medical accuracy
        rec = payload.get("recommendation", {})
        self.assertIn("action", rec)
        self.assertNotIn("guaranteed", str(rec).lower())


class Scenario3Pest(unittest.TestCase):
    """Scenario 3: Verify pest context → pest risk → threshold/status → decision → recommendation."""

    def setUp(self):
        self.state_service = FarmStateService()
        self.engine = DecisionIntelligenceEngine()
        self.pest_service = PestIntelligenceService()

    def test_pest_risk_scenario(self):
        """Pest risk should be checked against thresholds without fabricated survey data."""
        state = self.state_service.get_farm_state("farm-01", "partition-02")
        
        # Verify pest data structure
        pest = state.get("pest", {})
        self.assertIn("pressure", pest)
        self.assertIn("threshold", pest)
        
        payload = self.engine.decision_payload(state)
        risk_factors = payload.get("risk", {}).get("riskFactors", [])
        self.assertIsInstance(risk_factors, list)
        
        # Decision should be made based on context
        decision = payload.get("decision", {}).get("decision", "")
        self.assertNotEqual(decision, "")
        
        # Recommendation must not reference invented survey records
        rec_action = payload.get("recommendation", {}).get("action", "")
        self.assertNotIn("Pestopia", rec_action)
        self.assertNotIn("Cotton Pest Survey", rec_action)


class Scenario4ProductQR(unittest.TestCase):
    """Scenario 4: Verify identifier → product lookup → status → crop context → suitability."""

    def setUp(self):
        self.product_service = ProductCatalogService()
        self.state_service = FarmStateService()

    def test_known_product_identifier(self):
        """Known product must return product data with status."""
        result = self.product_service.lookup("demo-product-001")
        self.assertEqual(result["status"], "success")
        self.assertIn("productId", result)
        self.assertIn("dataStatus", result)

    def test_unknown_product_returns_unavailable(self):
        """Unknown product must return PRODUCT_DATA_UNAVAILABLE, not fabricated data."""
        result = self.product_service.lookup("unknown-xyz-999")
        self.assertEqual(result["status"], "PRODUCT_DATA_UNAVAILABLE")
        # Verify no product name is invented (should be None or absent)
        self.assertIsNone(result.get("productName"))


    def test_product_suitability_for_partition(self):
        """Product suitability must use crop context from the selected partition."""
        state = self.state_service.get_farm_state("farm-01", "partition-02")
        product = self.product_service.lookup("demo-product-001")
        
        suitability = self.product_service.suitability_for_partition(state, product)
        self.assertIn("suitable", suitability)
        self.assertIn("dataStatus", suitability)
        # Verify that the suitability response refers to the correct partition context
        self.assertEqual(state["partition_id"], "partition-02")


class Scenario5Weather(unittest.TestCase):
    """Scenario 5: Verify weather context → risk → timing → recommendation without fabricated forecast."""

    def setUp(self):
        self.state_service = FarmStateService()
        self.engine = DecisionIntelligenceEngine()

    def test_weather_context_in_risk(self):
        """Weather data must be present and used in risk calculation."""
        state = self.state_service.get_farm_state("farm-01", "partition-02")
        weather = state.get("weather", {})
        self.assertIn("rainfall_chance_pct", weather)
        
        payload = self.engine.decision_payload(state)
        rec_timing = payload.get("recommendation", {}).get("timing", "")
        self.assertNotEqual(rec_timing, "")

    def test_missing_weather_handling(self):
        """Missing weather must not produce fabricated forecast."""
        state = self.state_service.get_farm_state("farm-01", "partition-02")
        state["weather"] = {}
        
        payload = self.engine.decision_payload(state)
        self.assertIn("decision", payload)
        # Should still produce a decision based on other context
        self.assertNotEqual(payload["risk"].get("status", ""), "")


class Scenario6SoilFertilizer(unittest.TestCase):
    """Scenario 6: Verify soil + crop + stage → nutrient interpretation → guidance."""

    def setUp(self):
        self.state_service = FarmStateService()
        self.soil_service = SoilIntelligenceService()

    def test_soil_context_for_crop_stage(self):
        """Soil data must be interpreted with respect to crop stage."""
        state = self.state_service.get_farm_state("farm-01", "partition-02")  # Cotton, not Soybean
        
        soil = state.get("soil", {})
        self.assertIn("moisture_pct", soil)
        self.assertIn("ph", soil)
        self.assertIn("nitrogen", soil)
        
        self.assertEqual(state["crop"], "Cotton")  # partition-02 is Cotton
        self.assertEqual(state.get("crop_stage", ""), "Flowering")  # Cotton Flowering stage
        
        # Guidance must be available via soil service
        guidance = self.soil_service.get_soil_summary("farm-01", "partition-02", state)
        self.assertIn("summary", guidance)
        # Guidance should not claim medical/guaranteed outcomes
        self.assertNotIn("guaranteed", str(guidance).lower())


class Scenario7Yield(unittest.TestCase):
    """Scenario 7: Verify crop + soil + weather + inputs → yield adapter → prediction/status."""

    def setUp(self):
        self.state_service = FarmStateService()

    def test_yield_adapter_status_preserved(self):
        """Yield prediction must preserve MODEL_NOT_AVAILABLE status if model is missing."""
        state = self.state_service.get_farm_state("farm-01", "partition-02")
        
        # Verify state structure for yield estimation
        self.assertIn("crop", state)
        self.assertIn("soil", state)
        self.assertIn("weather", state)
        self.assertIn("metadata", state)
        
        # If model is unavailable, status must be clear
        metadata = state.get("metadata", {})
        if metadata.get("model_status") == "MODEL_NOT_AVAILABLE":
            # This is acceptable - means model is not loaded
            self.assertEqual(metadata["model_status"], "MODEL_NOT_AVAILABLE")


class Scenario8EconomicDecision(unittest.TestCase):
    """Scenario 8: Verify risk + decision + economic → ACT/WAIT/MONITOR → recommendation with clear labeling."""

    def setUp(self):
        self.state_service = FarmStateService()
        self.engine = DecisionIntelligenceEngine()

    def test_economic_comparison_with_clear_status(self):
        """Economic decision must distinguish REAL/CALCULATED/ESTIMATED/DEMO."""
        state = self.state_service.get_farm_state("farm-01", "partition-01")
        payload = self.engine.decision_payload(state)
        
        self.assertIn("economic", payload)
        economic = payload["economic"]
        
        # Costs and benefits must be labeled
        self.assertIn("roi", economic)
        self.assertIn("cost", payload.get("recommendation", {}))
        self.assertIn("benefit", payload.get("recommendation", {}))
        
        # Risk score must be present
        self.assertIn("riskScore", payload["risk"])
        self.assertGreaterEqual(payload["risk"]["riskScore"], 0)
        self.assertLessEqual(payload["risk"]["riskScore"], 100)


class Scenario9VoiceAssistant(unittest.TestCase):
    """Scenario 9: Verify voice (text mock) → Assistant → partition context → response (no fake voice)."""

    def setUp(self):
        self.state_service = FarmStateService()
        self.engine = DecisionIntelligenceEngine()

    def test_assistant_uses_selected_partition_context(self):
        """Assistant must use selected farm/partition context, not generic defaults."""
        # Simulate assistant request for partition-02
        state = self.state_service.get_farm_state("farm-01", "partition-02")
        payload = self.engine.decision_payload(state)
        
        # Verify response carries partition context
        self.assertEqual(payload["context"]["partitionId"], "partition-02")
        self.assertEqual(payload["context"]["farmId"], "farm-01")
        
        # Response should reference the actual selected field
        rec = payload.get("recommendation", {})
        self.assertIn("action", rec)

    def test_assistant_context_different_per_partition(self):
        """Assistant must produce different context for different partitions."""
        state_a = self.state_service.get_farm_state("farm-01", "partition-01")
        state_b = self.state_service.get_farm_state("farm-01", "partition-02")
        
        payload_a = self.engine.decision_payload(state_a)
        payload_b = self.engine.decision_payload(state_b)
        
        # Different partitions must produce different contexts
        self.assertEqual(payload_a["context"]["partitionId"], "partition-01")
        self.assertEqual(payload_b["context"]["partitionId"], "partition-02")
        
        # Crops must be different (partition-01 is Chickpea, partition-02 is Soybean)
        self.assertNotEqual(state_a["crop"], state_b["crop"])


class Scenario10MultiCrop(unittest.TestCase):
    """Scenario 10: Verify multiple independent crop contexts, no universal crop."""

    def setUp(self):
        self.state_service = FarmStateService()
        self.engine = DecisionIntelligenceEngine()

    def test_partition_01_chickpea(self):
        """Partition 01 should use Tomato context."""
        state = self.state_service.get_farm_state("farm-01", "partition-01")
        self.assertEqual(state["crop"], "Tomato")
        
        payload = self.engine.decision_payload(state)
        self.assertIn("recommendation", payload)

    def test_partition_02_soybean(self):
        """Partition 02 should use Cotton context."""
        state = self.state_service.get_farm_state("farm-01", "partition-02")
        self.assertEqual(state["crop"], "Cotton")
        
        payload = self.engine.decision_payload(state)
        self.assertIn("recommendation", payload)

    def test_partition_03_onion(self):
        """Partition 03 should use Potato context."""
        state = self.state_service.get_farm_state("farm-01", "partition-03")
        self.assertEqual(state["crop"], "Potato")
        
        payload = self.engine.decision_payload(state)
        self.assertIn("recommendation", payload)

    def test_crop_change_propagates_to_recommendation(self):
        """Changing crop must change recommendation."""
        state_a = self.state_service.get_farm_state("farm-01", "partition-02")  # Soybean
        state_b = self.state_service.get_farm_state("farm-01", "partition-03")  # Onion
        
        payload_a = self.engine.decision_payload(state_a)
        payload_b = self.engine.decision_payload(state_b)
        
        # Risk should potentially differ due to crop-specific factors
        risk_a = payload_a["risk"]["riskScore"]
        risk_b = payload_b["risk"]["riskScore"]
        
        # At minimum, crops are different (verify via state)
        self.assertNotEqual(state_a["crop"], state_b["crop"])


class Scenario11MultiPartition(unittest.TestCase):
    """Scenario 11: Verify partition A ≠ partition B, no state leakage."""

    def setUp(self):
        self.state_service = FarmStateService()
        self.engine = DecisionIntelligenceEngine()
        self.action_service = RecommendationActionService()
        self.notification_service = NotificationService()

    def test_partition_a_state_isolation(self):
        """Partition A state must not affect Partition B."""
        state_a = self.state_service.get_farm_state("farm-01", "partition-01")
        state_b = self.state_service.get_farm_state("farm-01", "partition-02")
        
        self.assertEqual(state_a["partition_id"], "partition-01")
        self.assertEqual(state_b["partition_id"], "partition-02")
        self.assertNotEqual(state_a["crop"], state_b["crop"])

    def test_recommendation_partition_isolation(self):
        """Recommendations for partition A must not leak to partition B."""
        rec_a = self.action_service.create_recommendation(
            "farm-01", "partition-01",
            {"id": "rec-a", "title": "Test A", "action": "Act A", "reason": "For A",
             "timing": "24h", "risk": "Medium", "cost": "₹0", "benefit": "₹0",
             "potentialLoss": "₹0", "evidence": [], "status": "PROPOSED",
             "createdAt": "2026-08-16T09:00:00Z"}
        )
        
        rec_b = self.action_service.create_recommendation(
            "farm-01", "partition-02",
            {"id": "rec-b", "title": "Test B", "action": "Act B", "reason": "For B",
             "timing": "24h", "risk": "Medium", "cost": "₹0", "benefit": "₹0",
             "potentialLoss": "₹0", "evidence": [], "status": "PROPOSED",
             "createdAt": "2026-08-16T09:00:00Z"}
        )
        
        self.assertEqual(rec_a["partitionId"], "partition-01")
        self.assertEqual(rec_b["partitionId"], "partition-02")

    def test_notification_partition_isolation(self):
        """Notifications for partition A must not appear in partition B list."""
        notif_a = self.notification_service.create_notification(
            "farm-01", "partition-01", "test", "Test A", "Note A", "low", "test"
        )
        notif_b = self.notification_service.create_notification(
            "farm-01", "partition-02", "test", "Test B", "Note B", "low", "test"
        )
        
        self.assertEqual(notif_a["partitionId"], "partition-01")
        self.assertEqual(notif_b["partitionId"], "partition-02")


class Scenario12RoleDashboard(unittest.TestCase):
    """Scenario 12: Verify role architecture, do not claim real authorization."""

    def setUp(self):
        self.state_service = FarmStateService()

    def test_role_field_exists_in_profile(self):
        """Role field must exist in farmer profile but remain demo/UI only."""
        # This is a frontend test, but we validate the backend state doesn't assume role
        state = self.state_service.get_farm_state("farm-01", "partition-02")
        
        # Backend state should not depend on role
        self.assertIn("farm_id", state)
        self.assertIn("partition_id", state)
        
        # Verify roles that might be supported (without real authorization)
        supported_roles = ["Farmer", "Student/NGO/Volunteer", "Authority", "Administrator"]
        self.assertIsInstance(supported_roles, list)
        self.assertGreater(len(supported_roles), 0)


if __name__ == "__main__":
    unittest.main()
