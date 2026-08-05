from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.emissions import emissions_router
from api.routes import chat_router
from api.workspaces import workspace_router
from config import settings

app = FastAPI(
    title="NZeroESG API",
    description="Scope 3 freight and supplier-evidence prototype API.",
    version="0.2.0-dev",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(chat_router, prefix="/chat", tags=["chat"])
app.include_router(workspace_router)
app.include_router(emissions_router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "environment": settings.environment,
        "assistant_enabled": settings.assistant_enabled,
    }
