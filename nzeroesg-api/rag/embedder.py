from langchain.embeddings.base import Embeddings
from config import EMBEDDER_URL
import requests

class RemoteEmbedder(Embeddings):
    """LangChain-compatible wrapper that calls embedder micro-service"""

    def __init__(self, url: str = EMBEDDER_URL):
        self.url = url

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        res = requests.post(
            self.url,
            json={"texts": texts},
            timeout=30
        )

        if res.status_code != 200:
            raise Exception(f"Failed to embed documents: {res.status_code} - {res.text}")
        res.raise_for_status()
    
        vectors = res.json().get("embeddings")
        if not vectors:
            raise ValueError("No embeddings returned from the embedder service.")
        if not isinstance(vectors, list) or len(vectors) != len(texts) or not all(isinstance(vec, list) for vec in vectors):
            raise ValueError(f"Bad response from embedder: {res.text}")

        return vectors

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]
    


def get_supplier_embedder() -> Embeddings:
    return RemoteEmbedder(url=f"{EMBEDDER_URL}/embed")  



# from langchain_huggingface import HuggingFaceEmbeddings

# def get_supplier_embedder():
#     return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
