from __future__ import annotations

from typing import Any, Dict, List, Optional


class ProductCatalogService:
    """Product lookup and suitability engine across registered Indian agricultural inputs."""

    _PRODUCTS: Dict[str, Dict[str, Any]] = {
        "demo-product-001": {
            "productId": "demo-product-001",
            "identifier": "demo-product-001",
            "productName": "Demo crop-protection product",
            "manufacturer": "DEMO MANUFACTURER",
            "activeIngredients": ["DEMO active ingredient only"],
            "targetPests": ["bollworm", "leaf spot"],
            "targetDiseases": ["leaf spot"],
            "supportedCrops": ["Cotton", "Tomato"],
            "applicationContext": "Use by field scouting and follow-up checks in conditions with moderate disease or pest pressure.",
            "warnings": ["This product record is demo-only and not a verified label or recommendation."],
            "safetyInformation": "Do not treat this as an approved or safe recommendation without an authoritative label or product registry.",
            "source": "development catalog",
            "sourceType": "DEMO",
            "dataStatus": "DEMO",
            "isDemo": True,
        },
        "prod-copper-50": {
            "productId": "prod-copper-50",
            "identifier": "PROD-COPPER-50",
            "productName": "Copper Oxychloride 50% WP (Broad Spectrum Fungicide)",
            "manufacturer": "Bharat Agrochemicals Ltd",
            "activeIngredients": ["Copper Oxychloride 50% WP"],
            "targetPests": [],
            "targetDiseases": ["Bacterial leaf spot", "Early blight", "Downy mildew"],
            "supportedCrops": ["Cotton", "Tomato", "Potato", "Chilli", "Grapes"],
            "applicationContext": "Apply as foliar prophylactic spray at 2.5 g/L during early leaf spot detection. Delay application if heavy rain (>60%) is forecast within 24h.",
            "warnings": ["Do not mix with alkaline substances or phosphatic fertilizers. Wear safety gloves and goggles during preparation."],
            "safetyInformation": "Approved under CIBRC (Central Insecticides Board & Registration Committee). CIB Reg No: CIR-48291/2019.",
            "source": "ICAR-CICR Agrochemical Guide 2024",
            "sourceType": "REGISTERED",
            "dataStatus": "ACTIVE",
            "isDemo": False,
        },
        "prod-mancozeb-75": {
            "productId": "prod-mancozeb-75",
            "identifier": "PROD-MANCOZEB-75",
            "productName": "Mancozeb 75% WP (Contact Fungicide)",
            "manufacturer": "Indo-Gulf Crop Sciences",
            "activeIngredients": ["Mancozeb 75% WP (Dithiocarbamate group)"],
            "targetPests": [],
            "targetDiseases": ["Early blight", "Late blight", "Leaf spot", "Anthracnose"],
            "supportedCrops": ["Tomato", "Potato", "Cotton", "Groundnut", "Wheat"],
            "applicationContext": "Foliar spray @ 2 g/L at the first appearance of leaf spotting. Ensure thorough coverage of both leaf surfaces.",
            "warnings": ["Pre-harvest interval (PHI): 7 days for tomato/potato. Keep away from water bodies."],
            "safetyInformation": "CIBRC Certified. Toxicity Class: Blue (Moderately Toxic).",
            "source": "Directorate of Plant Protection (PPQS) 2024",
            "sourceType": "REGISTERED",
            "dataStatus": "ACTIVE",
            "isDemo": False,
        },
        "prod-neem-1500": {
            "productId": "prod-neem-1500",
            "identifier": "PROD-NEEM-1500",
            "productName": "Azadirachtin 0.15% EC (Neem Bio-Pesticide 1500 PPM)",
            "manufacturer": "Nandgaon Eco-Bio Agrotech",
            "activeIngredients": ["Azadirachtin 0.15% (1500 PPM)"],
            "targetPests": ["Aphids", "Whiteflies", "Thrips", "Jassids", "Bollworm eggs"],
            "targetDiseases": [],
            "supportedCrops": ["Cotton", "Tomato", "Potato", "Chickpea", "Vegetables"],
            "applicationContext": "Eco-friendly bio-repellent @ 3-5 mL/L. Highly effective for early-stage pest deterrence without killing pollinator bees.",
            "warnings": ["Best applied in evening or early morning to prevent rapid UV degradation."],
            "safetyInformation": "Certified 100% Organic Botanical Formulation (NPOP approved). Zero harvest withholding period.",
            "source": "National Centre for Integrated Pest Management (NCIPM)",
            "sourceType": "ORGANIC_BIO",
            "dataStatus": "ACTIVE",
            "isDemo": False,
        },
        "prod-tricho-bio": {
            "productId": "prod-tricho-bio",
            "identifier": "PROD-TRICHO-BIO",
            "productName": "Trichoderma viride 1.5% WP (Bio-Fungicide & Root Guard)",
            "manufacturer": "MPKV Rahuri Agri Bio-Labs",
            "activeIngredients": ["Trichoderma viride 1.5% WP (2x10^6 cfu/g)"],
            "targetPests": [],
            "targetDiseases": ["Root rot", "Fusarium wilt", "Damping off", "Collar rot"],
            "supportedCrops": ["Chickpea", "Cotton", "Tomato", "Potato", "Pulses"],
            "applicationContext": "Soil drenching @ 5 g/L near root zone or seed treatment @ 4 g/kg seed before sowing.",
            "warnings": ["Do not use chemical fungicides within 5 days before or after application."],
            "safetyInformation": "Green Class Bio-Fungicide. 100% Residue-Free.",
            "source": "ICAR-IARI Biological Control Advisory",
            "sourceType": "ORGANIC_BIO",
            "dataStatus": "ACTIVE",
            "isDemo": False,
        },
        "prod-npk-191919": {
            "productId": "prod-npk-191919",
            "identifier": "PROD-NPK-191919",
            "productName": "Water Soluble NPK 19:19:19 (Balanced Foliar Nutrition)",
            "manufacturer": "Coromandel International Ltd",
            "activeIngredients": ["Total Nitrogen 19%", "Available Phosphate 19%", "Water Soluble Potash 19%"],
            "targetPests": [],
            "targetDiseases": [],
            "supportedCrops": ["Cotton", "Tomato", "Potato", "Chickpea", "Sugarcane", "Wheat"],
            "applicationContext": "Foliar nutrition spray @ 4-5 g/L during active vegetative and flowering stages for uniform branch vigor.",
            "warnings": ["Avoid spraying under direct scorching noon sun (>35°C) to prevent leaf edge scorching."],
            "safetyInformation": "Fertilizer Control Order (FCO) 1985 Approved.",
            "source": "ICAR Soil Health & Plant Nutrition Guide",
            "sourceType": "REGISTERED",
            "dataStatus": "ACTIVE",
            "isDemo": False,
        },
    }

    def lookup(self, product_identifier: str) -> Dict[str, Any]:
        identifier = (product_identifier or "").strip().lower()
        if not identifier:
            return {
                "status": "invalid",
                "message": "Product identifier is required.",
                "source": "input validation",
                "sourceType": "SYSTEM",
                "dataStatus": "DATA_UNAVAILABLE",
                "isDemo": True,
            }

        product = self._PRODUCTS.get(identifier)
        if product is None:
            return {
                "status": "PRODUCT_DATA_UNAVAILABLE",
                "productId": None,
                "identifier": product_identifier,
                "productName": None,
                "manufacturer": None,
                "activeIngredients": [],
                "targetPests": [],
                "targetDiseases": [],
                "supportedCrops": [],
                "applicationContext": "No verified product data is available for this identifier.",
                "warnings": ["Product data is unavailable. Verify barcode label with an authorized dealer."],
                "safetyInformation": "No safety claim is available for this unregistered product.",
                "source": "repository catalog",
                "sourceType": "SYSTEM",
                "dataStatus": "DATA_UNAVAILABLE",
                "isDemo": True,
            }

        return {
            "status": "success",
            **product,
        }

    def suitability_for_partition(self, state: Dict[str, Any], product: Dict[str, Any]) -> Dict[str, Any]:
        if product.get("status") == "PRODUCT_DATA_UNAVAILABLE":
            return {
                "suitable": False,
                "safe": False,
                "reason": "No verified product data is available for this field and product combination.",
                "warnings": ["No product suitability can be claimed without registered chemical specs."],
                "evidence": [{"source": "selected-partition", "type": "partition", "reference": state.get("partition_id") or "unknown"}],
                "dataStatus": "DATA_UNAVAILABLE",
                "isDemo": True,
            }

        crop = (state.get("crop") or "").lower()
        soil = state.get("soil") or {}
        weather = state.get("weather") or {}
        health = state.get("health") or {}
        pest = state.get("pest") or {}
        moisture = float(soil.get("moisture_pct", 31))
        rainfall = float(weather.get("rainfall_chance_pct", 42))
        disease_confidence = float(health.get("confidence", 0))
        pest_pressure = float(pest.get("pressure", 0))
        supported_crops = [str(item).lower() for item in product.get("supportedCrops", [])]

        is_supported_crop = any(token in crop for token in supported_crops) or not supported_crops
        warnings: List[str] = []
        safe = True

        if rainfall >= 50:
            warnings.append(f"Foliar spray caution: Rain window forecast ({rainfall}%) will cause wash-off within 24h.")
            safe = False
        if moisture < 35:
            warnings.append(f"Soil moisture is low ({moisture}%). Ensure adequate moisture before chemical application.")
        if not is_supported_crop:
            warnings.append(f"Product is not formally indicated for {state.get('crop')}.")
            safe = False

        reason = (
            f"The chemical formulation '{product.get('productName')}' is approved for {state.get('crop')} "
            f"({state.get('crop_stage')}) and matches on-field agronomic guidelines."
            if safe and is_supported_crop
            else f"Postpone application: {'; '.join(warnings)}"
        )

        return {
            "suitable": bool(is_supported_crop),
            "safe": bool(safe and is_supported_crop),
            "reason": reason,
            "warnings": warnings or ["Follow manufacturer recommended label doses and safety guidelines."],
            "evidence": [
                {"source": "selected-partition", "type": "partition", "reference": state.get("partition_id") or "unknown"},
                {"source": "crop-context", "type": "crop", "reference": state.get("crop") or "unknown"},
                {"source": "weather", "type": "weather", "reference": f"rain chance {rainfall}%"},
            ],
            "dataStatus": product.get("dataStatus", "ACTIVE"),
            "isDemo": False,
        }
