import json
from functools import cache


@cache
def load_config() -> dict:
    """Load the configuration from the config.json file."""
    with open("assets/config.json", encoding="utf-8") as f:
        return json.load(f)


@cache
def load_credentials() -> dict:
    """Load the credentials from the creds.json file."""
    with open("assets/creds.json", encoding="utf-8") as f:
        return json.load(f)

