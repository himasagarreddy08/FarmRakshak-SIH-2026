import unittest

from app.services.action_service import RecommendationActionService
from app.services.farm_state import FarmStateService
from app.services.notification_service import NotificationService
from app.services.product_catalog import ProductCatalogService


class ProductActionNotificationTests(unittest.TestCase):
    def setUp(self):
        self.product_service = ProductCatalogService()
        self.state_service = FarmStateService()
        self.action_service = RecommendationActionService()
        self.notification_service = NotificationService()

    def test_known_identifier_with_available_data(self):
        result = self.product_service.lookup("demo-product-001")
        self.assertEqual(result["status"], "success")
        self.assertIn("productId", result)
        self.assertIn("dataStatus", result)

    def test_unknown_identifier_returns_unavailable_state(self):
        result = self.product_service.lookup("not-found-999")
        self.assertEqual(result["status"], "PRODUCT_DATA_UNAVAILABLE")

    def test_product_suitability_for_selected_partition(self):
        state = self.state_service.get_farm_state("farm-01", "partition-02")
        product = self.product_service.lookup("demo-product-001")
        suitability = self.product_service.suitability_for_partition(state, product)
        self.assertIn("suitable", suitability)
        self.assertIn("dataStatus", suitability)

    def test_recommendation_created(self):
        rec = self.action_service.create_recommendation(
            "farm-01",
            "partition-02",
            {
                "id": "rec-001",
                "title": "Inspect lower rows",
                "action": "Walk the lower rows",
                "reason": "Rain likely",
                "timing": "24h",
                "risk": "Medium",
                "cost": "₹180/acre",
                "benefit": "₹1,600/acre",
                "potentialLoss": "₹2,900/acre",
                "evidence": [{"source": "demo", "type": "partition"}],
                "status": "PROPOSED",
                "createdAt": "2026-08-16T09:00:00Z",
            },
        )
        self.assertEqual(rec["status"], "PROPOSED")
        self.assertEqual(rec["partitionId"], "partition-02")

    def test_action_applied_and_follow_up_state(self):
        rec = self.action_service.create_recommendation(
            "farm-01",
            "partition-01",
            {"id": "rec-002", "title": "Inspect lower leaves", "action": "Inspect", "reason": "Disease risk", "timing": "24h", "risk": "Medium", "cost": "₹180/acre", "benefit": "₹1,200/acre", "potentialLoss": "₹2,450/acre", "evidence": [], "status": "PROPOSED", "createdAt": "2026-08-16T09:00:00Z"}
        )
        applied = self.action_service.apply_action("rec-002", "farm-01", "partition-01", "Farmer completed the inspection")
        self.assertEqual(applied["status"], "APPLIED")
        self.assertIn("followUpDue", applied)

    def test_feedback_recorded_awaiting_observation(self):
        rec = self.action_service.create_recommendation(
            "farm-01",
            "partition-03",
            {"id": "rec-003", "title": "Monitor", "action": "Monitor", "reason": "Stable", "timing": "48h", "risk": "Low", "cost": "₹0/acre", "benefit": "₹0/acre", "potentialLoss": "₹0/acre", "evidence": [], "status": "PLANNED", "createdAt": "2026-08-16T09:00:00Z"}
        )
        feedback = self.action_service.record_feedback(
            "rec-003",
            "farm-01",
            "partition-03",
            {
                "actionTaken": "Checked crop",
                "date": "2026-08-16",
                "observation": "",
                "farmerFeedback": "No visible change yet",
                "resultStatus": "AWAITING_OBSERVATION",
            },
        )
        self.assertEqual(feedback["resultStatus"], "AWAITING_OBSERVATION")

    def test_notification_created_and_read(self):
        notification = self.notification_service.create_notification(
            "farm-01",
            "partition-02",
            "rain_window",
            "Rain window check",
            "Rain risk remains elevated for this field.",
            "medium",
            "decision_engine",
        )
        self.assertFalse(notification["read"])
        read_item = self.notification_service.mark_read(notification["id"])
        self.assertTrue(read_item["read"])

    def test_partition_specific_notification_filter(self):
        self.notification_service.create_notification(
            "farm-01",
            "partition-01",
            "pest_risk",
            "Pest pressure rising",
            "Early pest pressure requires scouting.",
            "high",
            "decision_engine",
        )
        filtered = self.notification_service.list_notifications("farm-01", "partition-01")
        self.assertTrue(filtered[0]["partitionId"] == "partition-01")

    def test_duplicate_prevention(self):
        first = self.notification_service.create_notification(
            "farm-01",
            "partition-03",
            "recommendation_due",
            "Follow-up due",
            "Field needs a follow-up check.",
            "medium",
            "decision_engine",
        )
        second = self.notification_service.create_notification(
            "farm-01",
            "partition-03",
            "recommendation_due",
            "Follow-up due",
            "Field needs a follow-up check.",
            "medium",
            "decision_engine",
        )
        self.assertEqual(first["id"], second["id"])

    def test_selected_partition_a_and_b_context(self):
        state_a = self.state_service.get_farm_state("farm-01", "partition-01")
        state_b = self.state_service.get_farm_state("farm-01", "partition-03")
        self.assertEqual(state_a["partition_id"], "partition-01")
        self.assertEqual(state_b["partition_id"], "partition-03")


if __name__ == "__main__":
    unittest.main()
