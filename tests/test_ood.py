"""Synthetic fixtures test software only, never scientific performance."""
import json
import numpy as np
import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient
from flame.ood.schema import Observation, Query
from flame.ood.data import gravity_to_g, compatible
from flame.ood.evaluation import position, evaluate
from flame.ood.models import fit_model, predict, Unavailable
from flame.ood.service import infer
from flame.main import create_app

def row(g, group, **changes):
    values = dict(gravity_g=g, oxygen_pct=21, pressure_kpa=101, airflow_cm_s=5,
                  fuel='test-only', configuration='fixture', experiment_id='fixture', source='test',
                  citation='Synthetic software fixture — not experimental evidence', leakage_group=group,
                  provenance='partial_gravity', reviewed=True, outputs={'spread_mm_s': 1+g})
    return Observation(**(values | changes))

def query(**changes):
    return Query(**(dict(gravity_g=.5, oxygen_pct=21, pressure_kpa=101, airflow_cm_s=5,
                        fuel='test-only', configuration='fixture') | changes))

def test_units_and_domain():
    assert gravity_to_g(9.80665, 'm/s2') == 1
    with pytest.raises(ValueError): gravity_to_g(1, 'unknown')
    assert position(.5, {0, 1}) == 'interpolation'
    assert position(2, {0, 1}) == 'extrapolation'
    assert position(0, {0, 1}) == 'measured'
    assert position(0, set()) == 'unavailable'

def test_schema_and_provenance():
    with pytest.raises(ValidationError): query(oxygen_pct=None)
    with pytest.raises(ValidationError): query(pressure_kpa=-1)
    with pytest.raises(ValidationError): row(0, 'a', outputs={'extinction_probability': .5})
    with pytest.raises(ValidationError): row(0, 'a', outputs={'spread_mm_s': -1})
    with pytest.raises(ValidationError): query(gravity_g=float('nan'))
    assert not compatible([row(0, 'a', provenance='efield_analog')], query())
    assert not compatible([row(0, 'a', fuel='other')], query())
    assert not compatible([row(0, 'a', reviewed=False)], query())

def test_model_shapes():
    x = [[0], [.1], [.5], [1]]
    for name in ('gpr', 'boosting'):
        model = fit_model(name, x, [1, 1.1, 1.5, 2])
        mean, intervals = predict(model, [[.2], [.3]], name)
        assert mean.shape == (2,)
        if name == 'gpr': assert intervals.shape == (2, 2)
        else: assert intervals is None
    with pytest.raises(Unavailable): fit_model('physics_gpr', x, [1]*4)

def test_logo_excludes_related_groups():
    rows = [row(0, 'shared'), row(.2, 'shared'), row(.2, 'b'), row(.5, 'c'), row(1, 'd')]
    fold = evaluate(rows, 'spread_mm_s', 'gpr', 0)[0]
    assert fold['training_n'] == 3
    assert fold['excluded_groups'] == ['shared']
    assert fold['position'] == 'extrapolation'
    assert fold['metrics']['r2'] is None
    assert len(fold['points']) == 1
    assert evaluate(rows, 'spread_mm_s', 'gpr', .9)[0]['status'] == 'unavailable'

def test_api_empty_and_data(cfg):
    with TestClient(create_app(cfg)) as client:
        assert client.get('/api/ood/status').json()['reviewed_direct_observations'] == 0
        assert client.post('/api/ood/predict', json=query().model_dump()).json()['status'] == 'unavailable'
        assert client.post('/api/ood/predict', json={}).status_code == 422
        assert client.post('/api/ood/predict', json=query(model='physics_gpr').model_dump()).status_code == 400
        path = cfg.data_dir / 'combustion-observations.json'
        path.write_text(json.dumps({'schema_version': 1, 'observations': [row(g, str(i)).model_dump() for i,g in enumerate([0,.2,.5,1])]}))
        response = client.post('/api/ood/predict', json=query().model_dump())
        assert response.status_code == 200
        result = response.json()['results']
        assert set(result) == {'spread_mm_s'}
        assert result['spread_mm_s']['joint_domain'].startswith('Not established')
        assert result['spread_mm_s']['interval'] is not None
        assert client.post('/api/ood/validate', json=query(holdout_g=.2).model_dump()).json()['results']['spread_mm_s']['folds'][0]['status'] == 'evaluated'

def test_missing_output_and_invalid_dataset(tmp_path):
    from flame.ood.data import load_dataset
    path = tmp_path/'observations.json'
    assert load_dataset(path) == ([], None)
    path.write_text('{"schema_version": 9, "observations": []}')
    with pytest.raises(ValueError): load_dataset(path)
    rows = [row(0, 'a', outputs={'spread_mm_s': None})]
    assert compatible(rows, query(), 'spread_mm_s') == []
    assert compatible([row(0, 'a', temperature_k=300)], query()) == []

def test_invalid_physical_mean_is_suppressed(tmp_path, monkeypatch):
    import flame.ood.models as models
    path = tmp_path/'observations.json'
    path.write_text(json.dumps({'schema_version': 1, 'observations': [row(g, str(i)).model_dump() for i,g in enumerate([0,.2,1])]}))
    monkeypatch.setattr(models, 'fit_model', lambda *a: object())
    monkeypatch.setattr(models, 'predict', lambda *a: (np.array([-1.]), np.array([[-2.,0.]])))
    result = infer(path, query())['results']['spread_mm_s']
    assert result['mean'] is None
    assert result['physical_constraint_warning']
