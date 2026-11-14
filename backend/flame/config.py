from pathlib import Path
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ROOT / '.env'), extra='ignore')
    papers_dir: Path = ROOT / 'papers'
    data_dir: Path = ROOT / 'data'
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

@lru_cache
def settings() -> Settings:
    return Settings()
