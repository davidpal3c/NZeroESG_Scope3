from http.client import HTTPException
from fastapi import FastAPI
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

# MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"         
# model = SentenceTransformer(MODEL_NAME)

MODEL_NAME = "sentence-transformers/paraphrase-MiniLM-L6-v2"            
model = SentenceTransformer(MODEL_NAME, device="cpu")
# model = SentenceTransformer(MODEL_NAME, device="cpu" if SentenceTransformer(MODEL_NAME).is_available() else "cpu")

class EmbedRequest(BaseModel):
    texts: list[str]

class EmbedResponse(BaseModel):
    embeddings: list[list[float]]

app = FastAPI(title="Supplier-Embedder")


@app.post("/embed", response_model=EmbedResponse)
async def embed_texts(req: EmbedRequest):
    if not req.texts:
        raise HTTPException(status_code=400, detail="No texts provided for embedding.")
    emb = model.encode(req.texts, show_progress_bar=False).tolist()

    return { "embeddings": emb, "status": "200" }

@app.get("/")
def redirect_root():
    return RedirectResponse(url="/embed", status_code=302)

@app.get("/health", response_model=dict, include_in_schema=False)
def health():
    return {"status": "ok"}