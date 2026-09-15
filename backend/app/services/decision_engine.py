from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class DecisionIntelligenceEngine:
    """Rule-based decision intelligence layer for the FarmRakshak dashboard.

    This layer intentionally uses transparent, explainable development logic when
    the repository does not include real field-validated models or price feeds.
    """

    def build_context(self, state: Dict[str, Any]) -> Dict[str, Any]:
        soil = state.get("soil") or {}
        weather = state.get("weather") or {}
        health = state.get("health") or {}
        pest = state.get("pest") or {}
        metadata = state.get("metadata") or {}

        return {
            "farmId": state.get("farm_id"),
            "partitionId": state.get("partition_id"),
            "fieldName": state.get("name"),
            "crop": state.get("crop"),
            "cropStage": state.get("crop_stage"),
            "soil": soil,
            "weather": weather,
            "plantHealth": health,
            "disease": health.get("disease_name") or health.get("health_status"),
            "pestRisk": pest,
            "history": state.get("history") or [],
            "currentRisk": state.get("risk_score"),
            "yieldContext": {
                "crop": state.get("crop"),
                "soil": soil,
                "weather": weather,
                "source": "development adapter",
            },
            "economicContext": {
                "source": "development estimate",
                "status": "ESTIMATE",
            },
            "evidence": [
                {"source": "farm-state", "type": "partition", "reference": state.get("partition_id")},
                {"source": "weather", "type": "weather", "reference": weather.get("condition") or "weather unavailable"},
                {"source": "plant-health", "type": "health", "reference": health.get("disease_name") or "no disease label"},
            ],
            "selectedPartition": state.get("partition_id"),
            "selectedFarm": state.get("farm_id"),
            "modelStatus": metadata.get("model_status") or "MODEL_NOT_AVAILABLE",
            "dataStatus": metadata.get("data_status") or "DATA_UNAVAILABLE",
        }

    def compute_risk(self, state: Dict[str, Any]) -> Dict[str, Any]:
        health = state.get("health") or {}
        soil = state.get("soil") or {}
        weather = state.get("weather") or {}
        pest = state.get("pest") or {}
        crop_stage = str(state.get("crop_stage") or "").lower()
        moisture = float(soil.get("moisture_pct", 0))
        rainfall = float(weather.get("rainfall_chance_pct", 0))
        disease_confidence = float(health.get("confidence", 0))
        pest_pressure = float(pest.get("pressure", 0))

        score = 0
        factors: List[str] = []

        if disease_confidence > 0:
            score += min(100, disease_confidence * 0.35)
            factors.append("Disease signal")
        if moisture < 35:
            score += 18
            factors.append("Moisture condition")
        elif moisture > 60:
            score += 8
            factors.append("Excess moisture risk")
        if rainfall >= 50:
            score += min(30, rainfall * 0.25)
            factors.append("Rain window")
        if pest_pressure > 0:
            score += min(100, pest_pressure * 0.25)
            factors.append("Pest pressure")
        if any(token in crop_stage for token in ["flower", "fruit", "tuber", "nitrogen", "vegetative"]):
            score += 8
            factors.append("Crop stage")
        if state.get("history") and any("below target" in str(item).lower() for item in state.get("history", [])):
            score += 6
            factors.append("History trend")

        risk_score = min(100, int(round(score)))
        if risk_score >= 70:
            risk_level = "High"
        elif risk_score >= 40:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        evidence = [
            {
                "source": "farm-state",
                "type": "partition",
                "reference": f"Selected partition {state.get('partition_id')}",
                "evidence_text": "Decision risk is derived from selected partition state and rule-based development logic.",
                "is_demo": True,
            },
            {
                "source": "weather",
                "type": "weather",
                "reference": f"Rain likelihood {rainfall}%",
                "evidence_text": "Rain window is included as a development rule signal for the decision engine.",
                "is_demo": True,
            },
            {
                "source": "health",
                "type": "plant_health",
                "reference": health.get("disease_name") or "health status available",
                "evidence_text": "Plant health confidence and disease signal contribute to the risk score.",
                "is_demo": True,
            },
        ]

        return {
            "riskScore": risk_score,
            "riskLevel": risk_level,
            "riskFactors": factors or ["Current conditions appear stable."],
            "confidence": "rule-based development logic",
            "status": "RULE_BASED",
            "evidence": evidence,
            "source": "FarmRakshak decision engine (rule-based development logic)",
            "is_demo": True,
            "is_estimate": True,
        }

    def choose_decision(self, state: Dict[str, Any], risk: Dict[str, Any]) -> Dict[str, Any]:
        soil = state.get("soil") or {}
        weather = state.get("weather") or {}
        health = state.get("health") or {}
        moisture = float(soil.get("moisture_pct", 0))
        rainfall = float(weather.get("rainfall_chance_pct", 0))
        disease_confidence = float(health.get("confidence", 0))
        risk_score = int(risk.get("riskScore", 0))

        if not weather:
            decision = "MONITOR"
            timing = "Timing cannot be determined because weather context is unavailable."
        elif rainfall >= 65 and risk_score < 60:
            decision = "WAIT"
            timing = "Wait for the rain window to pass; recheck within 24 hours."
        elif moisture < 35 and risk_score < 70:
            decision = "IRRIGATE"
            timing = "Act today before the next irrigation window."
        elif disease_confidence >= 65 or risk_score >= 70:
            decision = "PROTECT"
            timing = "Inspect and protect the field today before conditions worsen."
        elif risk_score >= 45:
            decision = "INSPECT"
            timing = "Inspect today and recheck in 24 hours."
        elif risk_score >= 25:
            decision = "RECHECK"
            timing = "Recheck in 48 hours."
        else:
            decision = "MONITOR"
            timing = "Continue monitoring for the next 48 hours."

        return {
            "decision": decision,
            "timing": timing,
            "status": "RULE_BASED",
            "source": "FarmRakshak decision engine",
            "confidence": "development / rule-based",
        }

    def economic_context(self, state: Dict[str, Any], risk: Dict[str, Any]) -> Dict[str, Any]:
        risk_score = int(risk.get("riskScore", 0))
        crop = state.get("crop") or "General crop"
        action_cost = 180 if risk_score < 60 else 320 if risk_score < 80 else 450
        potential_loss = 1200 if risk_score < 40 else 2000 if risk_score < 70 else 2600
        avoided_loss = max(0, potential_loss - action_cost)
        roi = round((avoided_loss / action_cost), 2) if action_cost else 0.0

        return {
            "crop": crop,
            "actionCost": f"₹{action_cost}/acre",
            "potentialUntreatedLoss": f"₹{potential_loss}/acre",
            "estimatedAvoidedLoss": f"₹{avoided_loss}/acre",
            "estimatedBenefit": f"₹{avoided_loss}/acre",
            "roi": roi,
            "costStatus": "ESTIMATE",
            "source": "development estimate; no verified market/feed dataset included",
            "is_demo": True,
            "is_estimate": True,
        }

    def scenario_comparison(self, state: Dict[str, Any], risk: Dict[str, Any]) -> Dict[str, Any]:
        risk_score = int(risk.get("riskScore", 0))
        soil = state.get("soil") or {}
        weather = state.get("weather") or {}
        moisture = float(soil.get("moisture_pct", 0))
        rainfall = float(weather.get("rainfall_chance_pct", 0))

        scenarios = {
            "act_now": {
                "timing": "Today before next irrigation window",
                "estimated_cost": "₹180–₹450/acre (ESTIMATE)",
                "risk": max(0, risk_score - 8),
                "potential_loss": "₹2,000–₹2,600/acre (ESTIMATE)",
                "expected_benefit": "Lower immediate risk and better crop stability (ESTIMATE)",
                "reason": "Acting now reduces several risk factors that are already present.",
                "status": "ESTIMATE",
            },
            "wait": {
                "timing": "Wait for the rain window to pass if conditions remain stable",
                "estimated_cost": "₹0–₹180/acre (ESTIMATE)",
                "risk": min(100, risk_score + 10),
                "potential_loss": "₹2,300–₹3,000/acre (ESTIMATE)",
                "expected_benefit": "Delayed action may avoid short-term spray disruption (ESTIMATE)",
                "reason": "Rain and field conditions may temporarily lower treatment efficiency.",
                "status": "ESTIMATE",
            },
            "monitor": {
                "timing": "Monitor for 48 hours",
                "estimated_cost": "₹0/acre (ESTIMATE)",
                "risk": risk_score,
                "potential_loss": "₹1,200–₹2,200/acre (ESTIMATE)",
                "expected_benefit": "Lower short-term cost but higher uncertainty (ESTIMATE)",
                "reason": "Monitoring is safer only if the field remains stable and weather data remains available.",
                "status": "ESTIMATE",
            },
        }

        if not weather or rainfall == 0:
            scenarios["wait"]["reason"] = "Weather data is unavailable, so the rain-window comparison is only a placeholder estimate."
            scenarios["wait"]["status"] = "DATA_UNAVAILABLE"
        if moisture == 0:
            scenarios["monitor"]["reason"] = "Soil moisture data is unavailable; monitoring remains uncertain until a measurement is captured."
            scenarios["monitor"]["status"] = "DATA_UNAVAILABLE"

        return scenarios

    def recommendation(self, state: Dict[str, Any], risk: Dict[str, Any], decision: Dict[str, Any], economic: Dict[str, Any]) -> Dict[str, Any]:
        soil = state.get("soil") or {}
        weather = state.get("weather") or {}
        health = state.get("health") or {}
        moisture = float(soil.get("moisture_pct", 0))
        rainfall = float(weather.get("rainfall_chance_pct", 0))
        disease_confidence = float(health.get("confidence", 0))

        if decision["decision"] == "WAIT":
            title = "Wait for the rain window to pass"
            action = "Delay foliar interventions until the current rain window has cleared and recheck the field." 
            reason = "Rain risk is elevated, and the treatment window may be reduced by wet foliage."
            timing = "Today to next 24 hours"
        elif moisture < 35:
            title = "Check soil moisture and irrigate carefully"
            action = "Reassess soil moisture before irrigation, then apply a light irrigation only if the soil remains dry."
            reason = "Soil moisture is below target and can limit crop resilience."
            timing = "Today before the next irrigation cycle"
        elif disease_confidence >= 65:
            title = "Inspect lower rows and isolate damaged leaves"
            action = "Inspect affected rows, remove visibly damaged tissue, and keep foliage dry until the next review."
            reason = "Early disease symptoms and plant-health confidence are elevated enough to deserve attention."
            timing = "Today, before midday"
        elif risk["riskScore"] >= 45:
            title = "Inspect the field again in the next 24 hours"
            action = "Walk the crop and compare the affected rows against the previous scouting notes."
            reason = "Risk is moderate and can change quickly with weather, moisture, and pest pressure."
            timing = "Within 24 hours"
        else:
            title = "Continue monitoring"
            action = "Continue routine monitoring and document any change in moisture, pest pressure, or canopy condition."
            reason = "Current conditions are comparatively stable, but changes should still be tracked."
            timing = "Monitor over the next 48 hours"

        evidence = [
            {
                "source": "selected-partition",
                "type": "partition",
                "reference": str(state.get("partition_id") or "partition unavailable"),
                "evidence_text": f"Selected partition context is {state.get('partition_id') or 'unavailable'}.",
                "is_demo": True,
            },
            {
                "source": "weather",
                "type": "weather",
                "reference": f"Rain chance {rainfall}%",
                "evidence_text": "Weather context is included as part of the decision input.",
                "is_demo": True,
            },
            {
                "source": "soil",
                "type": "soil",
                "reference": f"Moisture {moisture}%",
                "evidence_text": "Current soil moisture is used as a decision signal when available.",
                "is_demo": True,
            },
        ]

        return {
            "id": f"rec-{state.get('partition_id') or 'partition'}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            "partitionId": state.get("partition_id"),
            "title": title,
            "action": action,
            "timing": timing,
            "reason": reason,
            "risk": risk.get("riskLevel", "Low"),
            "cost": economic["actionCost"],
            "benefit": economic["estimatedBenefit"],
            "potentialLoss": economic["potentialUntreatedLoss"],
            "evidence": evidence,
            "confidence": risk.get("confidence", "rule-based development logic"),
            "status": risk.get("status", "RULE_BASED"),
            "sourceType": "RULE_BASED",
            "isDemo": True,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "actionCost": economic["actionCost"],
            "estimatedBenefit": economic["estimatedBenefit"],
            "potentialUntreatedLoss": economic["potentialUntreatedLoss"],
            "source": "FarmRakshak decision engine",
        }

    def explanation(self, state: Dict[str, Any], risk: Dict[str, Any], decision: Dict[str, Any], recommendation: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "what": recommendation.get("action"),
            "why": recommendation.get("reason"),
            "when": recommendation.get("timing"),
            "cost": recommendation.get("cost"),
            "benefit": recommendation.get("benefit"),
            "risk": risk.get("riskLevel"),
            "evidence": recommendation.get("evidence", []),
            "confidence": risk.get("confidence", "rule-based development logic"),
            "status": decision.get("status", "RULE_BASED"),
            "source": "FarmRakshak decision intelligence engine",
            "is_demo": True,
            "selected_partition": state.get("partition_id"),
        }

    def decision_payload(self, state: Dict[str, Any]) -> Dict[str, Any]:
        risk = self.compute_risk(state)
        decision = self.choose_decision(state, risk)
        economics = self.economic_context(state, risk)
        recommendation = self.recommendation(state, risk, decision, economics)
        explanation = self.explanation(state, risk, decision, recommendation)
        return {
            "farm_state": state,
            "risk": risk,
            "decision": decision,
            "economic": economics,
            "recommendation": recommendation,
            "explanation": explanation,
            "scenarios": self.scenario_comparison(state, risk),
            "context": self.build_context(state),
        }
