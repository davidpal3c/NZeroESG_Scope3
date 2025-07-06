from langchain.memory import ConversationBufferMemory
from agent.llm import load_llm

memory = ConversationBufferMemory(
    llm=load_llm(),
    max_token_limit=750,
    memory_key="chat_history", 
    return_messages=True
)
