from config import OPENROUTER_MODEL
import tiktoken


def num_tokens_from_messages(messages, model=OPENROUTER_MODEL):
    enc = tiktoken.encoding_for_model(model)
    tokens = 0
    for m in messages:
        tokens += 4                          
        tokens += len(enc.encode(m.content))
    return tokens + 2                        

def trim_history(msgs, window=900):  
    while num_tokens_from_messages(msgs) > window and msgs:
        msgs.pop(0)
    return msgs





# def trim_history(msgs, window=900):
#     """Trim chat history to fit within token limits."""
#     total_tokens = 0
#     trimmed_msgs = []

#     for msg in reversed(msgs):
#         tokens = len(msg.content.split())
#         if total_tokens + tokens > window:
#             break
#         total_tokens += tokens
#         trimmed_msgs.append(msg)

#     return list(reversed(trimmed_msgs))