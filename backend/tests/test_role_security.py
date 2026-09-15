import unittest
from fastapi.testclient import TestClient
from app.main import app


class TestRoleSecurity(unittest.TestCase):
    """Test role access control, geographic scopes, and data isolation."""

    def setUp(self):
        self.client = TestClient(app)

    def test_farmer_sees_only_own_farms(self):
        """Farmer Ramesh Patil should only see farm-01."""
        response = self.client.get("/api/farms", headers={"X-User-Name": "farmer@farmrakshak.demo"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        farm_ids = [f["farm_id"] for f in data["farms"]]
        self.assertIn("farm-01", farm_ids)
        self.assertNotIn("farm-02", farm_ids)

    def test_farmer_forbidden_from_other_farmers_farm(self):
        """Farmer Ramesh Patil attempting to access farm-02 must receive 403 Forbidden."""
        response = self.client.get("/api/farms/farm-02", headers={"X-User-Name": "farmer@farmrakshak.demo"})
        self.assertEqual(response.status_code, 403)
        self.assertIn("Access denied", response.json()["detail"])

    def test_educator_sees_demo_farms_and_learning_cases(self):
        """Educator should see demo-farm-01 and educator learning cases."""
        response = self.client.get("/api/farms", headers={"X-User-Name": "educator@farmrakshak.demo"})
        self.assertEqual(response.status_code, 200)
        farm_ids = [f["farm_id"] for f in response.json()["farms"]]
        self.assertIn("demo-farm-01", farm_ids)

        cases_res = self.client.get("/api/educator-cases", headers={"X-User-Role": "Educator"})
        self.assertEqual(cases_res.status_code, 200)
        self.assertGreater(len(cases_res.json()["cases"]), 0)

    def test_authority_regional_overview(self):
        """Authority user should access aggregated regional risk hotspots."""
        response = self.client.get("/api/regional-overview?region=Maharashtra", headers={"X-User-Role": "Authority"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["jurisdiction"], "Maharashtra")
        self.assertIn("risk_hotspots", data)
        self.assertIn("crop_distribution", data)

    def test_admin_global_visibility(self):
        """Admin has visibility across all farms and system telemetry."""
        response = self.client.get("/api/farms", headers={"X-User-Name": "admin@farmrakshak.demo"})
        self.assertEqual(response.status_code, 200)
        farm_ids = [f["farm_id"] for f in response.json()["farms"]]
        self.assertIn("farm-01", farm_ids)
        self.assertIn("farm-02", farm_ids)
        self.assertIn("demo-farm-01", farm_ids)

        status_res = self.client.get("/api/admin/system-status")
        self.assertEqual(status_res.status_code, 200)
        status_data = status_res.json()
        self.assertEqual(status_data["ml_models"]["plant_village_vision"]["status"], "ONLINE")
        self.assertEqual(status_data["ml_models"]["crop_yield_regressor"]["status"], "ONLINE")
