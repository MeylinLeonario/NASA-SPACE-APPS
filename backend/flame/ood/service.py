import importlib.util
from importlib.metadata import version as package_version
from .data import load_dataset, compatible, features, eligible, output_coverage
from .schema import OUTPUTS

WARNING = 'Research exploration only. Unvalidated predictions are insufficient for spacecraft fire-safety certification.'

def status(path):
    rows, version = load_dataset(path)
    ready = all(importlib.util.find_spec(p) is not None for p in ('numpy', 'scipy', 'sklearn'))
    direct = [r for r in rows if r.reviewed and r.provenance in {'ground', 'partial_gravity', 'microgravity'}]
    return {'schema_version': 1, 'dataset_sha256': version, 'observations': len(rows), 'reviewed_direct_observations': len(direct),
            'unreviewed_observations': sum(not r.reviewed for r in rows),
            'dependencies_ready': ready, 'models': {'gpr': ready, 'boosting': ready, 'physics_gpr': False},
            'outputs': OUTPUTS, 'cohorts': [dict(fuel=f, configuration=c, temperature_available=t,
                coverage=output_coverage([r for r in direct if (r.fuel, r.configuration, r.temperature_k is not None) == (f,c,t)]))
                for f,c,t in sorted({(r.fuel,r.configuration,r.temperature_k is not None) for r in direct})],
            'provenance_counts': {kind: sum(r.provenance == kind for r in rows) for kind in sorted({r.provenance for r in rows})},
            'gravity_levels': sorted({r.gravity_g for r in direct}),
            'reason': None if direct else (f'{len(rows)} observation rows loaded; {sum(not r.reviewed for r in rows)} await scientific review. Unreviewed records are excluded from training.' if rows else 'No reviewed run-level experimental observations supplied. Papers and metadata are not training rows.'),
            'warning': WARNING}

def infer(path, query, validation=False):
    from .models import fit_model, predict, Unavailable
    from .evaluation import position, evaluate
    rows, version = load_dataset(path)
    rows = compatible(rows, query)
    if query.model == 'physics_gpr':
        raise Unavailable('Physics baseline unavailable: a cited, applicable regime-specific law and coefficients are required.')
    results = {}
    for output, unit in OUTPUTS.items():
        selected = [r for r in rows if r.outputs.get(output) is not None]
        if not eligible(selected):
            continue
        if validation:
            results[output] = {'unit': unit, 'folds': evaluate(selected, output, query.model, query.holdout_g)}
            continue
        x = [features(r) for r in selected]
        y = [r.outputs[output] for r in selected]
        model = fit_model(query.model, x, y, [r.uncertainty.get(output) for r in selected])
        mean, intervals = predict(model, [features(query)], query.model)
        vector = features(query)
        inside = all(min(v[i] for v in x) <= value <= max(v[i] for v in x) for i, value in enumerate(vector))
        physical = mean[0] >= 0 and (output != 'minimum_oxygen_pct' or mean[0] <= 100)
        results[output] = {'unit': unit, 'mean': float(mean[0]) if physical else None,
                           'physical_constraint_warning': None if physical else 'Model mean violates physical output bounds; estimate suppressed.',
                           'interval': intervals[0].tolist() if intervals is not None else None,
                           'interval_interpretation': 'Uncalibrated 95% Gaussian posterior predictive interval, including fitted white noise; may cross physical bounds. Not a safety bound.' if intervals is not None else 'Unavailable for gradient boosting.',
                           'measurement_uncertainty': 'Known per-row standard deviations used in GP fitting; missing values do not establish zero measurement error.',
                           'gravity_position': position(query.gravity_g, {r.gravity_g for r in selected}),
                           'within_marginal_ranges': inside, 'joint_domain': 'Not established by marginal ranges',
                           'novelty_score': None, 'domain_coverage_uncertainty': 'Unavailable',
                           'validation_evidence': 'Run grouped LOGO validation; prediction alone is not independent validation.',
                           'sources': sorted({r.citation for r in selected}), 'training_n': len(selected),
                           'outside_features': [name for i, name in enumerate(['gravity_g', 'oxygen_pct', 'pressure_kpa', 'airflow_cm_s'] + ([] if query.temperature_k is None else ['temperature_k']))
                                                if not min(v[i] for v in x) <= vector[i] <= max(v[i] for v in x)]}
    return {'status': 'available' if results else 'unavailable', 'reason': None if results else 'Insufficient compatible reviewed observations: need at least 3 rows across 2 gravity levels per output.',
            'dataset_sha256': version, 'artifact_version': 'ood-v2',
            'request': query.model_dump(),
            'package_versions': {name: package_version(name) for name in ('numpy', 'scipy', 'scikit-learn')}, 'model': query.model, 'results': results, 'warning': WARNING}
