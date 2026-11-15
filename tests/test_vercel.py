from pathlib import Path
from fastapi.testclient import TestClient
from flame.config import Settings, ROOT
from flame.main import create_app


def test_serverless_data_default_and_override(monkeypatch, tmp_path):
    monkeypatch.setenv('VERCEL', '1')
    monkeypatch.delenv('DATA_DIR', raising=False)
    cfg = Settings(_env_file=None)
    assert cfg.data_dir == Path('/tmp/flame-data')
    assert cfg.catalog_dir == ROOT / 'datasets' / 'psi'
    assert cfg.papers_dir == ROOT / 'papers'
    monkeypatch.setenv('DATA_DIR', str(tmp_path))
    assert Settings(_env_file=None).data_dir == tmp_path


def test_serverless_api_without_vector_dependencies(monkeypatch, tmp_path):
    monkeypatch.setenv('VERCEL', '1')
    cfg = Settings(_env_file=None, data_dir=tmp_path, enable_paid_api=False,
                   flame_api_token='', supabase_url='', supabase_key='')
    with TestClient(create_app(cfg)) as client:
        assert client.get('/health').status_code == 200
        response = client.get('/api/investigations')
        assert response.status_code == 200
        assert client.get('/api/catalog/source').status_code == 200
        assert client.post('/api/motor1/match', json={
            'o2': 21, 'pressure': 101.3, 'flow': 10, 'gravity': 1
        }).status_code == 200
    assert (tmp_path / 'corpus.sqlite3').is_file()
