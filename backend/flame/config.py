from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ROOT / '.env'), extra='ignore')
    papers_dir: Path = ROOT / 'papers'
    data_dir: Path = ROOT / 'data'
    openai_api_key: str = ''
    openai_model: str = 'gpt-4o'
    openai_embedding_model: str = 'text-embedding-3-small'
    consensus_api_key: str = ''
    enable_paid_api: bool = False
    max_ingest_documents: int = 50
    max_file_mb: int = 40
    max_ingest_tokens: int = 500000
    embedding_usd_per_million: float = 0.02
    input_usd_per_million: float = 2.50
    output_usd_per_million: float = 10.0
    flame_api_token: str = ''

@lru_cache
def settings() -> Settings:
    return Settings()
