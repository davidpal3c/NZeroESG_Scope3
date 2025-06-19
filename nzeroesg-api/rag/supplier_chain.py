# Retrieval logic for suppliers using RAG (Retrieval-Augmented Generation)
from rag.vectorstore import load_supplier_db

def query_suppliers_rag(user_query: str, top_k: int = 3):
    vectordb = load_supplier_db()
    results = vectordb.similarity_search(user_query, k=top_k)
    return [r.page_content for r in results]
