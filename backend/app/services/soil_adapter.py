from __future__ import annotations

from typing import Any, Dict, Optional

from app.services.evidence import EvidenceRecord


class SoilYieldAdapter:
    """Separate contract for soil health and agricultural yield data."""

    def analyze_soil(
        self,
        crop: Optional[str] = None,
        crop_stage: Optional[str] = None,
        soil: Optional[Dict[str, Any]] = None,
        weather: Optional[Dict[str, Any]] = None,
        inputs: Optional[Dict[str, Any]] = None,
        source: str = "Crop Yield + Soil + Weather data",
    ) -> Dict[str, Any]:
        soil_payload = soil or {}
        weather_payload = weather or {}
        inputs_payload = inputs or {}
        nitrogen = float(soil_payload.get("nitrogen", 0))
        phosphorus = float(soil_payload.get("phosphorus", 0))
        potassium = float(soil_payload.get("potassium", 0))
        moisture = float(soil_payload.get("moisture_pct", 0))

        if nitrogen < 45 or moisture < 35:
            nutrient_status = "Low to moderate"
            fertilizer_guidance = "Review nutrient supply and avoid over-application until the soil moisture and nutrient status are confirmed."
        else:
            nutrient_status = "Balanced to moderate"
            fertilizer_guidance = "Maintain current nutrient plan and keep irrigation and nutrient applications aligned with crop stage."

        evidence = EvidenceRecord(
            source=source,
            source_type="dataset",
            reference="Crop yield + soil + weather data contract",
            dataset_version="unavailable",
            confidence=None,
            evidence_text="No verified soil or yield dataset is included in this repository. The adapter keeps soil and yield inputs separate so real data can be plugged in without mixing contracts.",
            is_demo=True,
        )

        return {
            "crop": crop or "General crop",
            "crop_stage": crop_stage or "Current stage",
            "soil_parameters": soil_payload,
            "N": nitrogen,
            "P": phosphorus,
            "K": potassium,
            "weather": weather_payload,
            "agricultural_inputs": inputs_payload,
            "nutrient_status": nutrient_status,
            "fertilizer_guidance": fertilizer_guidance,
            "reason": "The recommendation is explainable and derived from soil moisture, core nutrient levels, and crop stage context.",
            "source": source,
            "model_status": "MODEL_NOT_AVAILABLE",
            "is_demo": True,
            "evidence": evidence.as_dict(),
            "is_data_unavailable": True,
        }
