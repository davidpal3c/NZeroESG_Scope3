import json
from fastapi import APIRouter, Request
from agent import build_agent
# from agent.memory import memory
# from agent.utils import trim_history

chat_router = APIRouter()

@chat_router.post("")
@chat_router.post("/")
async def chat(request: Request):
    data = await request.json()
    user_message = data.get("message")

    print(f"\n>>> Received user message: \n{user_message}\n")

    if not user_message:
        return {"message": "Was there something you wanted to ask?"}

    agent = await build_agent()

    # history = memory.chat_memory.messages 
    # if history:
    #     trim_history(history, window=900)

    response = await agent.ainvoke({
        "input": user_message,
        "chat_history": []
        # "chat_history": history      
    })
    
    # response = await agent.arun(input=user_message)
    # print(f"[DEBUG] Agent Response: {response}")

    try:
        if isinstance(response, dict):
            parsed = response
        elif isinstance(response, str) and response.startswith("{"):
            parsed = json.loads(response)
        else:
            parsed = {"summary": str(response)}

        print("[DEBUG] Agent Response (Pretty JSON):\n")
        print(json.dumps(parsed, indent=2))
    except Exception as e:
        print("[DEBUG] Agent Response (Raw):")
        print(response)
        print(f"[DEBUG] Error during JSON formatting: {e}")

 
    try:
        parsed = json.loads(response)
        return {
            "reply": parsed["summary"],
            "raw": parsed
        }
    except Exception:
        return { "reply": response }





@chat_router.get("/health")
async def health_check():
    return {"status": "ok", "message": "NZeroESG-api service is running!"}