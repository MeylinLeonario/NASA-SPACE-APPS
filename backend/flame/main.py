import json
import logging
import secrets
import threading
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from .config import Settings, settings
from .store import Store
from .models import (DocumentResponse, IngestRequest, IngestResponse, SearchRequest, SearchResponse,
                     ChatRequest, ChatResponse, ImportRequest)
from .ingest import ingest, safe_file
from .retrieval import search
from .assistant import chat, extract_metadata
from .discovery import import_records, parse_import

log = logging.getLogger(__name__)

class Health(BaseModel):
    status: str
    paid_api_enabled: bool
    synthesis_ready: bool
    synthesis_model: str
    embedding_model: str
    consensus: str

class Statistics(BaseModel):
    total_papers: int
    indexed_chunks: int
    total_pages: int
    experiments_represented: int
    research_categories: int
    extraction_failures: int
    extraction_warning_pages: int
    verified_findings: int
    source_checked_findings: int
    experiment_distribution: list[dict[str, Any]]
    publication_timeline: list[dict[str, Any]]
    category_distribution: list[dict[str, Any]]
    usage: dict[str, Any]
    paid_api_enabled: bool
    embedding_model: str
    embedded_chunks: int

class CollectionResponse(BaseModel):
    items: list[dict[str, Any]]
    limitations: list[str] = []

class ActionResponse(BaseModel):
    result: dict[str, Any]

