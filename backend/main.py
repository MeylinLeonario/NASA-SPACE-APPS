from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from pathlib import Path
import json
import math

app = FastAPI(
    title="PyraScope NASA Space Apps API",
    description="Backend de motores físicos y Mission-Matcher (Motor 1) para seguridad contra incendios en espacio profundo.",
    version="1.0.0"
)

# Configurar CORS para permitir peticiones desde Next.js (http://localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],  # Permite POST, GET, OPTIONS, etc.
    allow_headers=["*"],
)

# Cargar base de datos al iniciar el servidor
ROOT_DIR = Path(__file__).resolve().parent.parent
db_path = ROOT_DIR / "investigations_enriched.json"

if not db_path.exists():
    # Fallback por si el archivo está local
    db_path = Path("investigations_enriched.json")

if db_path.exists():
    with open(db_path, "r", encoding="utf-8") as f:
        db_data = json.load(f)
        INVESTIGATIONS_DB = db_data.get("investigations", [])
else:
    INVESTIGATIONS_DB = []

# Dominios físicos oficiales para normalización
PHYSICAL_DOMAINS: Dict[str, Dict[str, Any]] = {
    "o2": {"min": 10.0, "max": 100.0, "weight": 0.35, "unit": "% molar O2"},
    "pressure": {"min": 20.0, "max": 304.0, "weight": 0.20, "unit": "kPa"},
    "flow": {"min": 0.0, "max": 55.0, "weight": 0.30, "unit": "cm/s"},
    "gravity": {"min": 0.0, "max": 1.0, "weight": 0.15, "unit": "g"}
}

# Modelo de Pydantic para recibir las condiciones de la atmósfera desde el frontend
class HabitatConditions(BaseModel):
    o2: float = Field(..., description="Concentración de O2 (%)", example=30.0)
    pressure_psi: float = Field(..., description="Presión de cabina en PSI", example=10.2)
    flow: float = Field(..., description="Flujo de ventilación en cm/s", example=10.0)
    gravity: float = Field(..., description="Nivel de gravedad en g", example=0.167)
    selected_pillar: Optional[str] = Field(None, description="Pilar de seguridad seleccionado (prevencion, deteccion, supresion)")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "PyraScope API Engine 1",
        "total_investigations": len(INVESTIGATIONS_DB)
    }

