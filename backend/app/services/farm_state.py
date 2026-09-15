from __future__ import annotations

from typing import Any, Dict, List, Optional


class FarmStateService:
    """Multi-farm, partition-aware farm state service with role and geographic scoping."""

    def __init__(self) -> None:
        self._farms: Dict[str, Dict[str, Any]] = {
            "farm-01": {
                "farm_id": "farm-01",
                "name": "Nandgaon Farm",
                "location": "Nandgaon, Nashik District, Maharashtra",
                "coordinates": {"lat": 18.672, "lng": 74.245},
                "farmer_id": "farmer-01",
                "farmer_name": "Ramesh Patil",
                "region": "Nashik",
                "state": "Maharashtra",
                "boundary": [
                    [18.6745, 74.2420],
                    [18.6748, 74.2485],
                    [18.6695, 74.2490],
                    [18.6690, 74.2425],
                ],
                "partitions": {
                    "partition-01": {
                        "partition_id": "partition-01",
                        "name": "East Terrace",
                        "crop": "Tomato",
                        "crop_stage": "Vegetative",
                        "area_acres": 1.8,
                        "boundary": [
                            [18.6725, 74.2455],
                            [18.6748, 74.2485],
                            [18.6710, 74.2490],
                            [18.6700, 74.2460],
                        ],
                        "soil": {
                            "ph": 6.8,
                            "moisture_pct": 42,
                            "nitrogen": 68,
                            "phosphorus": 44,
                            "potassium": 58,
                            "organic_matter_pct": 1.7,
                        },
                        "weather": {
                            "temperature_c": 30,
                            "humidity_pct": 66,
                            "rainfall_chance_pct": 34,
                            "wind_speed_kmh": 14,
                            "condition": "Light cloud cover",
                        },
                        "health": {
                            "health_status": "warning",
                            "disease_name": "Early leaf spot",
                            "confidence": 74,
                            "evidence": "Leaf lesions visible on lower canopy.",
                        },
                        "pest": {
                            "pest_name": "Fruit borer",
                            "pressure": 46,
                            "threshold": 40,
                            "recommended_action": "Inspect traps and scout fruit clusters.",
                        },
                        "risk_score": 41,
                        "risk_level": "Medium",
                        "history": [
                            "Field walk completed yesterday",
                            "Moisture trend is below ideal target",
                        ],
                        "recommendations": [
                            {
                                "what": "Inspect lower leaves and fruit clusters",
                                "why": "Early disease pressure is increasing in the lower canopy.",
                                "when": "Today before 11:00 AM",
                                "action": "Walk rows in zig-zag pattern, remove infected bottom leaves, avoid overhead splash.",
                                "estimated_cost": "₹180/acre",
                                "potential_loss": "₹2,450/acre",
                                "expected_benefit": "₹1,200/acre",
                                "source": "ICAR Tomato Protection Guidelines",
                                "confidence": 82,
                                "is_mock": False,
                            }
                        ],
                    },
                    "partition-02": {
                        "partition_id": "partition-02",
                        "name": "North Block",
                        "crop": "Cotton",
                        "crop_stage": "Flowering",
                        "area_acres": 2.4,
                        "boundary": [
                            [18.6725, 74.2420],
                            [18.6745, 74.2420],
                            [18.6748, 74.2455],
                            [18.6725, 74.2455],
                        ],
                        "soil": {
                            "ph": 6.7,
                            "moisture_pct": 31,
                            "nitrogen": 49,
                            "phosphorus": 37,
                            "potassium": 51,
                            "organic_matter_pct": 1.4,
                        },
                        "weather": {
                            "temperature_c": 29,
                            "humidity_pct": 68,
                            "rainfall_chance_pct": 42,
                            "wind_speed_kmh": 16,
                            "condition": "Cloud cover building",
                        },
                        "health": {
                            "health_status": "warning",
                            "disease_name": "Leaf spot",
                            "confidence": 61,
                            "evidence": "Patchy lesions visible on older leaves.",
                        },
                        "pest": {
                            "pest_name": "Bollworm",
                            "pressure": 58,
                            "threshold": 50,
                            "recommended_action": "Scout flagged plants and avoid unnecessary spray before rain.",
                        },
                        "risk_score": 62,
                        "risk_level": "Medium",
                        "history": [
                            "Rain chance increased over the next 12 hours",
                            "Soil moisture remains below target range",
                        ],
                        "recommendations": [
                            {
                                "what": "Delay foliar spray until the rain window passes",
                                "why": "High humidity and 42% rain chance reduce spray adherence and cause fungicide wash-off.",
                                "when": "Within 24 hours",
                                "action": "Hold off on spraying; inspect drainage channels and check moisture after rain.",
                                "estimated_cost": "₹220/acre",
                                "potential_loss": "₹3,100/acre",
                                "expected_benefit": "₹1,600/acre",
                                "source": "CICR Cotton Agrometeorological Advisory",
                                "confidence": 79,
                                "is_mock": False,
                            }
                        ],
                    },
                    "partition-03": {
                        "partition_id": "partition-03",
                        "name": "Wellside Plot",
                        "crop": "Potato",
                        "crop_stage": "Bulbing",
                        "area_acres": 1.1,
                        "boundary": [
                            [18.6690, 74.2425],
                            [18.6725, 74.2420],
                            [18.6725, 74.2455],
                            [18.6695, 74.2455],
                        ],
                        "soil": {
                            "ph": 6.3,
                            "moisture_pct": 55,
                            "nitrogen": 72,
                            "phosphorus": 58,
                            "potassium": 63,
                            "organic_matter_pct": 1.9,
                        },
                        "weather": {
                            "temperature_c": 26,
                            "humidity_pct": 73,
                            "rainfall_chance_pct": 50,
                            "wind_speed_kmh": 11,
                            "condition": "Humid with mild rain risk",
                        },
                        "health": {
                            "health_status": "healthy",
                            "disease_name": None,
                            "confidence": 86,
                            "evidence": "Canopy is stable and uniformly green.",
                        },
                        "pest": {
                            "pest_name": "Cutworm",
                            "pressure": 32,
                            "threshold": 45,
                            "recommended_action": "Continue standard scouting with no emergency action.",
                        },
                        "risk_score": 28,
                        "risk_level": "Low",
                        "history": [
                            "No major signs of disease in the last scouting round",
                            "Routine monitoring is within expected range",
                        ],
                        "recommendations": [
                            {
                                "what": "Continue normal monitoring",
                                "why": "Current crop state remains stable and soil moisture is optimal.",
                                "when": "This week",
                                "action": "Maintain routine field scouting; no intervention needed.",
                                "estimated_cost": "₹0/acre",
                                "potential_loss": "₹0/acre",
                                "expected_benefit": "Preserve stable tuber bulbing",
                                "source": "CPRI Potato Health Standards",
                                "confidence": 88,
                                "is_mock": False,
                            }
                        ],
                    },
                    "partition-04": {
                        "partition_id": "partition-04",
                        "name": "South Acre",
                        "crop": "Chickpea",
                        "crop_stage": "Vegetative",
                        "area_acres": 1.5,
                        "boundary": [
                            [18.6695, 74.2455],
                            [18.6725, 74.2455],
                            [18.6700, 74.2490],
                            [18.6690, 74.2485],
                        ],
                        "soil": {
                            "ph": 6.5,
                            "moisture_pct": 38,
                            "nitrogen": 55,
                            "phosphorus": 40,
                            "potassium": 50,
                            "organic_matter_pct": 1.5,
                        },
                        "weather": {
                            "temperature_c": 28,
                            "humidity_pct": 60,
                            "rainfall_chance_pct": 20,
                            "wind_speed_kmh": 12,
                            "condition": "Clear sky",
                        },
                        "health": {
                            "health_status": "healthy",
                            "disease_name": None,
                            "confidence": 90,
                            "evidence": "Healthy seedling emergence with no chlorosis.",
                        },
                        "pest": {
                            "pest_name": "Pod borer",
                            "pressure": 15,
                            "threshold": 40,
                            "recommended_action": "Routine observation.",
                        },
                        "risk_score": 18,
                        "risk_level": "Low",
                        "history": [
                            "Sown 3 weeks ago",
                            "Good seedling germination",
                        ],
                        "recommendations": [],
                    },
                },
            },
            "farm-02": {
                "farm_id": "farm-02",
                "name": "Baramati Sugarcane Farm",
                "location": "Baramati, Pune District, Maharashtra",
                "coordinates": {"lat": 18.151, "lng": 74.577},
                "farmer_id": "farmer-02",
                "farmer_name": "Suresh Deshmukh",
                "region": "Pune",
                "state": "Maharashtra",
                "boundary": [
                    [18.1530, 74.5740],
                    [18.1540, 74.5810],
                    [18.1480, 74.5805],
                    [18.1475, 74.5745],
                ],
                "partitions": {
                    "partition-01": {
                        "partition_id": "partition-01",
                        "name": "Canalside Cane",
                        "crop": "Sugarcane",
                        "crop_stage": "Tillering · Day 90",
                        "area_acres": 4.2,
                        "soil": {
                            "ph": 7.1,
                            "moisture_pct": 62,
                            "nitrogen": 85,
                            "phosphorus": 60,
                            "potassium": 90,
                            "organic_matter_pct": 2.1,
                        },
                        "weather": {
                            "temperature_c": 31,
                            "humidity_pct": 58,
                            "rainfall_chance_pct": 15,
                            "wind_speed_kmh": 9,
                            "condition": "Clear sunshine",
                        },
                        "health": {
                            "health_status": "healthy",
                            "disease_name": None,
                            "confidence": 92,
                            "evidence": "Vigorous tillering and dark green canopy.",
                        },
                        "pest": {
                            "pest_name": "Early shoot borer",
                            "pressure": 20,
                            "threshold": 35,
                            "recommended_action": "Monitor pheromone traps.",
                        },
                        "risk_score": 19,
                        "risk_level": "Low",
                        "history": ["Canal irrigation cycle completed 4 days ago"],
                        "recommendations": [],
                    },
                    "partition-02": {
                        "partition_id": "partition-02",
                        "name": "Upper Ridge",
                        "crop": "Soybean",
                        "crop_stage": "Pod Initiation · Day 52",
                        "area_acres": 2.5,
                        "soil": {
                            "ph": 6.9,
                            "moisture_pct": 48,
                            "nitrogen": 62,
                            "phosphorus": 48,
                            "potassium": 55,
                            "organic_matter_pct": 1.6,
                        },
                        "weather": {
                            "temperature_c": 30,
                            "humidity_pct": 60,
                            "rainfall_chance_pct": 22,
                            "wind_speed_kmh": 10,
                            "condition": "Partly cloudy",
                        },
                        "health": {
                            "health_status": "healthy",
                            "disease_name": None,
                            "confidence": 88,
                            "evidence": "Healthy pod formation with balanced node spacing.",
                        },
                        "pest": {
                            "pest_name": "Semilooper",
                            "pressure": 28,
                            "threshold": 40,
                            "recommended_action": "Standard scouting.",
                        },
                        "risk_score": 24,
                        "risk_level": "Low",
                        "history": ["Weeding completed 10 days ago"],
                        "recommendations": [],
                    },
                },
            },
            "demo-farm-01": {
                "farm_id": "demo-farm-01",
                "name": "MPKV Agricultural Learning Center Demo Plot",
                "location": "Rahuri, Ahmednagar District, Maharashtra",
                "coordinates": {"lat": 19.392, "lng": 74.651},
                "institution_id": "inst-01",
                "institution_name": "Mahatma Phule Krishi Vidyapeeth / Agricultural Learning Center",
                "region": "Ahmednagar",
                "state": "Maharashtra",
                "boundary": [
                    [19.3940, 74.6480],
                    [19.3950, 74.6550],
                    [19.3890, 74.6540],
                    [19.3885, 74.6485],
                ],
                "partitions": {
                    "demo-01": {
                        "partition_id": "demo-01",
                        "name": "IPM Demonstration Plot - Tomato",
                        "crop": "Tomato",
                        "crop_stage": "Fruiting · Day 60",
                        "area_acres": 2.0,
                        "soil": {"ph": 6.8, "moisture_pct": 52, "nitrogen": 75, "phosphorus": 55, "potassium": 65, "organic_matter_pct": 2.0},
                        "weather": {"temperature_c": 28, "humidity_pct": 62, "rainfall_chance_pct": 25, "wind_speed_kmh": 12, "condition": "Partly cloudy"},
                        "health": {"health_status": "healthy", "disease_name": None, "confidence": 94, "evidence": "Biological control (Trichoderma) trial plot with zero blight spread."},
                        "pest": {"pest_name": "Fruit borer", "pressure": 12, "threshold": 40, "recommended_action": "Check solar pheromone traps."},
                        "risk_score": 15,
                        "risk_level": "Low",
                        "history": ["Student observation session logged", "Trichoderma bio-agent applied on root zone"],
                        "recommendations": [],
                    },
                    "demo-02": {
                        "demo_id": "demo-02",
                        "partition_id": "demo-02",
                        "name": "Precision Drip Irrigation Bed - Cotton",
                        "crop": "Cotton",
                        "crop_stage": "Boll Formation · Day 75",
                        "area_acres": 2.5,
                        "soil": {"ph": 6.7, "moisture_pct": 45, "nitrogen": 60, "phosphorus": 45, "potassium": 58, "organic_matter_pct": 1.8},
                        "weather": {"temperature_c": 29, "humidity_pct": 65, "rainfall_chance_pct": 30, "wind_speed_kmh": 14, "condition": "Humid"},
                        "health": {"health_status": "healthy", "disease_name": None, "confidence": 91, "evidence": "Uniform boll retention across moisture test quadrants."},
                        "pest": {"pest_name": "Whitefly", "pressure": 22, "threshold": 50, "recommended_action": "Yellow sticky trap count."},
                        "risk_score": 22,
                        "risk_level": "Low",
                        "history": ["Drip fertigation trial active"],
                        "recommendations": [],
                    },
                },
            },
        }

        # Role user mappings
        self._user_scopes = {
            "farmer@farmrakshak.demo": {
                "role": "Farmer",
                "farmer_id": "farmer-01",
                "allowed_farms": ["farm-01"],
            },
            "educator@farmrakshak.demo": {
                "role": "Educator",
                "institution_id": "inst-01",
                "allowed_farms": ["demo-farm-01", "farm-01"],  # Anonymized research access
            },
            "authority@farmrakshak.demo": {
                "role": "Authority",
                "geographic_scope": "Maharashtra",
                "allowed_regions": ["Nashik", "Pune", "Ahmednagar", "Aurangabad", "Solapur"],
                "allowed_farms": ["farm-01", "farm-02", "demo-farm-01"],
            },
            "admin@farmrakshak.demo": {
                "role": "Administrator",
                "global_access": True,
                "allowed_farms": list(self._farms.keys()),
            },
        }

    def check_farm_access(self, username_or_role: Optional[str], farm_id: str, allow_anonymous: bool = False) -> bool:
        if not username_or_role:
            return allow_anonymous

        clean_user = username_or_role.strip().lower()

        # Direct scope lookup
        user_info = self._user_scopes.get(clean_user)
        if user_info:
            if user_info.get("global_access"):
                return True
            return farm_id in user_info.get("allowed_farms", [])

        # Additional user ID handles
        if clean_user in ["farmer-01", "ramesh", "ramesh patil"]:
            return farm_id == "farm-01"
        if clean_user in ["farmer-02", "suresh", "suresh deshmukh"]:
            return farm_id == "farm-02"

        # Role-based fallback checking
        if clean_user in ["administrator", "admin", "system administrator"]:
            return True
        if clean_user in ["authority", "regional agriculture officer"]:
            return farm_id in ["farm-01", "farm-02", "demo-farm-01"]
        if clean_user in ["educator", "dr. ananya sharma"]:
            return farm_id in ["demo-farm-01", "farm-01"]
        if clean_user == "farmer":
            # Farmer role is strictly bound to farm-01 by default unless specific farmer context is given
            return farm_id == "farm-01"

        return False

    def list_farms_for_user(self, username_or_role: Optional[str] = None) -> List[Dict[str, Any]]:
        all_farms = []
        for farm in self._farms.values():
            if self.check_farm_access(username_or_role, farm["farm_id"]):
                all_farms.append({
                    "farm_id": farm["farm_id"],
                    "name": farm["name"],
                    "location": farm["location"],
                    "farmer_id": farm.get("farmer_id"),
                    "farmer_name": farm.get("farmer_name", "Registered Farmer"),
                    "region": farm.get("region", "Maharashtra"),
                    "coordinates": farm.get("coordinates"),
                    "boundary": farm.get("boundary"),
                    "partitions": list(farm["partitions"].keys()),
                })
        return all_farms

    def list_farms(self) -> List[Dict[str, Any]]:
        return self.list_farms_for_user(None)

    def get_farm(self, farm_id: str, username_or_role: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not self.check_farm_access(username_or_role, farm_id):
            return None

        farm = self._farms.get(farm_id)
        if farm is None:
            return None
        return {
            "farm_id": farm["farm_id"],
            "name": farm["name"],
            "location": farm["location"],
            "farmer_id": farm.get("farmer_id"),
            "farmer_name": farm.get("farmer_name"),
            "coordinates": farm.get("coordinates"),
            "boundary": farm.get("boundary"),
            "region": farm.get("region"),
            "partitions": [
                {
                    "partition_id": partition_id,
                    "name": partition["name"],
                    "crop": partition["crop"],
                    "crop_stage": partition["crop_stage"],
                    "area_acres": partition.get("area_acres", 1.5),
                    "boundary": partition.get("boundary"),
                    "risk_score": partition["risk_score"],
                    "risk_level": partition["risk_level"],
                }
                for partition_id, partition in farm["partitions"].items()
            ],
        }

    def list_partitions(self, farm_id: Optional[str] = None) -> List[Dict[str, Any]]:
        farms = [self._farms[farm_id]] if (farm_id and farm_id in self._farms) else list(self._farms.values())
        partitions: List[Dict[str, Any]] = []
        for farm in farms:
            for partition_id, partition in farm["partitions"].items():
                partitions.append({
                    "farm_id": farm["farm_id"],
                    "partition_id": partition_id,
                    "name": partition["name"],
                    "crop": partition["crop"],
                    "crop_stage": partition["crop_stage"],
                    "area_acres": partition.get("area_acres", 1.5),
                    "boundary": partition.get("boundary"),
                    "risk_score": partition["risk_score"],
                    "risk_level": partition["risk_level"],
                })
        return partitions

    def get_partition(self, farm_id: str, partition_id: str) -> Optional[Dict[str, Any]]:
        farm = self._farms.get(farm_id)
        if farm is None:
            return None
        partition = farm["partitions"].get(partition_id)
        if partition is None:
            return None
        return {
            "farm_id": farm_id,
            "partition_id": partition_id,
            "name": partition["name"],
            "crop": partition["crop"],
            "crop_stage": partition["crop_stage"],
            "area_acres": partition.get("area_acres", 1.5),
            "boundary": partition.get("boundary"),
            "soil": partition["soil"],
            "weather": partition["weather"],
            "health": partition["health"],
            "pest": partition["pest"],
            "risk_score": partition["risk_score"],
            "risk_level": partition["risk_level"],
            "history": partition["history"],
            "recommendations": partition["recommendations"],
        }

    def get_farm_state(self, farm_id: str, partition_id: Optional[str] = None) -> Dict[str, Any]:
        farm = self._farms.get(farm_id)
        if farm is None:
            raise ValueError(f"Unknown farm_id: {farm_id}")

        if partition_id is None:
            partition_id = next(iter(farm["partitions"].keys()))

        partition = farm["partitions"].get(partition_id)
        if partition is None:
            raise ValueError(f"Unknown partition_id: {partition_id} for farm_id: {farm_id}")

        return {
            "farm_id": farm_id,
            "partition_id": partition_id,
            "name": partition["name"],
            "crop": partition["crop"],
            "crop_stage": partition["crop_stage"],
            "area_acres": partition.get("area_acres", 1.5),
            "boundary": partition.get("boundary"),
            "farm_coordinates": farm.get("coordinates"),
            "soil": partition["soil"],
            "weather": partition["weather"],
            "health": partition["health"],
            "pest": partition["pest"],
            "risk_score": partition["risk_score"],
            "risk_level": partition["risk_level"],
            "history": partition["history"],
            "recommendations": partition["recommendations"],
            "metadata": {
                "selected_partition": partition_id,
                "multi_crop": True,
                "farm_name": farm["name"],
                "location": farm["location"],
                "source": "FarmRakshak State Service",
            },
        }

    def get_regional_overview(self, region: str = "Maharashtra") -> Dict[str, Any]:
        """Provides aggregated agricultural risk intelligence for Authority users."""
        return {
            "jurisdiction": region,
            "reporting_period": "Current Kharif / Rabi Transition",
            "total_monitored_acres": 142500,
            "registered_farms_count": 3480,
            "crop_distribution": [
                {"crop": "Cotton", "percentage": 34, "risk_level": "Elevated", "key_issue": "Bollworm & Rain Delay"},
                {"crop": "Sugarcane", "percentage": 28, "risk_level": "Stable", "key_issue": "Water Allocation"},
                {"crop": "Tomato", "percentage": 16, "risk_level": "Moderate", "key_issue": "Early Leaf Spot"},
                {"crop": "Soybean", "percentage": 12, "risk_level": "Stable", "key_issue": "Pod Setting"},
                {"crop": "Onion / Potato", "percentage": 10, "risk_level": "Low", "key_issue": "Thrips Monitoring"},
            ],
            "risk_hotspots": [
                {
                    "district": "Nashik",
                    "taluka": "Nandgaon",
                    "coordinates": [18.672, 74.245],
                    "risk_index": 68,
                    "status": "Warning",
                    "primary_threat": "Leaf Spot + Forecast Humidity Spike",
                    "active_farms": 620,
                },
                {
                    "district": "Ahmednagar",
                    "taluka": "Rahuri / Sangamner",
                    "coordinates": [19.392, 74.651],
                    "risk_index": 35,
                    "status": "Moderate",
                    "primary_threat": "Whitefly & Sucking Pests",
                    "active_farms": 840,
                },
                {
                    "district": "Pune",
                    "taluka": "Baramati / Daund",
                    "coordinates": [18.151, 74.577],
                    "risk_index": 22,
                    "status": "Stable",
                    "primary_threat": "Low (Good Soil Moisture Reserve)",
                    "active_farms": 1120,
                },
                {
                    "district": "Aurangabad",
                    "taluka": "Paithan",
                    "coordinates": [19.480, 75.380],
                    "risk_index": 54,
                    "status": "Moderate",
                    "primary_threat": "Dry Spell Stress",
                    "active_farms": 900,
                },
            ],
            "active_interventions": [
                {
                    "id": "alert-mh-01",
                    "title": "Nashik Division Pre-Rain Foliar Advisory",
                    "severity": "high",
                    "advisory": "Advise farmers against applying foliar sprays within 24h of rainfall window to prevent chemical runoff and wastage.",
                    "coverage": "Nashik & Jalgaon Cotton/Tomato Belts",
                },
                {
                    "id": "alert-mh-02",
                    "title": "Drought & Moisture Sensor Alert",
                    "severity": "medium",
                    "advisory": "Maintain night-time drip irrigation schedules in light soils to mitigate evaporative loss.",
                    "coverage": "Marathwada Zone",
                },
            ],
        }

    def get_educator_cases(self) -> List[Dict[str, Any]]:
        """Provides anonymized farm learning cases for Educator / Research users."""
        return [
            {
                "case_id": "case-01",
                "title": "Case Study #1: Early Leaf Spot vs Foliar Timing Under Rain Forecast",
                "crop": "Cotton",
                "stage": "Flowering · Day 44",
                "problem": "Farmer observed leaf spotting and planned foliar fungicide spray during 42% rain forecast.",
                "agronomic_solution": "Delayed spray by 24 hours, conducted field walk, and saved ₹220/acre input waste while protecting ₹3,100/acre yield value.",
                "learning_points": [
                    "Chemical wash-off dynamics when rain occurs within 6 hours of application",
                    "Using disease confidence (61%) with weather risk rather than isolated symptom scoring",
                    "Economic cost-benefit ratio (13.6× return on early scouting vs blind spraying)",
                ],
                "dataset_reference": "Nandgaon Agro-Climatic Zone B",
            },
            {
                "case_id": "case-02",
                "title": "Case Study #2: Drip Irrigation Optimization in High-pH Soil",
                "crop": "Tomato",
                "stage": "Vegetative · Day 29",
                "problem": "Soil moisture dropped to 31% with pH at 6.8. Deep flooding risked root rot under overcast sky.",
                "agronomic_solution": "Recommended pulse drip irrigation of 15mm with acid-buffered bio-fertilizer.",
                "learning_points": [
                    "Distinguishing sensor moisture deficits from atmospheric water demand",
                    "Preventing soil compaction in medium black soils",
                ],
                "dataset_reference": "MPKV Rahuri Demonstration Trial Plot",
            },
            {
                "case_id": "case-03",
                "title": "Case Study #3: Prophylactic Biological Control for Potato Late Blight",
                "crop": "Potato",
                "stage": "Bulbing · Day 52",
                "problem": "High relative humidity (82%) with moderate canopy moisture index during tuber formation.",
                "agronomic_solution": "Applied bio-fungicide Trichoderma viride with strict night sprinkler ban to minimize leaf wetness duration.",
                "learning_points": [
                    "Bio-control timing relative to micro-climate leaf wetness duration",
                    "Tuber quality protection without excessive synthetic chemical residues",
                ],
                "dataset_reference": "Nashik Horticultural Research Station Plot C",
            },
        ]

    def record_partition_event(self, farm_id: str, partition_id: str, event: Dict[str, Any]) -> Dict[str, Any]:
        farm = self._farms.get(farm_id)
        if farm is None:
            raise ValueError(f"Unknown farm_id: {farm_id}")
        partition = farm["partitions"].get(partition_id)
        if partition is None:
            raise ValueError(f"Unknown partition_id: {partition_id} for farm_id: {farm_id}")
        event_entry = {
            "type": event.get("type") or "event",
            "message": event.get("message") or "Field event recorded.",
            "time": event.get("time") or "Just now",
        }
        history = partition.setdefault("history", [])
        history.insert(0, f"{event_entry['type']}: {event_entry['message']}")
        return event_entry
