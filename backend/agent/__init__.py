from langchain.agents import create_structured_chat_agent, AgentExecutor
from langchain import hub
from langchain.prompts import ChatPromptTemplate
from agent.tools import emissions_tool, supplier_tool, compare_shipping_emissions
from agent.memory import memory
from agent.llm import load_llm
from agent.prompts import initial_prompt



async def build_agent():
    tools = [emissions_tool, supplier_tool, compare_shipping_emissions]
    llm = load_llm()

    print(f"...BUILDING AGENT...\n")

    prompt = hub.pull("hwchase17/structured-chat-agent")
    # prompt = ChatPromptTemplate.from_messages([
    #     ("system", initial_prompt),
    #     ("user", "{input}"),
    #     ("tool_names", "{tool_names}"),
    #     ("tools", "{tools}"),
    #     ("agent_scratchpad", "{agent_scratchpad}")
    # ])

    # tool aware agent
    agent = create_structured_chat_agent(llm=llm, tools=tools, prompt=prompt)

    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        memory=memory,
        verbose=True,                                               # to see step-by-step reasoning
        handle_parsing_errors=True
    )

    return agent_executor

    # return initialize_agent(
    #     tools, 
    #     llm, 
    #     agent="chat-conversational-react-description", 
    #     memory=memory,
    #     verbose=True                                                    # to see step-by-step reasoning
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
#         verbose=True                                                    # to see step-by-step reasoning
#     )



