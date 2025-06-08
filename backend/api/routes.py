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

    # parsed = parse_agent_input(user_message)
    # print("[DEBUG] Parsed Input:", parsed)

    # # resolving distance if origin and destination are available
    # if "origin" in parsed and "destination" in parsed and "distance_value" not in parsed:
    #     distance_result = resolve_distance(parsed["origin"], parsed["destination"])

    # if "distance_km" in distance_result:
    #     parsed["distance_value"] = distance_result["distance_km"]


    # tool_hint = json.dumps(parsed, indent=2) if parsed else ""
    # print(f"[DEBUG] Tool Hint: {tool_hint}")
    # final_input = f"{user_message}\n\nContextual data: \n{tool_hint}" if tool_hint else user_message


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
    return {"status": "ok", "message": "Chat service is running!"}