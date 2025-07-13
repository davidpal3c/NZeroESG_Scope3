from rag.vectorstore import load_supplier_db
from rag.embedder import get_supplier_embedder
from langchain.schema import Document
from config import EMBEDDER_URL
import json, os
import requests, time


SUPPLIER_JSON = "data/suppliers.json"


def run_if_empty():
    db = load_supplier_db()

    try:
        test = db.similarity_search("test", k=1)
        if test:
            print("Supplier vector store already populated.")
            return
    except Exception as e:
        print(f"Error checking vector store: {e}")
        return
    
    print("Supplier vector store is empty. Embedding suppliers...")

    with open(SUPPLIER_JSON, "r") as file:
        data = json.load(file)

    docs = []
    for s in data: 
        # content = f"{s['name']} in {s['region']}. {s['description']} Certifications: {', '.join(s['certifications'])}. Materials: {', '.join(s['materials'])}."
        content = (
            f"{s['name']} in {s['region']}. {s['description']} "
            f"Certifications: {s['certifications']}. "
            f"Materials: {s['materials']}. "
            f"Transport Modes: {s['transport_modes']}. "
            f"Carbon Emissions: {s['carbon_emissions_per_shipment_kg']} kg. "
            f"Delivery Time: {s['delivery_time_days']} days. "
            f"ESG Rating: {s['esg_rating']}. "
            f"Offset Program: {'yes' if s['supports_offset_program'] else 'no'}."
        )
        
        # metadata = {k: v for k, v in s.items() if k != "description"}
        metadata = {
            "name": s["name"],
            "region": s["region"],
            "contact_email": s["contact_email"],
            "certifications": s["certifications"],
            "materials": s["materials"],
            "transport_modes": s["transport_modes"],
            "carbon_emissions_per_shipment_kg": s["carbon_emissions_per_shipment_kg"],
            "delivery_time_days": s["delivery_time_days"],
            "esg_rating": s["esg_rating"],
            "supports_offset_program": s["supports_offset_program"]
        }

        docs.append(Document(page_content=content, metadata=metadata))

    embedder = get_supplier_embedder()
    db = load_supplier_db()

    db.add_documents(docs, embedding=embedder)
       
    print("Supplier embeddings stored using HuggingFace.")


def wait_for_embedder(url=EMBEDDER_URL, retries: int=10):
        for i in range(retries):
            try:
                if requests.get(f"{url}/health", timeout=2).status_code == 200:
                    print("Embedder is ready")
                    return
            except requests.exceptions.RequestException as e:
                print(f"Embedder not ready yet: {e}")
            
            time.sleep(1 + i * 0.5)
        raise RuntimeError(f"Embedder service did not become healthy after {retries} retries")


