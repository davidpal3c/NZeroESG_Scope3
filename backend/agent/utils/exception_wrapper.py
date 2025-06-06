from agent.utils.parser_service import parse_agent_input

def safe_tool(func):
    """
    Wraps a LangChain tool function to:
    - Parse agent input (JSON or key:value)
    - Catch all errors
    - Wrapper returns a clean error message (str), which LangChain agents can consume avoiding crashes.
    """
    # def wrapper(input):
    #     try:
    #         # parsed = parse_agent_input(input)
    #         parsed = input if isinstance(input, dict) else parse_agent_input(input)

    #         return func(parsed)
    #     except Exception as e:
    #         print(f"[TOOL ERROR] {str(e)}")
    #         return f"ERROR: {str(e)}"
        
    # return wrapper

    def wrapper(*args, **kwargs):
        try:
            # Handles both raw dicts and strings from LangChain agent
            if len(args) == 1 and isinstance(args[0], str):
                parsed = parse_agent_input(args[0])
                return func(**parsed)
            elif len(args) == 1 and isinstance(args[0], dict):
                return func(**args[0])
            return func(**kwargs)
        except Exception as e:
            print(f"[TOOL ERROR] {str(e)}")
            return f"ERROR: {str(e)}"
    return wrapper
