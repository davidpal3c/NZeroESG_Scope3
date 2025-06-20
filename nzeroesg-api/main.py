from fastapi import FastAPI
from api.routes import chat_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


origins = [
    "https://n-zero-esg-scope3.vercel.app/",
    "https://nzeroesg-client.onrender.com",
    "http://nzeroesg-client.onrender.com",
    "http://localhost:3000",    
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,                              
    allow_origins=origins,                                
    allow_credentials=True,                             
    allow_methods=["*"],                                
    allow_headers=["*"],                                
)

app.include_router(chat_router, prefix="/chat", tags=["chat"])


@app.get("/health")
async def root():
    return {"message": "Health check successful"}