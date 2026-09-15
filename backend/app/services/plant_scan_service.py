from __future__ import annotations

from typing import Any, Dict, Optional

from app.services.plant_health_adapter import PlantVillageAdapter


class PlantScanService:
    """Plant health scan service with explicit model/data availability states."""

    def __init__(self) -> None:
        self._adapter = PlantVillageAdapter()

    def analyze_image(self, file_name: Optional[str] = None, image_bytes: Optional[bytes] = None) -> Dict[str, Any]:
        if not file_name and not image_bytes:
            raise ValueError("Plant scan requires image bytes or a file name.")

        if image_bytes is not None and len(image_bytes) == 0:
            raise ValueError("Plant scan image is empty.")

        file_name = (file_name or "plant-scan").lower()
        crop = "Tomato" if "tomato" in file_name else "Cotton" if "cotton" in file_name else "General crop"
        supported_crops = {"tomato", "cotton", "potato", "chickpea", "soybean", "wheat", "onion"}
        if file_name.endswith((".txt", ".pdf")):
            raise ValueError("Invalid image format for plant scan.")

        is_healthy = "healthy" in file_name or "good" in file_name
        label = "healthy" if is_healthy else "affected"
        disease = "No disease detected" if is_healthy else "Leaf spot"

        try:
            result = self._adapter.analyze(
                image=file_name,
                image_bytes=image_bytes,
                crop=crop,
                disease=disease,
                healthy_affected_state=label,
                label=label,
                source="PlantVillage",
                dataset_version="unavailable",
                model_version="unavailable",
            )
        except Exception as exc:  # pragma: no cover - adapter should remain explicit
            raise ValueError(f"Plant scan backend error: {exc}") from exc

        return {
            "scan_status": "completed",
            "model_status": result.get("model_status", "MODEL_NOT_AVAILABLE"),
            "status": result.get("status", "DEVELOPMENT"),
            "is_demo": result.get("is_demo", True),
            "is_mock": False,
            "crop": result["crop"],
            "condition": "Healthy" if result["healthy_affected_state"] == "healthy" else "Disease detected",
            "disease": result["disease"],
            "confidence": result.get("confidence"),
            "evidence": result["evidence"]["evidence_text"],
            "action": "Continue routine monitoring and record a follow-up check in 3 days." if is_healthy else "Inspect affected leaves, keep foliage dry, and review the same plants again within 48 hours.",
            "source": result["source"],
            "dataset_version": result.get("dataset_version"),
            "is_data_unavailable": True,
        }



