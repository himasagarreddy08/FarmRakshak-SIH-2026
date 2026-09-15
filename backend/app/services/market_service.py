from __future__ import annotations

from typing import Any, Dict


class MarketService:
    """Development-only market snapshot adapter."""

    def get_snapshot(self, crop: str = "Cotton") -> Dict[str, Any]:
        crop_name = (crop or "Cotton").title()
        return {
            "crop": crop_name,
            "market_price_per_quintal": 5200,
            "trend": "Stable to slightly improving",
            "source": "development adapter",
            "is_mock": True,
            "notes": "No external mandi feed is configured in this repository.",
        }