def create_app(config: Settings | None = None):
    cfg = config or settings()
    store = Store(cfg)
    app = FastAPI(title='FLAME INTELLIGENCE', version='0.1.0', description='Local, source-traceable microgravity combustion research. No synthetic measurements.')
    app.state.store = store
    lock = threading.Lock()

    @app.middleware('http')
    async def local_guard(request: Request, call_next):
        if request.url.path.startswith('/api/'):
            if cfg.flame_api_token:
                received = request.headers.get('authorization', '').removeprefix('Bearer ')
                if not secrets.compare_digest(received, cfg.flame_api_token):
                    return JSONResponse(status_code=401, content={'error': {'code': 'unauthorized', 'message': 'API token required'}})
            if request.method in ('POST', 'PUT', 'DELETE'):
                origin = request.headers.get('origin')
                if origin and urlparse(origin).netloc != (request.headers.get('x-forwarded-host') or request.headers.get('host')):
                    return JSONResponse(status_code=403, content={'error': {'code': 'origin_rejected', 'message': 'Cross-origin mutations are disabled'}})
        response = await call_next(request)
        response.headers['X-Content-Type-Options'] = 'nosniff'
        return response

    @app.exception_handler(ValueError)
    async def value_error(request, exc):
        return JSONResponse(status_code=400, content={'error': {'code': 'invalid_operation', 'message': str(exc)}})

    from fastapi.exceptions import RequestValidationError
    @app.exception_handler(RequestValidationError)
    async def validation_error(request, exc):
        return JSONResponse(status_code=422, content={'error': {'code': 'validation_error', 'message': 'Request validation failed', 'details': [{'location': list(e['loc']), 'message': e['msg']} for e in exc.errors()]}})

    from starlette.exceptions import HTTPException as StarletteHTTPException
    @app.exception_handler(StarletteHTTPException)
    async def http_error(request, exc):
        return JSONResponse(status_code=exc.status_code, content={'error': {'code': f'http_{exc.status_code}', 'message': exc.detail}})

    @app.exception_handler(Exception)
    async def unexpected(request, exc):
        log.error('Request failed: %s', type(exc).__name__)
        # Never send credential-bearing upstream bodies or internal file paths to the client.
        return JSONResponse(status_code=502, content={'error': {'code': 'service_unavailable', 'message': 'Operation failed; check local logs and provider configuration.', 'type': type(exc).__name__}})

    def locked(action):
        if not lock.acquire(blocking=False):
            raise HTTPException(409, 'Another ingestion/metadata operation is running')
        try:
            return action()
        finally:
            lock.release()

    @app.get('/api/docs', include_in_schema=False)
    def proxy_docs():
        from fastapi.openapi.docs import get_swagger_ui_html
        return get_swagger_ui_html(openapi_url='/api/openapi.json', title='FLAME API docs')

    @app.get('/api/openapi.json', include_in_schema=False)
    def proxy_schema():
        return app.openapi()

    @app.get('/health', response_model=Health)
    def health():
        return {'status': 'ok', 'paid_api_enabled': cfg.enable_paid_api, 'synthesis_ready': bool(cfg.enable_paid_api and cfg.openai_api_key), 'synthesis_model': cfg.openai_model, 'embedding_model': cfg.openai_embedding_model, 'consensus': 'manual_import_only'}

    @app.get('/api/documents', response_model=list[DocumentResponse])
    def documents():
        return store.documents()

    @app.get('/api/documents/{document_id}', response_model=DocumentResponse)
    def document(document_id: str):
        d = store.document(document_id)
        if not d:
            raise HTTPException(404, 'Document not found')
        return d

    @app.get('/api/documents/{document_id}/file', response_class=FileResponse)
    def original(document_id: str):
        d = store.document(document_id)
        if not d:
            raise HTTPException(404, 'Document not found')
        p = safe_file(cfg.papers_dir, d['source_file'])
        if not p.is_file():
            raise HTTPException(404, 'Original file is missing; reindex the corpus')
        return FileResponse(p, media_type='application/pdf' if p.suffix.lower() == '.pdf' else 'text/plain', filename=p.name, content_disposition_type='inline')

    @app.post('/api/ingest', response_model=IngestResponse)
    def run_ingestion(request: IngestRequest):
        return locked(lambda: ingest(store, **request.model_dump()))

    @app.post('/api/search', response_model=SearchResponse)
    def run_search(request: SearchRequest):
        return search(store, request)

    @app.post('/api/chat', response_model=ChatResponse)
    def run_chat(request: ChatRequest):
        return chat(store, request)

    @app.post('/api/documents/{document_id}/metadata', response_model=ActionResponse)
    def metadata(document_id: str):
        if not store.document(document_id):
            raise HTTPException(404, 'Document not found')
        return {'result': locked(lambda: extract_metadata(store, document_id))}

    @app.get('/api/statistics', response_model=Statistics)
    def statistics():
        docs = store.documents()
        experiments, categories, timeline = {}, {}, {}
        for d in docs:
            m = d['metadata']
            for bucket, key in ((experiments, 'experiment'), (categories, 'research_category'), (timeline, 'publication_year')):
                if m.get(key) is not None:
                    label = str(m[key])
                    bucket[label] = bucket.get(label, 0) + 1
        findings = [f for d in docs for f in d['metadata']['key_findings']]
        with store.connect() as db:
            failures = db.execute("SELECT COUNT(*) FROM files WHERE status='failed'").fetchone()[0]
            embedded = db.execute('SELECT COUNT(*) FROM chunks WHERE embedded_model=?', (cfg.openai_embedding_model,)).fetchone()[0]
        return {'total_papers': len(docs), 'indexed_chunks': sum(d['chunks'] for d in docs), 'total_pages': sum(d['page_count'] for d in docs),
                'experiments_represented': len(experiments), 'research_categories': len(categories), 'extraction_failures': failures,
                'extraction_warning_pages': sum(sum('Page ' in w for w in d['warnings']) for d in docs),
                'verified_findings': sum(f['verification_status'] == 'reviewed' for f in findings),
                'source_checked_findings': sum(f['verification_status'] == 'source_checked' for f in findings),
                'experiment_distribution': [{'name': k, 'papers': v} for k, v in sorted(experiments.items())],
                'category_distribution': [{'name': k, 'papers': v} for k, v in sorted(categories.items())],
                'publication_timeline': [{'year': k, 'papers': v} for k, v in sorted(timeline.items())],
                'usage': store.usage(), 'paid_api_enabled': cfg.enable_paid_api, 'embedding_model': cfg.openai_embedding_model, 'embedded_chunks': embedded}

    @app.get('/api/experiments', response_model=CollectionResponse)
    def experiments():
        grouped = {}
        for d in store.documents():
            name = d['metadata']['experiment']
            if name:
                grouped.setdefault(name, []).append({'document_id': d['id'], 'title': d['metadata']['title'] or d['source_file'], 'metadata': d['metadata']})
        return {'items': [{'name': k, 'papers': v} for k, v in sorted(grouped.items())],
                'limitations': ['Experiment labels are source mentions until reviewed. A mention does not establish that an experiment was performed in this paper.', 'Conditions are document-level summaries, not matched experimental runs. Do not infer causal comparisons.']}

    @app.get('/api/findings', response_model=CollectionResponse)
    def findings():
        return {'items': [dict(f, document_id=d['id'], source_file=d['source_file']) for d in store.documents() for f in d['metadata']['key_findings']],
                'limitations': ['source_checked means verbatim quote and page were validated, not independent scientific validation.']}

    @app.post('/api/discovery/import', response_model=ActionResponse)
    def discovery(request: ImportRequest):
        return {'result': import_records(store, [r.model_dump() for r in request.records])}

    @app.get('/api/discovery', response_model=CollectionResponse)
    def discoveries():
        with store.connect() as db:
            items = [json.loads(r['record']) for r in db.execute('SELECT record FROM discovery')]
        return {'items': items, 'limitations': ['Discovery metadata is not indexed full-text evidence. Attach a permitted PDF and ingest it separately.']}

    async def limited_read(file, max_bytes):
        parts, total = [], 0
        while part := await file.read(1024 * 1024):
            total += len(part)
            if total > max_bytes:
                raise HTTPException(413, 'File exceeds configured upload limit')
            parts.append(part)
        return b''.join(parts)

    @app.post('/api/discovery/upload', response_model=ActionResponse)
    async def discovery_upload(file: UploadFile = File(...)):
        content = await limited_read(file, 2 * 1024**2)
        records = parse_import(file.filename or '', content)
        return {'result': import_records(store, records)}

    @app.post('/api/documents/upload', response_model=ActionResponse)
    async def upload(file: UploadFile = File(...)):
        filename = file.filename or ''
        if Path(filename).name != filename or '\\' in filename or not filename.lower().endswith('.pdf'):
            raise HTTPException(400, 'Use a plain PDF filename without directories')
        content = await limited_read(file, cfg.max_file_mb * 1024**2)
        if not content.startswith(b'%PDF-'):
            raise HTTPException(400, 'Uploaded file is not a PDF')
        path = safe_file(cfg.papers_dir, filename)
        cfg.papers_dir.mkdir(parents=True, exist_ok=True)
        try:
            with path.open('xb') as out:
                out.write(content)
        except FileExistsError:
            raise HTTPException(409, 'File already exists; use a different name')
        return {'result': {'source_file': filename, 'status': 'uploaded_not_indexed'}}
    return app

app = create_app()
