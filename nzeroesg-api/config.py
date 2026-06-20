import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _as_bool(value: str | None, *, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _as_csv(value: str | None, *, default: tuple[str, ...]) -> tuple[str, ...]:
    if not value:
        return default
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    environment: str = os.getenv("APP_ENV", "development")
    assistant_enabled: bool = _as_bool(os.getenv("ASSISTANT_ENABLED"))
    llm_provider: str = os.getenv("LLM_PROVIDER", "").strip().lower()
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    openai_model: str | None = os.getenv("OPENAI_MODEL")
    openrouter_api_key: str | None = os.getenv("OPENROUTER_API_KEY")
    openrouter_model: str | None = os.getenv("OPENROUTER_MODEL")
    carbon_interface_api_key: str | None = os.getenv("CARBON_INTERFACE_API_KEY")
    cors_origins: tuple[str, ...] = _as_csv(
        os.getenv("CORS_ORIGINS"),
        default=("http://localhost:3000", "http://127.0.0.1:3000"),
    )


settings = Settings()
