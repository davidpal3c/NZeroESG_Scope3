import os
from dotenv import load_dotenv
# from pydantic import Field, SecretStr
# from typing import Optional

from langchain_openai import ChatOpenAI
from langchain_community.llms import Ollama
from agent.utils.openrouter_llm import ChatOpenRouter
from config import LLM_PROVIDER, OPENAI_API_KEY, OPENROUTER_API_KEY, OPENROUTER_MODEL

def load_llm():
    # print(ChatOpenRouter)

    if LLM_PROVIDER == "openai":
        if not OPENAI_API_KEY:
            raise RuntimeError("Missing OPENAI_API_KEY")
        print(f"Using OpenAI model: gpt-3.5-turbo via OpenAI")

        return ChatOpenAI(
            model_name="gpt-3.5-turbo",
            temperature=0.3, 
            openai_api_key=OPENAI_API_KEY,
            max_tokens=500
        )
    
    elif LLM_PROVIDER == "openrouter":
        if not OPENROUTER_API_KEY:
            raise RuntimeError("Missing OPENROUTER_API_KEY")
        if not OPENROUTER_MODEL:
            raise RuntimeError("Missing OPENROUTER_MODEL")

        print(f"Using LLM: {OPENROUTER_MODEL} via {LLM_PROVIDER}\n")

        return ChatOpenRouter(
            model_name=OPENROUTER_MODEL,
            openai_api_key=OPENROUTER_API_KEY,
            openai_api_base="https://openrouter.ai/v1",
            max_tokens=500,
            temperature=0.3, 
        )

    elif LLM_PROVIDER == "ollama":
        return f"Ollama model: {OLLAMA_MODEL} via {LLM_PROVIDER}\n"

    # Extend for other providers (or local models) as needed
    raise ValueError(f"Unsupported provider: {LLM_PROVIDER}")




# class ChatOpenRouter(ChatOpenAI):
#     openai_api_key: Optional[SecretStr] = Field(
#         alias="api_key", default_factory=secret_from_env("OPENROUTER_API_KEY", default=None)
#     )

#     @property
#     def lc_secrets(self) -> dict[str, str]:
#         return {"openai_api_key": "OPENROUTER_API_KEY"}

#     def __init__(self, openai_api_key: Optional[str] = None, **kwargs):
#         openai_api_key = openai_api_key or os.environ.get("OPENROUTER_API_KEY")
#         super().__init__(
#             base_url="https://openrouter.ai/api/v1",
#             openai_api_key=openai_api_key,
#             **kwargs
#         )