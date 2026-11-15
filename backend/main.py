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
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar base de datos al iniciar el servidor
ROOT_DIR = Path(__file__).resolve().parent.parent
db_path = ROOT_DIR / "investigations_enriched.json"

if not db_path.exists():
    db_path = Path("investigations_enriched.json")

if db_path.exists():
    with open(db_path, "r", encoding="utf-8") as f:
        db_data = json.load(f)
        INVESTIGATIONS_DB = db_data.get("investigations", [])
else:
    INVESTIGATIONS_DB = []

# Ruta para las corridas experimentales del Motor 2 (Supabase / local json)
OBS_DATA_PATH = ROOT_DIR / "data" / "combustion-observations.json"
if not OBS_DATA_PATH.exists():
    OBS_DATA_PATH = Path("combustion-observations.json")

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
    selected_pillar: Optional[str] = Field(None, description="Pilar de seguridad seleccionado")

class DangerMapRequest(BaseModel):
    fuel: str = "PMMA"
    o2: float = 30.0
    pressure_psi: float = 10.2
    airflow_cm_s: float = 10.0
    gravity_g: float = 0.167
    investigation_acronym: Optional[str] = None

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "PyraScope API Engine 1 & 2",
        "total_investigations": len(INVESTIGATIONS_DB)
    }

@app.post("/api/motor1/match-missions")
def match_missions(conditions: HabitatConditions):
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

        o2_min, o2_max = inv_o2.get("min"), inv_o2.get("max")
        if o2_min is not None and o2_max is not None:
            if o2_min <= t_o2 <= o2_max:
                dist_o2_norm, match_o2_pct = 0.0, 100.0
            else:
                d = min(abs(t_o2 - o2_min), abs(t_o2 - o2_max))
                dist_o2_norm = d / (PHYSICAL_DOMAINS["o2"]["max"] - PHYSICAL_DOMAINS["o2"]["min"])
                match_o2_pct = max(0.0, 100.0 * (1.0 - dist_o2_norm))
        else:
            dist_o2_norm, match_o2_pct = 0.5, 50.0

        p_min, p_max = inv_pres.get("min"), inv_pres.get("max")
        if p_min is not None and p_max is not None:
            if p_min <= t_pressure <= p_max:
                dist_p_norm, match_p_pct = 0.0, 100.0
            else:
                d = min(abs(t_pressure - p_min), abs(t_pressure - p_max))
                dist_p_norm = d / (PHYSICAL_DOMAINS["pressure"]["max"] - PHYSICAL_DOMAINS["pressure"]["min"])
                match_p_pct = max(0.0, 100.0 * (1.0 - dist_p_norm))
        else:
            dist_p_norm, match_p_pct = 0.5, 50.0

        f_min, f_max = inv_flow.get("min"), inv_flow.get("max")
        if f_min is not None and f_max is not None:
            if f_min <= t_flow <= f_max:
                dist_f_norm, match_f_pct = 0.0, 100.0
            else:
                d = min(abs(t_flow - f_min), abs(t_flow - f_max))
                dist_f_norm = d / (PHYSICAL_DOMAINS["flow"]["max"] - PHYSICAL_DOMAINS["flow"]["min"])
                match_f_pct = max(0.0, 100.0 * (1.0 - dist_f_norm))
        else:
            dist_f_norm, match_f_pct = 0.5, 50.0

        emulated_g = inv.get("emulated_gravity_g")
        g_val = inv.get("gravity", 0.0)
        g_eff = emulated_g["representative"] if isinstance(emulated_g, dict) and emulated_g.get("representative") is not None else (g_val if g_val is not None else 0.0)

        dist_g_norm = abs(t_gravity - g_eff) / (PHYSICAL_DOMAINS["gravity"]["max"] - PHYSICAL_DOMAINS["gravity"]["min"])
        match_g_pct = max(0.0, 100.0 * (1.0 - dist_g_norm))

        weighted_sum_sq = (
            weights["o2"] * (dist_o2_norm ** 2) +
            weights["pressure"] * (dist_p_norm ** 2) +
            weights["flow"] * (dist_f_norm ** 2) +
            weights["gravity"] * (dist_g_norm ** 2)
        )
        weighted_euclidean_dist = math.sqrt(weighted_sum_sq)
        relevance_raw = 100.0 * math.exp(-2.5 * weighted_euclidean_dist)

        pillar_bonus = 1.0
        inv_pillars = [p.lower() for p in inv.get("pillars", [])]
        if conditions.selected_pillar and conditions.selected_pillar != "all":
            pillar_bonus = 1.15 if conditions.selected_pillar.lower() in inv_pillars else 0.85

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

