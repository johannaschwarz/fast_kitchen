import logging

from openai import OpenAI

from models.recipe import LLMRecipe
from utils import load_credentials

client = OpenAI(api_key=load_credentials()["openai_key"])


def extract_from_user_text(recipe_data: str) -> LLMRecipe:
    """
    Extracts recipe information from the provided recipe data.
    :param recipe_data: The recipe data in string format.
    :return: A recipe object containing the extracted information.
    """


def extract_from_web_data(recipe_data: str) -> LLMRecipe:
    """
    Extracts recipe information from the provided recipe data.
    :param recipe_data: The recipe data in string format.
    :return: A recipe object containing the extracted information.
    """

    completion = client.beta.chat.completions.parse(
        model="gpt-5-nano",
        messages=[
            {
                "role": "system",
                "content": """You are a web scraper.
                You are given a piece of data that holds information about a recipe.
                You are also given a schema that is the target format of the recipe.
                You need to extract the information from the data and return it in the schema format.
                IF THE DATA IS NOT A RECIPE FOR A MEAL OR DRINK RETURN NOTHING!!!""",
            },
            {
                "role": "user",
                "content": recipe_data,
            },
        ],
        response_format=LLMRecipe,
    )

    logging.info(f"OpenAI Completion Usage: {completion.usage}")
    if recipe := completion.choices[0].message.parsed:
        return recipe
    raise ValueError("No recipe found in the provided data.")
