import os
from typing import Optional

from dotenv import load_dotenv
from pydantic import Field, SecretStr
from langchain_openai import ChatOpenAI
from langchain_core.utils.utils import secret_from_env
from config import OPENROUTER_API_KEY

load_dotenv()

class ChatOpenRouter(ChatOpenAI):
    """
    Wrapper making OpenRouter-hosted models compatible with LangChain's ChatOpenAI.
    Automatically injects OpenRouter API key and sets the proper base URL.
    """

    openai_api_key: Optional[SecretStr] = Field(
        alias="api_key", default_factory=secret_from_env("OPENROUTER_API_KEY", default=None)
    )

    @property
    def lc_secrets(self) -> dict[str, str]:
        return {"openai_api_key": "OPENROUTER_API_KEY"}

    def __init__(self, openai_api_key: Optional[str] = None, **kwargs):
        openai_api_key = openai_api_key or OPENROUTER_API_KEY
        super().__init__(
            base_url="https://openrouter.ai/api/v1",
            openai_api_key=openai_api_key,
            **kwargs
        )
