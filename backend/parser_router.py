import io
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
import requests

from image_tools import process_image
from database_handler import get_database_connection
from database import Database
from extractor import extract_from_url
from models import LLMRecipe, Recipe, RecipeBase, UserInDB
from user_router import get_current_active_user
from PIL import Image as PILImage


parser_router = APIRouter(tags=["Parser"])

def process_llm_model(database: Database, user: UserInDB, recipe: LLMRecipe) -> tuple[int, RecipeBase]:
    """
    Process the LLM model output and save it to the database.
    :param database: The database connection.
    :param recipe: The recipe object containing the extracted information.
    """

    gallery_images: list[int] = []
    for image_url in recipe.gallery_image_urls:
        image_reponse = requests.get(image_url)
        if image_reponse.status_code == 200:
            image = PILImage.open(io.BytesIO(image_reponse.content))
            data = process_image(image)
            image_id = database.create_image(data)
            gallery_images.append(image_id)

    recipe.gallery_images = gallery_images
    recipe.cover_image = gallery_images[0] if gallery_images else None

    recipe = RecipeBase.model_validate(recipe)

    return database.create_recipe(recipe, user), recipe

    

@parser_router.post("/parse-external-recipe")
async def parse_recipe(
    url: str,
    user: Annotated[UserInDB, Depends(get_current_active_user)],
    database: Annotated[Database, Depends(get_database_connection)],
) -> Recipe:
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    try:
        llm_recipe = extract_from_url(url)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    id_, recipe = process_llm_model(database, user, llm_recipe)

    return Recipe(id_=id_, **recipe.model_dump())
