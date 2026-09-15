from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass
class EvidenceRecord:
    """Structured evidence metadata for AI, rule, and data-driven outputs.

    The project does not ship trained model artifacts or external datasets, so
    every adapter must explicitly indicate whether the result is real, estimated,
    or development-only output.
    """

    source: str
    source_type: str
    reference: str = ""
    dataset_version: Optional[str] = None
    model_version: Optional[str] = None
    confidence: Optional[float] = None
    evidence_text: str = ""
    is_demo: bool = True

    def as_dict(self) -> Dict[str, Any]:
        return {
            "source": self.source,
            "source_type": self.source_type,
            "reference": self.reference,
            "dataset_version": self.dataset_version,
            "model_version": self.model_version,
            "confidence": self.confidence,
            "evidence_text": self.evidence_text,
            "is_demo": self.is_demo,
        }
