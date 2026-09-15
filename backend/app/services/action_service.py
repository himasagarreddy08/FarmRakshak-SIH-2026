from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.services.farm_state import FarmStateService


class RecommendationActionService:
    """Simple in-memory action loop for recommendations and follow-up tracking."""

    def __init__(self) -> None:
        self._recommendations: Dict[str, Dict[str, Any]] = {}
        self._actions: Dict[str, Dict[str, Any]] = {}
        self._feedback: Dict[str, Dict[str, Any]] = {}
        self._farm_state_service = FarmStateService()

    @staticmethod
    def _utc_now() -> str:
        return datetime.now(timezone.utc).isoformat()

    def create_recommendation(self, farm_id: str, partition_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        recommendation_id = str(payload.get("id") or f"rec-{farm_id}-{partition_id}-{len(self._recommendations) + 1}")
        recommendation = {
            "id": recommendation_id,
            "farmId": farm_id,
            "partitionId": partition_id,
            "title": payload.get("title") or "Review field condition",
            "action": payload.get("action") or "Review the field",
            "reason": payload.get("reason") or "Field conditions require review.",
            "timing": payload.get("timing") or "24h",
            "risk": payload.get("risk") or "Medium",
            "cost": payload.get("cost") or "₹0/acre",
            "benefit": payload.get("benefit") or "₹0/acre",
            "potentialLoss": payload.get("potentialLoss") or "₹0/acre",
            "evidence": payload.get("evidence") or [],
            "status": payload.get("status") or "PROPOSED",
            "createdAt": payload.get("createdAt") or self._utc_now(),
            "updatedAt": self._utc_now(),
        }
        self._recommendations[recommendation_id] = recommendation
        self._farm_state_service.record_partition_event(farm_id, partition_id, {
            "type": "recommendation_created",
            "message": f"Recommendation {recommendation_id} created for {partition_id}.",
            "time": self._utc_now(),
        })
        return recommendation

    def list_recommendations(self, farm_id: Optional[str] = None, partition_id: Optional[str] = None) -> List[Dict[str, Any]]:
        recommendations = list(self._recommendations.values())
        if farm_id is not None:
            recommendations = [item for item in recommendations if item.get("farmId") == farm_id]
        if partition_id is not None:
            recommendations = [item for item in recommendations if item.get("partitionId") == partition_id]
        return sorted(recommendations, key=lambda item: item.get("createdAt", ""), reverse=True)

    def get_recommendation(self, recommendation_id: str) -> Optional[Dict[str, Any]]:
        return self._recommendations.get(recommendation_id)

    def apply_action(self, recommendation_id: str, farm_id: str, partition_id: str, note: str = "") -> Dict[str, Any]:
        recommendation = self._recommendations.get(recommendation_id)
        if recommendation is None:
            raise KeyError(f"Recommendation {recommendation_id} not found")

        recommendation["status"] = "APPLIED"
        recommendation["updatedAt"] = self._utc_now()
        recommendation["lastActionNote"] = note or "Farmer action recorded."
        recommendation["followUpDue"] = "24h" if "24" in str(recommendation.get("timing", "")).lower() else "48h"
        recommendation["followUpState"] = "FOLLOW_UP_REQUIRED"

        action_record = {
            "id": f"act-{recommendation_id}",
            "recommendationId": recommendation_id,
            "farmId": farm_id,
            "partitionId": partition_id,
            "status": "APPLIED",
            "actionTaken": recommendation.get("action"),
            "note": note or "Farmer action recorded.",
            "timestamp": self._utc_now(),
        }
        self._actions[recommendation_id] = action_record

        self._farm_state_service.record_partition_event(farm_id, partition_id, {
            "type": "action_applied",
            "message": f"Action recorded for {recommendation.get('title', 'recommendation')}.",
            "time": self._utc_now(),
        })
        return recommendation

    def record_feedback(self, recommendation_id: str, farm_id: str, partition_id: str, feedback: Dict[str, Any]) -> Dict[str, Any]:
        recommendation = self._recommendations.get(recommendation_id)
        if recommendation is None:
            raise KeyError(f"Recommendation {recommendation_id} not found")

        observation = str(feedback.get("observation") or "").strip()
        result_status = str(feedback.get("resultStatus") or ("AWAITING_OBSERVATION" if not observation else "OBSERVED")).upper()
        payload = {
            "id": f"fb-{recommendation_id}",
            "recommendationId": recommendation_id,
            "farmId": farm_id,
            "partitionId": partition_id,
            "actionTaken": feedback.get("actionTaken"),
            "date": feedback.get("date") or self._utc_now(),
            "observation": observation,
            "farmerFeedback": feedback.get("farmerFeedback"),
            "resultStatus": result_status,
            "createdAt": self._utc_now(),
        }
        self._feedback[recommendation_id] = payload

        if result_status == "AWAITING_OBSERVATION":
            recommendation["status"] = "FOLLOW_UP_REQUIRED"
        else:
            recommendation["status"] = "COMPLETED"
        recommendation["updatedAt"] = self._utc_now()

        self._farm_state_service.record_partition_event(farm_id, partition_id, {
            "type": "feedback_recorded",
            "message": f"Feedback recorded for recommendation {recommendation_id}.",
            "time": self._utc_now(),
        })
        return payload

    def plan_action(self, recommendation_id: str, farm_id: str, partition_id: str) -> Dict[str, Any]:
        recommendation = self._recommendations.get(recommendation_id)
        if recommendation is None:
            raise KeyError(f"Recommendation {recommendation_id} not found")
        recommendation["status"] = "PLANNED"
        recommendation["updatedAt"] = self._utc_now()
        return recommendation
