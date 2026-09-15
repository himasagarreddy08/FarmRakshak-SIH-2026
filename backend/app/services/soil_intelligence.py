from __future__ import annotations

from typing import Any, Dict, Optional

from app.services.soil_adapter import SoilYieldAdapter


class SoilIntelligenceService:
    """Soil and fertilizer intelligence with a separate yield/soil adapter contract."""

    def __init__(self) -> None:
        self._adapter = SoilYieldAdapter()

    def get_soil_summary(self, farm_id: str, partition_id: str, state: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = state or {}
        soil = payload.get("soil") or {
            "ph": 6.7,
            "moisture_pct": 35,
            "nitrogen": 55,
            "phosphorus": 42,
            "potassium": 50,
        }
        result = self._adapter.analyze_soil(
            crop=payload.get("crop") or "General crop",
            crop_stage=payload.get("crop_stage") or "Current stage",
            soil=soil,
            weather=payload.get("weather") or {},
            inputs={"farm_id": farm_id, "partition_id": partition_id},
            source="Crop Yield + Soil + Weather data",
        )

        return {
            "farm_id": farm_id,
            "partition_id": partition_id,
            "crop": result["crop"],
            "crop_stage": result["crop_stage"],
            "soil": result["soil_parameters"],
            "nutrient_status": result["nutrient_status"],
            "summary": result["fertilizer_guidance"],
            "reason": result["reason"],
            "source": result["source"],
            "model_status": result.get("model_status", "MODEL_NOT_AVAILABLE"),
            "evidence": result["evidence"],
            "is_demo": result.get("is_demo", True),
            "is_data_unavailable": result.get("is_data_unavailable", True),
            "is_mock": True,
        }

    def get_fertilizer_guidance(self, farm_id: str, partition_id: str, state: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = state or {}
        soil = payload.get("soil") or {}
        crop = payload.get("crop") or "General crop"
        stage = payload.get("crop_stage") or "Vegetative"
        result = self._adapter.analyze_soil(
            crop=crop,
            crop_stage=stage,
            soil=soil,
            weather=payload.get("weather") or {},
            inputs={"farm_id": farm_id, "partition_id": partition_id},
            source="Crop Yield + Soil + Weather data",
        )

        return {
            "farm_id": farm_id,
            "partition_id": partition_id,
            "crop": crop,
            "crop_stage": stage,
            "fertilizer_guidance": result["fertilizer_guidance"],
            "explanation": result["reason"],
            "source": result["source"],
            "model_status": result.get("model_status", "MODEL_NOT_AVAILABLE"),
            "soil_metrics": soil,
            "evidence": result["evidence"],
            "is_demo": result.get("is_demo", True),
            "is_data_unavailable": result.get("is_data_unavailable", True),
            "is_mock": True,
        }
