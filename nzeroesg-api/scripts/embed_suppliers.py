# in-memory vector database: development only 
from dotenv import load_dotenv
load_dotenv()

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain.schema import Document
import json, os

SUPPLIER_JSON = "data/suppliers.json"
VECTOR_DB_DIR = "db/suppliers"

def load_suppliers():
    with open(SUPPLIER_JSON, "r") as f:
        data = json.load(f)

    docs = []
    for s in data:
        content = f"{s['name']} in {s['region']}. {s['description']} Certifications: {', '.join(s['certifications'])}. Materials: {', '.join(s['materials'])}."
        metadata = {k: v for k, v in s.items() if k != "description"}
        docs.append(Document(page_content=content, metadata=metadata))
    return docs

if __name__ == "__main__":
    os.makedirs(VECTOR_DB_DIR, exist_ok=True)

    # TODO - use module import instead (rag/embedder.py)
    embedder = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    documents = load_suppliers()
    vectordb = Chroma.from_documents(
        documents, embedder, persist_directory=VECTOR_DB_DIR
    )
    
    vectordb.persist()           
    print("Supplier embeddings stored using HuggingFace.")
    print(f"Vector DB stored at: {VECTOR_DB_DIR}")
