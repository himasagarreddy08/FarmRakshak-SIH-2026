import unittest

from app.services.farm_state import FarmStateService


class FarmStateServiceTest(unittest.TestCase):
    def test_selected_partition_context_is_applied(self):
        service = FarmStateService()
        state = service.get_farm_state("farm-01", "partition-02")

        self.assertEqual(state["partition_id"], "partition-02")
        self.assertEqual(state["crop"], "Cotton")
        self.assertEqual(state["risk_level"], "Medium")

    def test_partition_specific_data_is_not_replaced_by_global_default(self):
        service = FarmStateService()
        state = service.get_farm_state("farm-01", "partition-03")

        self.assertEqual(state["partition_id"], "partition-03")
        self.assertEqual(state["crop"], "Potato")
        self.assertGreaterEqual(state["risk_score"], 0)


if __name__ == "__main__":
    unittest.main()