# --- ENDPOINT INTELIGENTE DEL MOTOR 2 PARA EL MAPA DE PELIGRO ---
@app.post('/api/motor2/danger-map')
def danger_map_endpoint(req: DangerMapRequest):
    observations = []
    if OBS_DATA_PATH.exists():
        try:
            with open(OBS_DATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                observations = data.get("observations", [])
        except Exception:
            observations = []

    burns = []
    extinct = []

    target_fuel = req.fuel.lower()
    acronym_filter = (req.investigation_acronym or "").lower().strip()

    # Factor dinámico basado en la investigación seleccionada para mover la curva con fundamento físico
    inv_shift = 0.0
    if "fm2" in acronym_filter or "luci" in acronym_filter:
        inv_shift = -0.4  # Mayor sensibilidad al fuego en entornos lunares simulados
    elif "saffire" in acronym_filter:
        inv_shift = 0.3   # Ensayos a gran escala en vehículos de reabastecimiento
    elif "bass" in acronym_filter:
        inv_shift = -0.2

    filtered_observations = []
    for r in observations:
        r_fuel = (r.get("fuel") or "").lower()
        if target_fuel not in r_fuel and not (target_fuel == "pmma" and "acrilico" in r_fuel):
            continue

        citation_info = f"{r.get('experiment_id', '')} {r.get('citation', '')} {r.get('source', '')}".lower()
        
        # Si hay un foco activo, filtramos de manera inteligente
        if acronym_filter:
            if acronym_filter in citation_info or any(w in citation_info for w in acronym_filter.split()):
                filtered_observations.append(r)
        else:
            filtered_observations.append(r)

    # Si el filtro específico es muy restrictivo y da 0, tomamos una muestra representativa del material
    if not filtered_observations:
        filtered_observations = [r for r in observations if target_fuel in (r.get("fuel") or "").lower()]

    for r in filtered_observations:
        outputs = r.get("outputs") or {}
        spread = outputs.get("spread_mm_s") or 0.0
        min_o2 = outputs.get("minimum_oxygen_pct") or r.get("oxygen_pct", 21.0)

        point = {
            "flow": r.get("airflow_cm_s", 10.0),
            "o2": min_o2,
            "gravity": r.get("gravity_g", req.gravity_g),
            "experiment": r.get("experiment_id")
        }

        if spread > 0 or r.get("gravity_g", 0) == 0:
            burns.append(point)
        else:
            extinct.append(point)

    # Curva U-Shape paramétrica adaptada en tiempo real a las variables de la cabina y la investigación
    chart_curve = []
    for x in range(0, 41, 1):
        flow_offset = (0.035 * math.pow(10 - x, 1.35)) if x < 10 else (0.0022 * math.pow(x - 10, 1.6))
        base_loi_0g = 16.3 + inv_shift
        base_earth = 17.5
        
        # Las variables del escenario (gravedad y presión) deforman la curva dinámicamente
        grav_delta = (base_earth - base_loi_0g) * math.pow(req.gravity_g, 0.95)
        press_delta = 0.015 * (14.7 - req.pressure_psi)

        loi_target = base_loi_0g + flow_offset + grav_delta + press_delta
        loi_0g = base_loi_0g + flow_offset + press_delta

        chart_curve.append({
            "flow": x,
            "limit0g": round(max(10.0, loi_0g), 2),
            "limitTarget": round(max(10.0, loi_target), 2),
            "limitEarth": base_earth
        })

    return {
        "status": "success",
        "investigation_filter": req.investigation_acronym,
        "model_sweep": chart_curve,
        "scatter_burns": burns,
        "scatter_extinct": extinct
    }