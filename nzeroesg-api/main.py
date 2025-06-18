from fastapi import FastAPI
from api.routes import chat_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "https://nzeroesg-client.onrender.com",
    "http://localhost:5173",    
    "http://127.0.0.1:5173",
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
    return {"message": "Health check successful!"}