import asyncio
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


background_tasks = set()


def run_background_task(task):
    """Run a background task."""
    loop = asyncio.get_event_loop()
    task = loop.create_task(task)
    background_tasks.add(task)
    task.add_done_callback(background_tasks.discard)
