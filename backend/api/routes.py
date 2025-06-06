from fastapi import APIRouter, Request
from agent import build_agent

chat_router = APIRouter()


@chat_router.post("/")
async def chat(request: Request):
    data = await request.json()
    user_message = data.get("message")

    print(f">>> Received user message: {user_message}")

    if not user_message:
        return {"message": "Was there something you wanted to ask?"}

    agent = await build_agent()
    response = await agent.ainvoke(input=user_message)
    # response = await agent.arun(input=user_message)

    print(f"[ChatAgent Reply] {response}")
    
    return {"reply": response}


@chat_router.get("/health")
async def health_check():
    return {"status": "ok", "message": "Chat service is running!"}