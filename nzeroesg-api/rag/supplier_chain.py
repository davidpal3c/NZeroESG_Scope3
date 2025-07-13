# Retrieval logic for suppliers using RAG (Retrieval-Augmented Generation)
from rag.vectorstore import load_supplier_db

def query_suppliers_rag(user_query:str, *, top_k:int=3, region: str|None=None):
    db = load_supplier_db()

    search_kwargs = {"k": top_k}

    if region:
        search_kwargs["filter"] = {"region": region}

    results = db.similarity_search(user_query, **search_kwargs)

    structured = [] 

    for r in results:
        structured.append({
            "summary": r.page_content,
            "metadata": r.metadata
        })
    
    # structured = [
    #     {"summary": d.page_content, "metadata": d.metadata}
    #     for d in docs
    # ]


    return {
        "matches": structured,
        "summary": f"Found {len(results)} suppliers matching your query.",
    }

# def query_suppliers_rag(user_query: str, top_k: int = 3):
#     vectordb = load_supplier_db()
#     results = vectordb.similarity_search(user_query, k=top_k)
    
#     return [r.page_content for r in results]
