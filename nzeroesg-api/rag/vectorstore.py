# from langchain.vectorstores import Chroma
from langchain_community.vectorstores import Chroma
from rag.embedder import get_supplier_embedder

def load_supplier_db():
    return Chroma(
        persist_directory="db/suppliers",
        embedding_function=get_supplier_embedder()
    )
