import logging
from time import perf_counter

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from config import settings

logger = logging.getLogger(__name__)
chat_router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4_000)


class ChatResponse(BaseModel):
    reply: str
    processing_time_ms: int


@chat_router.post("", response_model=ChatResponse)
@chat_router.post("/", response_model=ChatResponse, include_in_schema=False)
async def chat(payload: ChatRequest) -> ChatResponse:
    if not settings.assistant_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The optional assistant is disabled in this environment.",
        )

    started_at = perf_counter()
    try:
        from agent import build_agent

        agent = await build_agent()
        result = await agent.ainvoke({"input": payload.message, "chat_history": []})
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Assistant request failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The assistant provider is temporarily unavailable.",
        ) from exc

    reply = result.get("output", "") if isinstance(result, dict) else str(result)
    return ChatResponse(
        reply=reply or "The assistant did not return a response.",
        processing_time_ms=round((perf_counter() - started_at) * 1_000),
    )


@chat_router.get("/health")
async def health_check():
    return {"status": "ok", "assistant_enabled": settings.assistant_enabled}
