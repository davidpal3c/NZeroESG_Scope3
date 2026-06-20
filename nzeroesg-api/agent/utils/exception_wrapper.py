from agent.utils.parser_service import parse_agent_input


def safe_tool(func):
    """Return a LangChain-friendly wrapper with structured input parsing."""

    def wrapper(*args, **kwargs):
        try:
            if len(args) == 1 and isinstance(args[0], str):
                parsed = parse_agent_input(args[0])
                if not parsed:
                    raise ValueError("Could not parse tool input.")
                return func(**parsed)
            elif len(args) == 1 and isinstance(args[0], dict):
                return func(**args[0])
            return func(**kwargs)
        except Exception as e:
            return f"ERROR: {str(e)}"

    return wrapper
