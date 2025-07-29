from langchain.agents import create_structured_chat_agent, AgentExecutor
from langchain import hub
from agent.tools import emissions_tool, compare_shipping_emissions, distance_tool, semantic_supplier_tool
from agent.memory import memory
from agent.llm import load_llm
from agent.prompts import initial_prompt



async def build_agent():
    tools = [emissions_tool, compare_shipping_emissions, distance_tool, semantic_supplier_tool]
    llm = load_llm()

    print(f"...BUILDING AGENT...\n")
    prompt = hub.pull("hwchase17/structured-chat-agent")

    # tool aware agent
    agent = create_structured_chat_agent(llm=llm, tools=tools, prompt=prompt)

    return AgentExecutor(
        agent=agent,
        tools=tools,
        memory=memory,
        verbose=True,                                               
        handle_parsing_errors=True,
        max_iterations=8,
        early_stopping_method="generate" 
    )

    # return initialize_agent(
    #     tools, 
    #     llm, 
    #     agent="chat-conversational-react-description", 
    #     memory=memory,
    #     verbose=True                                                    
    # )




# from langchain.agents import initialize_agent, Tool
# from langchain_openai import ChatOpenAI
# from agent.tools import emissions_tool, supplier_tool, compare_tool
# from agent.memory import memory
# from agent.llm import load_llm


# async def build_agent():
#     tools = [emissions_tool, supplier_tool, compare_tool]
#     llm = load_llm()

#     print(f"...BUILDING AGENT...\n")

#     return initialize_agent(
#         tools, 
#         llm, 
#         agent="chat-conversational-react-description", 
#         memory=memory,
#         verbose=True                                                    
#     )



