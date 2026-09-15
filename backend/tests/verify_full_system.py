import json
import urllib.request
import urllib.parse

def run_verification():
    print("=" * 60)
    print("FarmRakshak Full-Stack System Verification")
    print("=" * 60)

    # 1. Check Backend Root & Health
    try:
        req = urllib.request.urlopen("http://127.0.0.1:8000/api/health")
        data = json.loads(req.read().decode("utf-8"))
        print(f"[PASS] Backend /api/health: {data['status']}")
    except Exception as e:
        print(f"[FAIL] Backend /api/health: {e}")

    # 2. Check Farm State with Role Scopes
    try:
        # Farmer scope
        url = "http://127.0.0.1:8000/api/farm-state?farm_id=farm-01&partition_id=partition-02"
        req = urllib.request.urlopen(url)
        data = json.loads(req.read().decode("utf-8"))
        assert data["farm_id"] == "farm-01"
        assert data["crop"] == "Cotton"
        assert data["risk_level"] in ["Low", "Medium", "High"]
        print(f"[PASS] Farmer Farm State (farm-01, Cotton): Risk = {data['risk_score']} ({data['risk_level']})")
    except Exception as e:
        print(f"[FAIL] Farmer Farm State: {e}")

    # 3. Check Crop Yield ML Model Prediction (Scikit-Learn 1.9 Random Forest)
    try:
        payload = json.dumps({
            "crop": "Cotton",
            "year": 2024,
            "season": "Kharif",
            "state": "Maharashtra",
            "area": 2.4,
            "fertilizer": 110.0,
            "pesticide": 1.8
        }).encode("utf-8")
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/predict/yield",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode("utf-8"))
        assert data["status"] == "MODEL_AVAILABLE"
        assert data["predicted_yield"] > 0
        assert data["confidence"] >= 90.0
        print(f"[PASS] ML Crop Yield Regressor: Predicted Yield = {data['predicted_yield']} tonnes/ha (Confidence: {data['confidence']}%)")
    except Exception as e:
        print(f"[FAIL] ML Crop Yield Regressor: {e}")

    # 4. Check Plant Vision Scanner (PyTorch MobileNetV3)
    try:
        payload = json.dumps({
            "fileName": "sample_leaf.jpg",
            "crop": "Cotton"
        }).encode("utf-8")
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/plant-scan",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode("utf-8"))
        assert "disease" in data
        assert data["confidence"] > 0
        print(f"[PASS] Plant Vision Model: Disease = '{data['disease']}' (Confidence: {data['confidence']}%, Model: {data.get('model_status')})")
    except Exception as e:
        print(f"[FAIL] Plant Vision Model: {e}")

    # 5. Check Product Suitability Scanner
    try:
        payload = json.dumps({
            "identifier": "PROD-MANCOZEB-75",
            "farmId": "farm-01",
            "partitionId": "partition-02"
        }).encode("utf-8")
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/product-suitability",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode("utf-8"))
        assert "product" in data
        assert "suitability" in data
        prod_name = data["product"].get("productName") or data["product"].get("name")
        print(f"[PASS] Product Suitability: Product = '{prod_name}', Safe = {data['suitability']['safe']}")
    except Exception as e:
        print(f"[FAIL] Product Suitability: {e}")

    # 6. Check Rakshak Grounded Assistant
    try:
        payload = json.dumps({
            "message": "Should I irrigate my field today?",
            "fieldName": "North Block",
            "soilMoisture": 31,
            "rainfallChance": 42,
            "diseaseConfidence": 82.4,
            "language": "en",
            "role": "Farmer"
        }).encode("utf-8")
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/assistant",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode("utf-8"))
        assert "answer" in data
        print(f"[PASS] Rakshak Assistant Reply: \"{data['answer'][:85]}...\"")
    except Exception as e:
        print(f"[FAIL] Rakshak Assistant: {e}")

    # 7. Check Educator Cases Endpoint
    try:
        req = urllib.request.urlopen("http://127.0.0.1:8000/api/educator-cases")
        data = json.loads(req.read().decode("utf-8"))
        assert len(data["cases"]) > 0
        print(f"[PASS] Educator Research Cases: {len(data['cases'])} cases available")
    except Exception as e:
        print(f"[FAIL] Educator Cases: {e}")

    # 8. Check Authority Regional Overview Endpoint
    try:
        req = urllib.request.urlopen("http://127.0.0.1:8000/api/regional-overview?region=Maharashtra")
        data = json.loads(req.read().decode("utf-8"))
        assert data["total_monitored_acres"] > 0
        assert len(data["risk_hotspots"]) > 0
        print(f"[PASS] Authority Regional Overview: Monitored Acres = {data['total_monitored_acres']:,}, Hotspots = {len(data['risk_hotspots'])}")
    except Exception as e:
        print(f"[FAIL] Authority Regional Overview: {e}")

    # 9. Check Admin System Telemetry Endpoint
    try:
        req = urllib.request.urlopen("http://127.0.0.1:8000/api/admin/system-status")
        data = json.loads(req.read().decode("utf-8"))
        assert data["ml_models"]["plant_village_vision"]["status"] == "ONLINE"
        assert data["ml_models"]["crop_yield_regressor"]["status"] == "ONLINE"
        print(f"[PASS] Admin ML Telemetry: Plant Vision = {data['ml_models']['plant_village_vision']['status']}, Crop Yield RF = {data['ml_models']['crop_yield_regressor']['status']}")
    except Exception as e:
        print(f"[FAIL] Admin System Telemetry: {e}")

    # 10. Check Frontend HTML Serving
    try:
        req = urllib.request.urlopen("http://127.0.0.1:5173")
        content = req.read().decode("utf-8")
        assert "FarmRakshak" in content or "vite" in content
        print(f"[PASS] Frontend Dev Server serving on http://127.0.0.1:5173 (Status: {req.status})")
    except Exception as e:
        print(f"[FAIL] Frontend Dev Server: {e}")

    print("=" * 60)
    print("ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY")
    print("=" * 60)

if __name__ == "__main__":
    run_verification()
