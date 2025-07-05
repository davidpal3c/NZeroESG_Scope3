from dotenv import load_dotenv
load_dotenv()

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain.schema import Document
from rag.embedder import get_supplier_embedder
import json, os

SUPPLIER_JSON = "data/suppliers.json"
VECTOR_DB_DIR = "db/suppliers"

def load_suppliers():
    with open(SUPPLIER_JSON, "r") as f:
        data = json.load(f)

    docs = []
    for s in data:
        # content = f"{s['name']} in {s['region']}. {s['description']} Certifications: {', '.join(s['certifications'])}. Materials: {', '.join(s['materials'])}."
        # metadata = {k: v for k, v in s.items() if k != "description"}
        content = (
            f"{s['name']} in {s['region']}. {s['description']} "
            f"Certifications: {', '.join(s['certifications'])}. "
            f"Materials: {', '.join(s['materials'])}."
        )
        metadata = {
            "name": s["name"],
            "region": s["region"],
            "certifications": ", ".join(s["certifications"]),
            "materials": ", ".join(s["materials"]),
            "carbon_emissions_per_shipment_kg": s.get("carbon_emissions_per_shipment_kg"),
            "delivery_time_days": s.get("delivery_time_days"),
            "esg_rating": s.get("esg_rating"),
            "supports_offset_program": s.get("supports_offset_program"),
            "contact_email": s.get("contact_email")
        }

        docs.append(Document(page_content=content, metadata=metadata))

    return docs

if __name__ == "__main__":
    os.makedirs(VECTOR_DB_DIR, exist_ok=True)

    embedder = get_supplier_embedder()
    documents = load_suppliers()
    vectordb = Chroma.from_documents(
        documents, embedder, persist_directory=VECTOR_DB_DIR
    )
    vectordb.persist()           
    
    print("Supplier embeddings stored using HuggingFace.")
    print(f"Vector DB stored at: {VECTOR_DB_DIR}")














# in-memory vector database: development only 
# from dotenv import load_dotenv
# load_dotenv()

# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_chroma import Chroma
# from langchain.schema import Document
# import json, os

# SUPPLIER_JSON = "data/suppliers.json"
# VECTOR_DB_DIR = "db/suppliers"

# def load_suppliers():
#     with open(SUPPLIER_JSON, "r") as f:
#         data = json.load(f)

#     docs = []
#     for s in data:
#         content = f"{s['name']} in {s['region']}. {s['description']} Certifications: {', '.join(s['certifications'])}. Materials: {', '.join(s['materials'])}."
#         metadata = {k: v for k, v in s.items() if k != "description"}
#         docs.append(Document(page_content=content, metadata=metadata))
#     return docs

# if __name__ == "__main__":
#     os.makedirs(VECTOR_DB_DIR, exist_ok=True)

#     # TODO - use module import instead (rag/embedder.py)
#     embedder = HuggingFaceEmbeddings(
#         model_name="sentence-transformers/all-MiniLM-L6-v2"
#     )

#     documents = load_suppliers()
#     vectordb = Chroma.from_documents(
#         documents, embedder, persist_directory=VECTOR_DB_DIR
#     )
    
#     vectordb.persist()           
#     print("Supplier embeddings stored using HuggingFace.")
#     print(f"Vector DB stored at: {VECTOR_DB_DIR}")
