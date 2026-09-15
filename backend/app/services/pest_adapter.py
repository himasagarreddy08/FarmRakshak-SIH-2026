from __future__ import annotations

from typing import Any, Dict, Optional

from app.services.evidence import EvidenceRecord


class PestopiaAdapter:
    """Interface for real pest datasets such as Pestopia and Punjab pest surveys."""

    def analyze(
        self,
        crop: Optional[str] = None,
        pest: Optional[str] = None,
        region: Optional[str] = None,
        occurrence: Optional[float] = None,
        severity: Optional[float] = None,
        threshold: Optional[float] = None,
        source: str = "Pestopia",
        dataset_version: Optional[str] = None,
    ) -> Dict[str, Any]:
        pressure = float(occurrence if occurrence is not None else 0.0)
        severity_score = float(severity if severity is not None else 0.0)
        threshold_value = float(threshold if threshold is not None else 0.5)
        crop_name = crop or "General crop"
        pest_name = pest or "General scouting target"
        status = "Stable" if max(pressure, severity_score) < threshold_value else "Needs attention"
        risk = "Low" if max(pressure, severity_score) < threshold_value else "High" if max(pressure, severity_score) >= 0.8 else "Medium"

        evidence = EvidenceRecord(
            source=source,
            source_type="dataset",
            reference="Pestopia / Cotton Pest Survey Punjab dataset contract",
            dataset_version=dataset_version or "unavailable",
            confidence=None,
            evidence_text="No external pest dataset is present in this repository. The adapter accepts structured pest observations and surfaces a data-unavailable state until a verified dataset is connected.",
            is_demo=True,
        )

        return {
            "crop": crop_name,
            "pest": pest_name,
            "region": region or "unknown",
            "occurrence": pressure,
            "severity": severity_score,
            "threshold": threshold_value,
            "pressure": max(pressure, severity_score) * 100,
            "status": status,
            "risk": risk,
            "source": source,
            "dataset_version": dataset_version or "unavailable",
            "model_status": "MODEL_NOT_AVAILABLE",
            "is_demo": True,
            "evidence": evidence.as_dict(),
            "is_data_unavailable": True,
        }
