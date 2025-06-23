import logging

import requests
from bs4 import BeautifulSoup
from models import LLMRecipe
from openai import OpenAI
from utils import load_credentials

logging.getLogger().setLevel(logging.INFO)

client = OpenAI(api_key=load_credentials()["openai_key"])


def extract_from_data(recipe_data: str) -> LLMRecipe:
    """
    Extracts recipe information from the provided recipe data.
    :param recipe_data: The recipe data in string format.
    :return: A recipe object containing the extracted information.
    """

    completion = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
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


def _clean_data(data: str) -> str:
    # Check if the data is HTML
    if "<html" in data.lower() and "</html>" in data.lower():
        soup = BeautifulSoup(data, "html.parser")
        # Remove script, style, and head tags
        for tag in soup(["script", "style", "head"]):
            tag.decompose()
        # Return cleaned text
        return soup.get_text(separator=" ", strip=True)
    return data


def extract_from_url(recipe_url: str) -> LLMRecipe:
    """
    Extracts recipe information from the provided recipe URL.
    :param recipe_url: The URL of the recipe.
    :return: A recipe object containing the extracted information.
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        )
    }
    data = requests.get(recipe_url, headers=headers)
    if data.status_code == 200:
        text_data = data.text

        cover_img = None

        if "<html" in text_data.lower():
            soup = BeautifulSoup(text_data, "html.parser")
            # Clean the data to remove unnecessary HTML tags
            text_data = _clean_data(text_data)

            if (
                og_image := soup.find("meta", property="og:image")
            ) and og_image.has_attr("content"):
                cover_img = og_image.attrs.get("content")

        model = extract_from_data(text_data)

        if not model.is_a_recipe:
            raise ValueError("The provided data is not a recipe.")

        if cover_img:
            model.gallery_image_urls.append(cover_img)

        # Add the URL to the recipe
        model.description += f"\n\nOriginal: {recipe_url}"

        return model

    raise ValueError(
        f"Failed to fetch recipe data from the URL. {recipe_url} returned HTTP {data.status_code} Body: {data.text}"
    )
