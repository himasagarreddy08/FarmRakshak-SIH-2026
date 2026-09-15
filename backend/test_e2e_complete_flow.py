import os
import sys

# Ensure UTF-8 output
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_system_flow():
    passed = 0
    total = 0

    print("==================================================================")
    print("FARMRAKSHAK — FULL PRODUCT VERIFICATION & AUDIT SUITE")
    print("==================================================================")

    # 1. Health and ML Models Status
    total += 1
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health failed: {res.status_code}"
    health_data = res.json()
    assert health_data["status"] == "healthy"
    assert health_data["plant_model_loaded"] is True
    assert health_data["yield_model_loaded"] is True
    print(f"[PASS] 1. Health Endpoint: PlantVision ML={health_data['plant_model_loaded']}, Yield ML={health_data['yield_model_loaded']}")
    passed += 1

    # 2. Farmer Authentication & Scoped Farm Listing
    total += 1
    res = client.get("/api/farms", headers={"X-User-Role": "Farmer", "X-User-Name": "farmer@farmrakshak.demo"})
    assert res.status_code == 200
    farms = res.json().get("farms", [])
    assert len(farms) == 1
    farm_id = farms[0].get("farm_id") or farms[0].get("id")
    assert farm_id == "farm-01"
    print(f"[PASS] 2. Farmer Scoping: User 'farmer@farmrakshak.demo' receives only their farm '{farms[0]['name']}' ({farm_id})")
    passed += 1

    # 3. Farmer Isolation Security Enforcement
    total += 1
    res = client.get("/api/farms/farm-02", headers={"X-User-Role": "Farmer", "X-User-Name": "farmer@farmrakshak.demo"})
    assert res.status_code == 403, f"Expected 403 Forbidden for unauthorized farm, got {res.status_code}"
    print("[PASS] 3. Farmer Isolation: Farmer Ramesh Patil cannot access Suresh Deshmukh's farm (403 Forbidden enforced).")
    passed += 1

    # 4. Partition Switching Across All 4 Blocks
    partitions_to_test = [
        ("partition-02", "Cotton", "Flowering", 31.0, "North Block"),
        ("partition-01", "Tomato", "Vegetative", 42.0, "East Terrace"),
        ("partition-03", "Potato", "Bulbing", 55.0, "Wellside Plot"),
        ("partition-04", "Chickpea", "Vegetative", 38.0, "South Acre"),
    ]

    for part_id, expected_crop, expected_stage, expected_moist, name in partitions_to_test:
        total += 1
        res = client.get(f"/api/context?farm_id=farm-01&partition_id={part_id}", headers={"X-User-Role": "Farmer"})
        assert res.status_code == 200
        ctx = res.json()
        assert ctx["partition_id"] == part_id
        assert ctx["crop"] == expected_crop
        assert ctx["cropStage"] == expected_stage
        assert ctx["sensor"]["soilMoisture"] == expected_moist
        print(f"[PASS] 4. Partition Switch: {name} ({part_id}) -> Crop={ctx['crop']}, Stage={ctx['cropStage']}, Moisture={ctx['sensor']['soilMoisture']}%, Risk={ctx['risk']['level']}")
        passed += 1

    # 5. Explainable Decision Intelligence Engine
    total += 1
    res = client.post("/api/recommendation", json={"farmId": "farm-01", "partitionId": "partition-02"})
    assert res.status_code == 200
    rec = res.json()
    assert "action" in rec and len(rec["action"]) > 0
    assert "cost" in rec
    assert "benefit" in rec
    assert "potentialLoss" in rec
    assert "evidence" in rec
    assert "source" in rec
    print(f"[PASS] 5. Explainable Recommendation: Action='{rec['action']}', Cost={rec['cost']}, Benefit={rec['benefit']}, Loss={rec['potentialLoss']}")
    passed += 1

    # 6. Rakshak Grounded Assistant: Multilingual Agronomic Reasoning
    # Telugu (తెలుగు)
    total += 1
    res_te = client.post("/api/assistant", json={
        "message": "నేను ఈ రోజు పిచికారీ చేయవచ్చా?",
        "language": "te",
        "farmId": "farm-01",
        "partitionId": "partition-02"
    })
    assert res_te.status_code == 200
    ans_te = res_te.json()["answer"]
    assert "వర్షం" in ans_te or "పిచికారీ" in ans_te or "వాయిదా" in ans_te
    print(f"[PASS] 6a. Assistant in Telugu (తెలుగు): '{ans_te[:70]}...'")
    passed += 1

    # Hindi (हिन्दी)
    total += 1
    res_hi = client.post("/api/assistant", json={
        "message": "क्या मुझे आज सिंचाई करनी चाहिए?",
        "language": "hi",
        "farmId": "farm-01",
        "partitionId": "partition-02"
    })
    assert res_hi.status_code == 200
    ans_hi = res_hi.json()["answer"]
    assert "सिंचाई" in ans_hi or "नमी" in ans_hi or "बारिश" in ans_hi
    print(f"[PASS] 6b. Assistant in Hindi (हिन्दी): '{ans_hi[:70]}...'")
    passed += 1

    # Marathi (मराठी)
    total += 1
    res_mr = client.post("/api/assistant", json={
        "message": "आज फवारणी करणे योग्य आहे का?",
        "language": "mr",
        "farmId": "farm-01",
        "partitionId": "partition-02"
    })
    assert res_mr.status_code == 200
    ans_mr = res_mr.json()["answer"]
    assert "फवारणी" in ans_mr or "पाऊस" in ans_mr or "खर्च" in ans_mr
    print(f"[PASS] 6c. Assistant in Marathi (मराठी): '{ans_mr[:70]}...'")
    passed += 1

    # English (en) - East Terrace Tomato Partition
    total += 1
    res_en = client.post("/api/assistant", json={
        "message": "What is the primary action and economic benefit today?",
        "language": "en",
        "farmId": "farm-01",
        "partitionId": "partition-01"
    })
    assert res_en.status_code == 200
    ans_en = res_en.json()["answer"]
    assert "East Terrace" in ans_en or "Tomato" in ans_en
    print(f"[PASS] 6d. Assistant in English for East Terrace: '{ans_en[:70]}...'")
    passed += 1

    # 7. Plant Scan ML Model (PyTorch MobileNetV3 Scripted)
    total += 1
    scan_res = client.post("/api/plant-scan", json={"fileName": "cotton_bacterial_spot.jpg"})
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert "disease" in scan_data
    assert scan_data["confidence"] > 0
    assert scan_data["model_status"] == "MODEL_AVAILABLE"
    print(f"[PASS] 7. Plant Scan ML Vision: Disease='{scan_data['disease']}', Confidence={scan_data['confidence']}%, Source={scan_data['source']}")
    passed += 1

    # 8. ML Crop Yield Prediction (Random Forest Regressor)
    total += 1
    yield_res = client.post("/api/predict/yield", json={
        "crop": "Cotton",
        "year": 2024,
        "season": "Kharif",
        "state": "Maharashtra",
        "area": 2.4,
        "fertilizer": 110,
        "pesticide": 1.8
    })
    assert yield_res.status_code == 200
    yield_data = yield_res.json()
    assert yield_data["predicted_yield"] > 0
    print(f"[PASS] 8. Crop Yield ML Predictor: Predicted Yield={yield_data['predicted_yield']} tonnes/ha (Confidence={yield_data['confidence']}%)")
    passed += 1

    # 9. Product & QR Code Suitability Verification
    total += 1
    prod_res = client.post("/api/product-suitability", json={
        "identifier": "PROD-COPPER-50",
        "farmId": "farm-01",
        "partitionId": "partition-02"
    })
    assert prod_res.status_code == 200
    prod_data = prod_res.json()
    assert "product" in prod_data
    assert "suitability" in prod_data
    p_name = prod_data["product"].get("productName") or prod_data["product"].get("name")
    print(f"[PASS] 9. QR Product Verification: Product='{p_name}', Safe={prod_data['suitability']['safe']}, Reason='{prod_data['suitability']['reason']}'")
    passed += 1

    # 10. Role-Specific Dashboards (Educator & Authority)
    total += 1
    edu_res = client.get("/api/educator-cases")
    assert edu_res.status_code == 200
    assert len(edu_res.json()["cases"]) >= 3

    auth_res = client.get("/api/regional-overview?region=Maharashtra")
    assert auth_res.status_code == 200
    auth_data = auth_res.json()
    assert "risk_hotspots" in auth_data
    assert "active_interventions" in auth_data
    print(f"[PASS] 10. Multi-Tenant Scopes: Educator Cases={len(edu_res.json()['cases'])}, Authority Surveillance Hotspots={len(auth_data['risk_hotspots'])}, Active Alerts={len(auth_data['active_interventions'])}")
    passed += 1

    print("==================================================================")
    print(f"RESULTS: {passed}/{total} AUDIT VERIFICATION CHECKS PASSED (100% GREEN)")
    print("==================================================================")

if __name__ == "__main__":
    test_full_system_flow()
