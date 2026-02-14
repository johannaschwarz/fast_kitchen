from utils import load_config
import logging
import os

from models.recipe import LLMRecipe
from utils import load_credentials
from langchain.chat_models import init_chat_model
from langchain_core.callbacks import UsageMetadataCallbackHandler

MODEL = load_config()["extraction_llm"]
os.environ["OPENAI_API_KEY"] = load_credentials()["openai_key"]

model = init_chat_model()
logging.getLogger().setLevel(logging.INFO)

WEB_SCRAPER_PROMPT = """You are a web scraper.
                You only output German. Even ingredients. You only use celsius for temperature.
                You are given a piece of data that holds information about a recipe.
                You are also given a schema that is the target format of the recipe.
                You need to extract the information from the data and return it in the schema format.
                IF THE DATA IS NOT A RECIPE FOR A MEAL OR DRINK RETURN NOTHING!!!"""

USER_TEXT_PROMPT = """You are a recipe extractor.
                You only output German. Even ingredients. You only use celsius for temperature.
                You are given a piece of data that holds information about a recipe.
                You are also given a schema that is the target format of the recipe.
                You need to extract the information from the data and return it in the schema format.
                IF THE DATA IS NOT A RECIPE FOR A MEAL OR DRINK RETURN NOTHING!!!"""


def call_llm(system_prompt: str, recipe_data: str) -> LLMRecipe:
    """
    Calls the configured LLM with the given system_prompt and recipe_data.
    :param system_prompt: The system_prompt to use.
    :param recipe_data: The recipe data to pass to the LLM.
    :return: A recipe object containing the extracted information.
    """
    usage_callback = UsageMetadataCallbackHandler()
    response = model.with_structured_output(LLMRecipe).invoke(
        [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": recipe_data,
            },
        ],
        config={"configurable": {"model": MODEL}, "callbacks": [usage_callback]},
    )

    logging.info(f"Token Usage: {usage_callback.usage_metadata}")
    return response
