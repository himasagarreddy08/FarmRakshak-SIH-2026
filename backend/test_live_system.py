import json
import urllib.request
import urllib.parse
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'http://127.0.0.1:8000'

def request_json(path, method='GET', data=None):
    url = f"{BASE_URL}{path}"
    headers = {'Content-Type': 'application/json'}
    body = json.dumps(data).encode('utf-8') if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def run_all_checks():
    passed = 0
    total = 0

    print("============================================================")
    print("FARMRAKSHAK LIVE SERVER END-TO-END VERIFICATION")
    print("============================================================")

    # 1. Root & Static Frontend
    total += 1
    req = urllib.request.Request(BASE_URL)
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        assert '<div id="root"></div>' in html
        assert 'FarmRakshak' in html
        print("[PASS] 1. Root HTML serves React SPA bundle correctly.")
        passed += 1

    # 2. Health check
    total += 1
    health = request_json('/api/health')
    assert health['status'] == 'healthy'
    assert health['plant_model_loaded'] is True
    assert health['yield_model_loaded'] is True
    print(f"[PASS] 2. Health Endpoint: Status={health['status']}, PlantModelLoaded={health['plant_model_loaded']}, YieldModelLoaded={health['yield_model_loaded']}")
    passed += 1

    # 3. Farm State Endpoint for Farmer Scope
    total += 1
    state = request_json('/api/farm-state?farm_id=farm-01&partition_id=partition-02')
    assert state['farm_id'] == 'farm-01'
    assert state['partition_id'] == 'partition-02'
    assert state['crop'] == 'Cotton'
    assert 'soil' in state and 'weather' in state
    print(f"[PASS] 3. Farm state returned for North Block: Crop={state['crop']}, Moisture={state['soil']['moisture_pct']}%, RiskScore={state['risk_score']}")
    passed += 1

    # 4. Decision Engine & Risk Calculation
    total += 1
    risk = request_json('/api/risk', method='POST', data={
        'farmId': 'farm-01',
        'partitionId': 'partition-02'
    })
    assert 'overallRisk' in risk
    assert 'riskLevel' in risk
    assert 'riskFactors' in risk
    print(f"[PASS] 4. Decision Engine Risk: Score={risk['overallRisk']}, Level={risk['riskLevel']}, RiskFactors={risk['riskFactors']}")
    passed += 1

    # 5. Recommendation Engine
    total += 1
    rec = request_json('/api/recommendation', method='POST', data={
        'farmId': 'farm-01',
        'partitionId': 'partition-02'
    })
    assert 'action' in rec
    assert 'cost' in rec
    assert 'benefit' in rec
    assert 'potentialLoss' in rec
    print(f"[PASS] 5. Explainable Recommendation: Action='{rec['action']}', Cost={rec['cost']}, Benefit={rec['benefit']}, Loss={rec['potentialLoss']}")
    passed += 1

    # 6. ML Model: Random Forest Crop Yield Regressor
    total += 1
    yield_pred = request_json('/api/predict/yield', method='POST', data={
        'crop': 'Cotton',
        'year': 2024,
        'season': 'Kharif',
        'state': 'Maharashtra',
        'area': 2.4,
        'fertilizer': 110,
        'pesticide': 1.8
    })
    assert 'predicted_yield' in yield_pred
    assert yield_pred['predicted_yield'] > 0
    print(f"[PASS] 6. ML Yield Regressor: Predicted Yield={yield_pred['predicted_yield']} tonnes/ha (Confidence={yield_pred['confidence']}%)")
    passed += 1

    # 7. ML Model: Plant Scan PyTorch MobileNetV3 Vision
    total += 1
    scan_res = request_json('/api/plant-scan', method='POST', data={
        'fileName': 'cotton_leaf_blight.jpg',
        'farmId': 'farm-01',
        'partitionId': 'partition-02'
    })
    assert 'disease' in scan_res
    assert 'confidence' in scan_res
    print(f"[PASS] 7. ML Vision Inference: Disease='{scan_res['disease']}', Confidence={scan_res['confidence']}%, State={scan_res['healthy_affected_state']}")
    passed += 1

    # 8. Product Suitability & QR Scanner
    total += 1
    prod_res = request_json('/api/product-suitability', method='POST', data={
        'identifier': 'PROD-MANCOZEB-75',
        'farmId': 'farm-01',
        'partitionId': 'partition-02'
    })
    assert prod_res['suitability']['safe'] is True
    print(f"[PASS] 8. Product Suitability: Product='{prod_res['product']['name']}', Safe={prod_res['suitability']['safe']}")
    passed += 1

    # 9. Grounded Multi-Intent Assistant in Telugu (te)
    total += 1
    te_assistant = request_json('/api/assistant', method='POST', data={
        'message': 'ఈ రోజు నేను పంటకు నీరు పెట్టాలా?',
        'fieldName': 'North Block',
        'soilMoisture': 31,
        'rainfallChance': 42,
        'diseaseConfidence': 82.4,
        'language': 'te',
        'role': 'Farmer'
    })
    assert 'answer' in te_assistant
    assert len(te_assistant['answer']) > 20
    print(f"[PASS] 9. Telugu Assistant: {te_assistant['answer'][:110]}...")
    passed += 1

    # 10. Grounded Multi-Intent Assistant in Hindi (hi)
    total += 1
    hi_assistant = request_json('/api/assistant', method='POST', data={
        'message': 'क्या मुझे आज सिंचाई करनी चाहिए?',
        'fieldName': 'North Block',
        'soilMoisture': 31,
        'rainfallChance': 42,
        'diseaseConfidence': 82.4,
        'language': 'hi',
        'role': 'Farmer'
    })
    assert 'answer' in hi_assistant
    print(f"[PASS] 10. Hindi Assistant: {hi_assistant['answer'][:110]}...")
    passed += 1

    # 11. Grounded Multi-Intent Assistant in Marathi (mr)
    total += 1
    mr_assistant = request_json('/api/assistant', method='POST', data={
        'message': 'मी आज पिकाला पाणी द्यावे का?',
        'fieldName': 'North Block',
        'soilMoisture': 31,
        'rainfallChance': 42,
        'diseaseConfidence': 82.4,
        'language': 'mr',
        'role': 'Farmer'
    })
    assert 'answer' in mr_assistant
    print(f"[PASS] 11. Marathi Assistant: {mr_assistant['answer'][:110]}...")
    passed += 1

    # 12. Regional Surveillance (Authority Scope)
    total += 1
    regional = request_json('/api/regional-overview?region=Maharashtra')
    assert 'crop_distribution' in regional
    assert len(regional['risk_hotspots']) >= 4
    print(f"[PASS] 12. Regional Surveillance: {len(regional['risk_hotspots'])} hotspots across Maharashtra, Monitored Acres={regional['monitored_acres']}")
    passed += 1

    # 13. Educator Research Cases (MPKV Rahuri)
    total += 1
    edu = request_json('/api/educator-cases')
    assert 'cases' in edu
    assert len(edu['cases']) >= 3
    print(f"[PASS] 13. Educator Scope: {len(edu['cases'])} anonymized research cases loaded from MPKV Rahuri.")
    passed += 1

    # 14. Admin Telemetry & Health Status
    total += 1
    admin_stat = request_json('/api/admin/system-status')
    assert admin_stat['ml_models']['plant_village_vision']['status'] == 'ONLINE'
    assert admin_stat['ml_models']['crop_yield_regressor']['status'] == 'ONLINE'
    print(f"[PASS] 14. Admin Telemetry: Both ML models ONLINE, API Health Status={admin_stat['overall_status']}")
    passed += 1

    print("============================================================")
    print(f"RESULTS: {passed}/{total} CHECKS PASSED (100% SUCCESS)")
    print("============================================================")

if __name__ == '__main__':
    run_all_checks()
