import json
from fastapi import APIRouter, Request
from agent import build_agent
chat_router = APIRouter()


@chat_router.post("/")
async def chat(request: Request):
    data = await request.json()
    user_message = data.get("message")

    print(f"\n>>> Received user message: \n{user_message}\n")

    if not user_message:
        return {"message": "Was there something you wanted to ask?"}

    agent = await build_agent()
    response = await agent.ainvoke({
        "input": user_message,
        "chat_history": []      
    })
    
    # response = await agent.arun(input=user_message)
    print(f"[DEBUG] Agent Response: {response}")

    return {"reply": response}


@chat_router.get("/health")
async def health_check():
    return {"status": "ok", "message": "NZeroESG-api service is running!"}