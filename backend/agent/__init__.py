from langchain.agents import initialize_agent, Tool
from langchain_openai import ChatOpenAI
from agent.tools import emissions_tool, supplier_tool, compare_tool
from agent.memory import memory
from agent.llm import load_llm

## TODO: add model selection logic

async def build_agent():
    tools = [emissions_tool, supplier_tool, compare_tool]
    llm = load_llm()

    print(f"...BUILDING AGENT...\n")

    return initialize_agent(
        tools, 
        llm, 
        agent="chat-conversational-react-description", 
        memory=memory,
        verbose=True                     # to see step-by-step reasoning
    )



