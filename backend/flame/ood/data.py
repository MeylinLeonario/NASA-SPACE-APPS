import hashlib
import json
from pathlib import Path
from .schema import Observation

DIRECT = {'ground', 'partial_gravity', 'microgravity'}

def load_dataset(path: Path):
    if not path.exists():
        return [], None
    raw = path.read_bytes()
    payload = json.loads(raw)
    if payload.get('schema_version') != 1:
        raise ValueError('Expected observation schema_version 1')
    rows = [Observation.model_validate(row) for row in payload['observations']]
    return rows, hashlib.sha256(raw).hexdigest()

def compatible(rows, query, output=None):
    return [r for r in rows if r.reviewed and r.provenance in DIRECT
            and r.fuel == query.fuel and r.configuration == query.configuration
            and (r.temperature_k is None) == (query.temperature_k is None)
            and (output is None or r.outputs.get(output) is not None)]

def features(query):
    from .schema import FEATURES
    return [getattr(query, key) for key in FEATURES] + ([] if query.temperature_k is None else [query.temperature_k])

def gravity_to_g(value, unit):
    if unit == 'g':
        return value
    if unit == 'm/s2':
        return value / 9.80665
    raise ValueError('Gravity units must be g or m/s2')
