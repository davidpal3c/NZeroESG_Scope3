from langchain_openai import ChatOpenAI
from langchain.llms import Ollama
from config import LLM_PROVIDER, OPENAI_API_KEY, OPENROUTER_API_KEY, OPENROUTER_MODEL
import os
# from langchain.llms import Ollama

def load_llm():
    if LLM_PROVIDER == "openai":
        return ChatOpenAI(
            model_name="gpt-3.5-turbo",
            temperature=0.3, 
            openai_api_key=OPENAI_API_KEY,
            max_tokens=500
        )
    
    elif LLM_PROVIDER == "openrouter":
        api_key = os.getenv("OPENROUTER_API_KEY")
        model = os.getenv("OPENROUTER_MODEL", "gpt-3.5-turbo")

        if not api_key:
            raise RuntimeError("Missing OPENROUTER_API_KEY")
        
        if not model:
            raise RuntimeError("Missing OPENROUTER_MODEL")

        print(f"Using LLM: {model} via {LLM_PROVIDER}")

        return ChatOpenAI(
            model_name=model,
            openai_api_key=api_key,
            openai_api_base="https://openrouter.ai/v1",
            max_tokens=500,
            temperature=0.3, 
        )


    elif LLM_PROVIDER == "ollama":
        model = os.getenv("OLLAMA_MODEL", "mistral")
        return Ollama(model=model)


    # Extend for other providers (or local models) as needed
    raise ValueError(f"Unsupported provider: {LLM_PROVIDER}")