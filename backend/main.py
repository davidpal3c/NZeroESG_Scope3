from fastapi import FastAPI
from api.routes import chat_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# origins = [
#     "http://localhost:5173",    
#     "http://127.0.0.1:5173",
# ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],                                # Changing to specific origins in production
    allow_credentials=True,                             # Allow credentials (cookies, authorization headers, etc.)   
    allow_methods=["*"],                                # Allow all HTTP methods
    allow_headers=["*"],                                # Allow all headers
)

app.include_router(chat_router, prefix="/chat", tags=["chat"])


@app.get("/")
async def root():
    return {"message": "Health check successful!"}