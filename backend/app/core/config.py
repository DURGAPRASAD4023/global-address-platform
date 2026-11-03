"""Application settings — secrets via environment variables only."""

from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = "development"
    log_level: str = "INFO"
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"

    database_url: str = (
        "postgresql+asyncpg://gap:gap_dev_password_change_me@localhost:5432/global_address"
    )
    redis_url: str = "redis://localhost:6379/0"

    rate_limit_anonymous: str = "30/minute"
    rate_limit_authenticated: str = "120/minute"
    rate_limit_api_key: str = "300/minute"

    geocoding_provider: str = "nominatim"
    geocoding_api_key: str = ""
    geoapify_api_key: str = ""
    geocoding_user_agent: str = "GlobalAddressPlatform/0.1.0 (dev)"
    geocoding_cache_ttl_seconds: int = 86400
    generation_max_retries: int = 5

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    api_key_header: str = "X-API-Key"
    secret_key: str = Field(default="change-me-in-production")

    max_address_input_chars: int = 4000
    max_bulk_size: int = 100

    @model_validator(mode="after")
    def normalise_database_url(self) -> "Settings":
        """Ensure the DATABASE_URL uses the asyncpg driver.

        Render and other PaaS providers set DATABASE_URL with the
        ``postgresql://`` scheme.  SQLAlchemy's async engine requires
        ``postgresql+asyncpg://``.  This validator transparently rewrites
        the scheme so the app works without manual env-var editing.
        """
        url = self.database_url
        if url.startswith("postgres://"):
            self.database_url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            self.database_url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
