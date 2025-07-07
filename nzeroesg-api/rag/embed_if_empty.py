from rag.vectorstore import load_supplier_db
from rag.embedder import get_supplier_embedder
from langchain.schema import Document
import time, requests, json

SUPPLIER_JSON = "data/suppliers.json"


def _wait_for(url: str, timeout=30):
    deadline = time.time() + timeout

    while time.time() < deadline:
        try:
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                return
        except requests.RequestException as e:
            print(f"Waiting for {url}... {e}")

        time.sleep(1)
    raise RuntimeError(f"Service at {url} did not become ready.")


def run_if_empty():
    _wait_for("http://embedder:8002/health")
    _wait_for("http://chroma:8000")

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

