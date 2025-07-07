from fastapi import FastAPI
from api.routes import chat_router
from fastapi.middleware.cors import CORSMiddleware
from rag.embed_if_empty import run_if_empty

app = FastAPI()


origins = [
    "http://localhost:3000",    
    "http://127.0.0.1:3000",
    "https://n-zero-esg-scope3.vercel.app",
    "https://nzeroesg-client.onrender.com",
    "http://nzeroesg-client.onrender.com",
]

app.add_middleware(
    CORSMiddleware,                              
    allow_origins=origins,                                
    allow_credentials=True,                             
    allow_methods=["*"],                                
    allow_headers=["*"],                                
)

@app.on_event("startup")
async def startup_event():
    run_if_empty()


app.include_router(chat_router, prefix="/chat", tags=["chat"])

@app.get("/health")
async def root():
    return {"message": "Health check successful"}


@app.get("/health/vectorstore")
async def vectorstore_health():
    from rag.vectorstore import load_supplier_db

    try:
        db = load_supplier_db()
        test = db.similarity_search("test", k=1)
        if test and db: 
            return {
                "status": "OK", 
                "message": "Vector store is healthy", 
                "collections": db.get().keys()
            }
        else:
            return {"message": "Vector store is empty"}
    except Exception as e:
        return {"error": str(e)}
    

@app.get("/health/embedder")
async def embedder_health():
    from rag.embedder import get_supplier_embedder

    try:
        embedder = get_supplier_embedder()
        test = embedder.embed_query("test")
        if test:
            return {"message": "Embedder is healthy"}
        else:
            return {"message": "Embedder returned empty result"}
    except Exception as e:
        return {"error": str(e)}