import json
from unittest.mock import patch
from fastapi.testclient import TestClient
from flame.main import create_app
from flame.discovery import parse_import
from flame.ingest import ingest
from conftest import make_pdf

def client(cfg):
    app=create_app(cfg)
    make_pdf(cfg.papers_dir/'sample.pdf')
    ingest(app.state.store,dry_run=False)
    return TestClient(app,raise_server_exceptions=False)

def test_required_api_endpoints(cfg):
    c=client(cfg)
    for path in ('/health','/api/documents','/api/experiments','/api/statistics','/api/findings','/openapi.json'):
        assert c.get(path).status_code==200,path
    docs=c.get('/api/documents').json();d=docs[0]
    assert c.get(f'/api/documents/{d["id"]}').status_code==200
    assert c.get(f'/api/documents/{d["id"]}/file').content.startswith(b'%PDF')
    assert c.post('/api/search',json={'query':'flame'}).json()['results']
    assert c.post('/api/chat',json={'query':'flame'}).json()['mode']=='evidence_only'
    assert c.post('/api/ingest',json={}).json()['dry_run']
    stats=c.get('/api/statistics').json()
    assert stats['verified_findings']==0 and stats['total_papers']==1

def test_missing_doc_and_validation_error_shape(cfg):
    c=client(cfg)
    assert c.get('/api/documents/nonexistent').status_code==404
    for payload in ({'query':''},{'query':'flame','limit':100}):
        r=c.post('/api/search',json=payload)
        assert r.status_code==422 and r.json()['error']['code']=='validation_error'

def test_upload_path_guard_and_duplicate(cfg):
    c=client(cfg);source=(cfg.papers_dir/'sample.pdf').read_bytes()
    assert c.post('/api/documents/upload',files={'file':('../escape.pdf',source)}).status_code==400
    assert c.post('/api/documents/upload',files={'file':('invalid.pdf',b'fake')}).status_code==400
    assert c.post('/api/documents/upload',files={'file':('sample.pdf',source)}).status_code==409
    assert c.post('/api/documents/upload',files={'file':('new.pdf',source)}).status_code==200

def test_authentication_and_cross_origin_guard(cfg):
    cfg.flame_api_token='test-secret'
    c=client(cfg)
    assert c.get('/api/documents').status_code==401
    headers={'Authorization':'Bearer test-secret'}
    assert c.get('/api/documents',headers=headers).status_code==200
    assert c.post('/api/ingest',json={},headers=headers|{'Origin':'https://other.example'}).status_code==403
    assert c.post('/api/ingest',json={},headers=headers|{'Origin':'http://testserver'}).status_code==200

def test_invalid_api_credentials_are_sanitized(cfg):
    c=client(cfg)
    c.app.state.store.config.enable_paid_api=True
    c.app.state.store.config.openai_api_key='invalid'
    with patch('flame.assistant.Provider.structured',side_effect=RuntimeError('secret-credential-content')):
        r=c.post('/api/chat',json={'query':'flame','semantic':False})
        assert r.status_code==502
        assert 'secret-credential-content' not in r.text

def test_manual_discovery_deduplication(cfg):
    c=client(cfg)
    payload={'records':[{'title':'Discovery paper','doi':'https://doi.org/10.1234/ABC','authors':['A. Researcher']}]}
    assert c.post('/api/discovery/import',json=payload).json()['result']['added']==1
    payload['records'][0]['doi']='10.1234/abc'
    assert c.post('/api/discovery/import',json=payload).json()['result']['duplicates']==1
    assert len(c.get('/api/discovery').json()['items'])==1
    assert c.get('/api/statistics').json()['total_papers']==1
    csv=b'title,doi,authors,year,url,abstract\nAnother paper,10.1234/xyz,A;B,2024,,Abstract\n'
    assert c.post('/api/discovery/upload',files={'file':('import.csv',csv)}).json()['result']['added']==1

def test_missing_original_file(cfg):
    c=client(cfg);d=c.get('/api/documents').json()[0]
    (cfg.papers_dir/'sample.pdf').unlink()
    assert c.get(f'/api/documents/{d["id"]}/file').status_code==404

def test_oversized_upload(cfg):
    c=client(cfg);cfg.max_file_mb=0
    assert c.post('/api/documents/upload',files={'file':('big.pdf',b'%PDF-123')}).status_code==413
