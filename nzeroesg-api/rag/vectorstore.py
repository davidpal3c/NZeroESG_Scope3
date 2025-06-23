# from langchain.vectorstores import Chroma
from langchain_chroma import Chroma
from rag.embedder import get_supplier_embedder
from chromadb.config import Settings

# offload vector store to ChromaDB server
def load_supplier_db():
    return Chroma(
        collection_name="suppliers",
        embedding_function=get_supplier_embedder(),
        client_settings=Settings(                               # defaults to REST API
            chroma_server_host="chroma",                        # Docker service name
            chroma_server_http_port="8000",
        )
    )

## in-memory vector store
# def load_supplier_db():
#     return Chroma(
#         persist_directory="db/suppliers",
#         embedding_function=get_supplier_embedder()
#     )
