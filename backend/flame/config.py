from pathlib import Path
import os
from typing import Literal
from functools import lru_cache
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ROOT / '.env'), extra='ignore')
    papers_dir: Path = ROOT / 'papers'
    # The deployment bundle is read-only in serverless functions. DATA_DIR can
    # still override this default when persistent storage is available.
    data_dir: Path = Field(default_factory=lambda: Path('/tmp/flame-data') if os.getenv('VERCEL') else ROOT / 'data')
    # Curated PSI investigation catalog (versioned in Git, unlike data/).
    catalog_dir: Path = ROOT / 'datasets' / 'psi'
    # Optional Supabase project holding the same catalog (supabase_seed.sql). Empty = local JSON only.
    # Use the public (anon/publishable) key, never the service_role key.
    supabase_url: str = ''
    supabase_key: str = ''
    # Answer synthesis provider. Embeddings remain OpenAI-only.
    llm_provider: Literal['auto', 'openai', 'anthropic'] = 'auto'
    anthropic_api_key: str = ''
    anthropic_model: str = 'claude-haiku-5-5'
    anthropic_max_tokens: int = Field(default=12000, ge=500, le=32000)
    openai_api_key: str = ''
    openai_model: str = 'gpt-4o-mini'
    openai_embedding_model: str = 'text-embedding-3-small'
    # Reserved for a documented Consensus API entitlement; manual import needs no key.
    consensus_api_key: str = ''
    openai_timeout_seconds: float = Field(default=45, gt=0, le=300)
    openai_max_retries: int = Field(default=2, ge=0, le=5)
    rag_max_context_tokens: int = Field(default=16000, ge=1000, le=64000)
    enable_paid_api: bool = False
    max_ingest_documents: int = 50
    max_file_mb: int = 40
    max_ingest_tokens: int = 500000
    embedding_usd_per_million: float = 0.02
    input_usd_per_million: float = 0.15
    output_usd_per_million: float = 0.60
    flame_api_token: str = ''

    @field_validator('anthropic_api_key', 'openai_api_key', 'anthropic_model', 'openai_model', 'llm_provider', mode='before')
    @classmethod
    def strip_provider_settings(cls, value):
        return value.strip() if isinstance(value, str) else value

    @property
    def synthesis_provider(self) -> str:
        if self.llm_provider != 'auto':
            return self.llm_provider
        return 'anthropic' if self.anthropic_api_key and not self.openai_api_key else 'openai'

    @property
    def synthesis_model(self) -> str:
        return self.anthropic_model if self.synthesis_provider == 'anthropic' else self.openai_model

    @property
    def synthesis_status(self) -> str:
        if not self.enable_paid_api:
            return 'paid_api_disabled'
        key = self.anthropic_api_key if self.synthesis_provider == 'anthropic' else self.openai_api_key
        return 'configured_not_verified' if key else 'api_key_missing'

    @property
    def synthesis_ready(self) -> bool:
        return self.synthesis_status == 'configured_not_verified'

@lru_cache
def settings() -> Settings:
    return Settings()
