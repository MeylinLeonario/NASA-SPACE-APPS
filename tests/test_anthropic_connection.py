from unittest.mock import patch
import anthropic
import httpx
import pytest
from fastapi.testclient import TestClient
from flame.config import Settings
from flame.main import create_app
from flame.provider import Provider
from flame.models import GeneratedAnswer


def test_only_anthropic_key_selects_anthropic_without_enabling_spending():
    cfg = Settings(_env_file=None, llm_provider='auto', anthropic_api_key=' key ',
                   openai_api_key='', enable_paid_api=False)
    assert cfg.anthropic_api_key == 'key'
    assert cfg.synthesis_provider == 'anthropic'
    assert not cfg.synthesis_ready
    cfg.enable_paid_api = True
    assert cfg.synthesis_ready
    cfg.llm_provider = 'openai'
    assert cfg.synthesis_status == 'api_key_missing'


def test_connection_check_does_not_generate_text(cfg):
    cfg.llm_provider, cfg.anthropic_api_key, cfg.enable_paid_api = 'anthropic', 'private-test-key', True
    with patch('anthropic.Anthropic') as client:
        response = TestClient(create_app(cfg)).post('/api/provider/check')
    assert response.status_code == 200
    assert response.json() == {'status': 'connected', 'provider': 'anthropic',
                              'model': cfg.anthropic_model, 'generation_verified': False}
    client.return_value.models.retrieve.assert_called_once_with(cfg.anthropic_model)
    client.return_value.messages.create.assert_not_called()
    assert cfg.anthropic_api_key not in response.text


@pytest.mark.parametrize('status,code', [
    (401, 'anthropic_authentication_failed'), (403, 'anthropic_permission_denied'),
    (404, 'anthropic_model_not_found'), (429, 'anthropic_rate_limited'),
    (500, 'anthropic_unavailable'),
])
def test_provider_errors_are_actionable_and_redacted(cfg, status, code):
    cfg.llm_provider, cfg.anthropic_api_key, cfg.enable_paid_api = 'anthropic', 'private-test-key', True
    upstream = httpx.Response(status, request=httpx.Request('GET', 'https://api.anthropic.com/v1/models/test'))
    error = anthropic.APIStatusError('private-test-key upstream secret', response=upstream, body={})
    with patch('anthropic.Anthropic') as client:
        client.return_value.models.retrieve.side_effect = error
        response = TestClient(create_app(cfg)).post('/api/provider/check')
    assert response.status_code == (429 if status == 429 else 502)
    assert response.json()['error']['code'] == code
    assert 'private-test-key' not in response.text


def test_disabled_provider_never_contacts_anthropic(cfg):
    cfg.llm_provider, cfg.anthropic_api_key, cfg.enable_paid_api = 'anthropic', 'test', False
    with patch('anthropic.Anthropic') as client:
        response = TestClient(create_app(cfg)).post('/api/provider/check')
    assert response.status_code == 503
    assert response.json()['error']['code'] == 'paid_api_disabled'
    client.assert_not_called()


def test_chat_uses_auto_selected_anthropic(store):
    store.config.llm_provider = 'auto'
    store.config.openai_api_key = ''
    store.config.anthropic_api_key = 'test'
    store.config.enable_paid_api = True
    result = (GeneratedAnswer(claims=[], limitations=[], insufficient_evidence=True), {})
    with patch.object(Provider, '_structured_anthropic', return_value=result) as generate:
        assert Provider(store).structured('system', 'user', GeneratedAnswer, 'chat') == result
    generate.assert_called_once()
