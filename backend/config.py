from dotenv import load_dotenv
import os

load_dotenv()

LLM_PROVIDER = os.getenv("LLM_PROVIDER")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL")
CLIMATIQ_API_KEY = os.getenv("CLIMATIQ_API_KEY")

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")