@app.post("/api/motor1/match-missions")
def match_missions(conditions: HabitatConditions):
    """
    MOTOR 1 (Mission-Matcher):
    Recibe las condiciones actuales de la atmósfera (O2, Presión PSI convertida a kPa, Flujo, Gravedad)
    y retorna el ranking ordenado de investigaciones espaciales de la NASA con sus puntajes y desgloses.
    """
    # Convertir PSI a kPa para estandarizar con el motor físico (1 psi ≈ 6.89476 kPa)
    pressure_kpa = conditions.pressure_psi * 6.89476

    weights = {k: v["weight"] for k, v in PHYSICAL_DOMAINS.items()}
    t_o2 = conditions.o2
    t_pressure = pressure_kpa
    t_flow = conditions.flow
    t_gravity = conditions.gravity

    results = []

    for inv in INVESTIGATIONS_DB:
        inv_o2 = inv.get("o2") or {}
        inv_pres = inv.get("pressure") or {}
        inv_flow = inv.get("flow") or {}

        # 1. Distancia de Oxígeno
        o2_min, o2_max = inv_o2.get("min"), inv_o2.get("max")
        if o2_min is not None and o2_max is not None:
            if o2_min <= t_o2 <= o2_max:
                dist_o2_norm = 0.0
                match_o2_pct = 100.0
            else:
                d = min(abs(t_o2 - o2_min), abs(t_o2 - o2_max))
                rng = PHYSICAL_DOMAINS["o2"]["max"] - PHYSICAL_DOMAINS["o2"]["min"]
                dist_o2_norm = d / rng
                match_o2_pct = max(0.0, 100.0 * (1.0 - dist_o2_norm))
        else:
            dist_o2_norm = 0.5
            match_o2_pct = 50.0

        # 2. Distancia de Presión (en kPa)
        p_min, p_max = inv_pres.get("min"), inv_pres.get("max")
        if p_min is not None and p_max is not None:
            if p_min <= t_pressure <= p_max:
                dist_p_norm = 0.0
                match_p_pct = 100.0
            else:
                d = min(abs(t_pressure - p_min), abs(t_pressure - p_max))
                rng = PHYSICAL_DOMAINS["pressure"]["max"] - PHYSICAL_DOMAINS["pressure"]["min"]
                dist_p_norm = d / rng
                match_p_pct = max(0.0, 100.0 * (1.0 - dist_p_norm))
        else:
            dist_p_norm = 0.5
            match_p_pct = 50.0

        # 3. Distancia de Flujo de aire
        f_min, f_max = inv_flow.get("min"), inv_flow.get("max")
        if f_min is not None and f_max is not None:
            if f_min <= t_flow <= f_max:
                dist_f_norm = 0.0
                match_f_pct = 100.0
            else:
                d = min(abs(t_flow - f_min), abs(t_flow - f_max))
                rng = PHYSICAL_DOMAINS["flow"]["max"] - PHYSICAL_DOMAINS["flow"]["min"]
                dist_f_norm = d / rng
                match_f_pct = max(0.0, 100.0 * (1.0 - dist_f_norm))
        else:
            dist_f_norm = 0.5
            match_f_pct = 50.0

        # 4. Distancia de Gravedad
        emulated_g = inv.get("emulated_gravity_g")
        g_val = inv.get("gravity", 0.0)
        if isinstance(emulated_g, dict) and emulated_g.get("representative") is not None:
            g_eff = emulated_g["representative"]
        else:
            g_eff = g_val if g_val is not None else 0.0

        rng_g = PHYSICAL_DOMAINS["gravity"]["max"] - PHYSICAL_DOMAINS["gravity"]["min"]
        dist_g_norm = abs(t_gravity - g_eff) / rng_g
        match_g_pct = max(0.0, 100.0 * (1.0 - dist_g_norm))

        # Distancia Euclidiana Ponderada
        weighted_sum_sq = (
            weights["o2"] * (dist_o2_norm ** 2) +
            weights["pressure"] * (dist_p_norm ** 2) +
            weights["flow"] * (dist_f_norm ** 2) +
            weights["gravity"] * (dist_g_norm ** 2)
        )
        weighted_euclidean_dist = math.sqrt(weighted_sum_sq)

        # Relevancia con decaimiento exponencial
        k_decay = 2.5
        relevance_raw = 100.0 * math.exp(-k_decay * weighted_euclidean_dist)

        # Bonificación por Pilar de Seguridad
        pillar_bonus = 1.0
        inv_pillars = [p.lower() for p in inv.get("pillars", [])]
        if conditions.selected_pillar and conditions.selected_pillar != "all":
            if conditions.selected_pillar.lower() in inv_pillars:
                pillar_bonus = 1.15
            else:
                pillar_bonus = 0.85

        final_score = round(min(100.0, max(0.0, relevance_raw * pillar_bonus)), 1)

        results.append({
            "investigation_id": inv.get("id"),
            "acronym": inv.get("acronym"),
            "name": inv.get("name"),
            "platform": inv.get("platform"),
            "facility": inv.get("facility"),
            "relevance_score": final_score,
            "match_breakdown": {
                "o2_match_pct": round(match_o2_pct, 1),
                "pressure_match_pct": round(match_p_pct, 1),
                "flow_match_pct": round(match_f_pct, 1),
                "gravity_match_pct": round(match_g_pct, 1)
            },
            "pillars": inv.get("pillars", []),
            "finding": inv.get("key_finding", {}),
            "si_watermark": "SI-Generated Mission Ranking | Grounded in NASA PSI"
        })

    results.sort(key=lambda x: x["relevance_score"], reverse=True)
    return {
        "status": "success",
        "target_conditions": conditions.dict(),
        "ranking": results
    }