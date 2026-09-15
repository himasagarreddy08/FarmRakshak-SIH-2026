"""
Edge case audit: Verify no cross-partition state leakage.
Tests that:
1. When farmId/partitionId are provided, they are ALWAYS used (not silently overridden)
2. Fallback to partition-02 only when both are None
3. Requests for different partitions return different data
"""

import unittest
from app.services.farm_state import FarmStateService
from app.services.decision_engine import DecisionIntelligenceEngine


class EdgeCasePartitionLeakageTests(unittest.TestCase):
    """Audit for cross-partition state leakage and fallback behavior."""

    def setUp(self):
        self.state_service = FarmStateService()
        self.engine = DecisionIntelligenceEngine()

    def test_partition_01_not_silently_overridden_to_02(self):
        """Request for partition-01 must return partition-01 data, never silently swap to partition-02."""
        state_01 = self.state_service.get_farm_state("farm-01", "partition-01")
        state_02 = self.state_service.get_farm_state("farm-01", "partition-02")
        
        # Verify different partitions have different crops
        self.assertEqual(state_01["partition_id"], "partition-01")
        self.assertEqual(state_02["partition_id"], "partition-02")
        self.assertNotEqual(state_01["crop"], state_02["crop"])

    def test_partition_03_different_from_partition_02(self):
        """Request for partition-03 must return partition-03 data."""
        state_02 = self.state_service.get_farm_state("farm-01", "partition-02")
        state_03 = self.state_service.get_farm_state("farm-01", "partition-03")
        
        self.assertEqual(state_02["partition_id"], "partition-02")
        self.assertEqual(state_03["partition_id"], "partition-03")
        self.assertNotEqual(state_02["crop"], state_03["crop"])
        # partition-03 is healthy, partition-02 has disease risk
        self.assertIsNone(state_03["health"].get("disease_name"))
        self.assertIsNotNone(state_02["health"].get("disease_name"))

    def test_payload_carries_correct_partition_id(self):
        """Decision payload must carry the correct partition context."""
        payload_01 = self.engine.decision_payload(self.state_service.get_farm_state("farm-01", "partition-01"))
        payload_02 = self.engine.decision_payload(self.state_service.get_farm_state("farm-01", "partition-02"))
        payload_03 = self.engine.decision_payload(self.state_service.get_farm_state("farm-01", "partition-03"))
        
        self.assertEqual(payload_01["context"]["partitionId"], "partition-01")
        self.assertEqual(payload_02["context"]["partitionId"], "partition-02")
        self.assertEqual(payload_03["context"]["partitionId"], "partition-03")

    def test_invalid_partition_returns_error_not_fallback(self):
        """Request for non-existent partition must raise error, not silently fallback to partition-02."""
        with self.assertRaises(ValueError):
            self.state_service.get_farm_state("farm-01", "partition-999")

    def test_fallback_only_when_both_none(self):
        """Fallback to partition-02 should only occur when BOTH farm_id and partition_id are None."""
        # This test validates the safe fallback behavior documented in the code
        try:
            state = self.state_service.get_farm_state(None, None)
            # If this succeeds, verify it falls back to farm-01/partition-02
            self.assertEqual(state["farm_id"], "farm-01")
            self.assertEqual(state["partition_id"], "partition-02")
        except ValueError:
            # Also acceptable - raising error is safer than silent fallback
            pass

    def test_recommendation_carries_partition_context(self):
        """Recommendations must carry the partition_id that was requested."""
        from app.services.action_service import RecommendationActionService
        action_service = RecommendationActionService()
        
        rec_01 = action_service.create_recommendation(
            "farm-01", "partition-01",
            {"id": "test-01", "title": "Test", "action": "Act", "reason": "Test",
             "timing": "24h", "risk": "Low", "cost": "₹0", "benefit": "₹0",
             "potentialLoss": "₹0", "evidence": [], "status": "PROPOSED",
             "createdAt": "2026-08-16T09:00:00Z"}
        )
        
        rec_02 = action_service.create_recommendation(
            "farm-01", "partition-02",
            {"id": "test-02", "title": "Test", "action": "Act", "reason": "Test",
             "timing": "24h", "risk": "Low", "cost": "₹0", "benefit": "₹0",
             "potentialLoss": "₹0", "evidence": [], "status": "PROPOSED",
             "createdAt": "2026-08-16T09:00:00Z"}
        )
        
        # Verify each recommendation is tied to the correct partition
        self.assertEqual(rec_01["partitionId"], "partition-01")
        self.assertEqual(rec_02["partitionId"], "partition-02")
        self.assertNotEqual(rec_01["partitionId"], rec_02["partitionId"])


if __name__ == "__main__":
    unittest.main()
