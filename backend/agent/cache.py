import hashlib

_emissions_cache = {}                                   # key: hash, value: emissions result
debug_registry = {}                                     # key: hash, value: original message

def make_cache_key(weight, distance, method):
    normalized = f"{round(weight, 1)}:{round(distance, 1)}:{method.lower()}"
    return hashlib.md5(normalized.encode()).hexdigest()