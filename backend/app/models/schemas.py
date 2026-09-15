from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class SoilData(BaseModel):
    ph: float
    moisture_pct: float
    nitrogen: float
    phosphorus: float
    potassium: float
    organic_matter_pct: Optional[float] = None


class WeatherData(BaseModel):
    temperature_c: float
    humidity_pct: float
    rainfall_chance_pct: float
    wind_speed_kmh: float
    condition: str


class CropStageData(BaseModel):
    crop: str
    stage: str
    stage_code: Optional[str] = None
    days_since_planting: Optional[int] = None


class PlantHealthData(BaseModel):
    health_status: Literal["healthy", "warning", "at_risk", "disease_detected"]
    disease_name: Optional[str] = None
    confidence: float = Field(ge=0, le=100)
    evidence: Optional[str] = None


class PestRiskData(BaseModel):
    pest_name: Optional[str] = None
    pressure: float = Field(ge=0, le=100)
    threshold: Optional[float] = None
    recommended_action: Optional[str] = None


class RecommendationEvidence(BaseModel):
    source: str
    confidence: float = Field(ge=0, le=100)
    note: Optional[str] = None


class RecommendationData(BaseModel):
    what: str
    why: str
    when: str
    expected_effect: str
    estimated_cost: str
    potential_loss: str
    expected_benefit: str
    source: str
    confidence: float = Field(ge=0, le=100)
    is_mock: bool = True


class PartitionState(BaseModel):
    partition_id: str
    name: str
    crop: str
    crop_stage: str
    soil: SoilData
    weather: WeatherData
    health: PlantHealthData
    pest: PestRiskData
    risk_score: int = Field(ge=0, le=100)
    risk_level: Literal["Low", "Medium", "High"]
    recommendations: List[RecommendationData] = []
    history: List[str] = []


class FarmModel(BaseModel):
    farm_id: str
    name: str
    location: str
    farmer_id: str
    partitions: List[PartitionState]


class FarmStateResponse(BaseModel):
    farm_id: str
    partition_id: str
    crop: str
    crop_stage: str
    soil: Dict[str, Any]
    weather: Dict[str, Any]
    health: Dict[str, Any]
    pest: Dict[str, Any]
    risk_score: int
    risk_level: str
    history: List[str]
    metadata: Dict[str, Any]
