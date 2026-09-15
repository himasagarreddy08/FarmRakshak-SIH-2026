from __future__ import annotations

from typing import Any, Dict, Optional

from app.services.pest_adapter import PestopiaAdapter


class PestIntelligenceService:
    """Pest intelligence service backed by a dataset/model adapter contract."""

    def __init__(self) -> None:
        self._adapter = PestopiaAdapter()

    def analyze(self, farm_id: str, partition_id: str, state: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = state or {}
        pest = payload.get("pest") or {}
        pressure = float(pest.get("pressure", 0.35))
        threshold = float(pest.get("threshold", 0.4))
        crop = payload.get("crop") or "General crop"
        pest_name = pest.get("pest_name") or pest.get("pest") or "General scouting target"
        region = payload.get("location") or payload.get("region") or "unknown"

        result = self._adapter.analyze(
            crop=crop,
            pest=pest_name,
            region=region,
            occurrence=pressure / 100,
            severity=max(pressure, 0.0) / 100,
            threshold=threshold / 100,
            source="Pestopia",
            dataset_version="unavailable",
        )

        return {
            "farm_id": farm_id,
            "partition_id": partition_id,
            "pest_name": result["pest"],
            "pressure": result["pressure"],
            "threshold": result["threshold"] * 100,
            "status": result["status"],
            "risk": result["risk"],
            "recommended_action": pest.get("recommended_action", "Continue routine scouting."),
            "source": result["source"],
            "dataset_version": result.get("dataset_version"),
            "model_status": result.get("model_status", "MODEL_NOT_AVAILABLE"),
            "evidence": result["evidence"],
            "is_demo": result.get("is_demo", True),
            "is_data_unavailable": result.get("is_data_unavailable", True),
            "is_mock": True,
        }
