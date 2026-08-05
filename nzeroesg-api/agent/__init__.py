from langchain import hub
from langchain.agents import AgentExecutor, create_structured_chat_agent

from agent.llm import load_llm
from agent.tools import compare_shipping_emissions, distance_tool, emissions_tool


async def build_agent():
    tools = [emissions_tool, compare_shipping_emissions, distance_tool]
    llm = load_llm()
    prompt = hub.pull("hwchase17/structured-chat-agent")
    agent = create_structured_chat_agent(llm=llm, tools=tools, prompt=prompt)

    return AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=False,
        handle_parsing_errors=True,
        max_iterations=8,
        early_stopping_method="generate",
    )
