from typing import Annotated

from db.database import Database
from db.database_handler import get_database_connection
from services.extractor import extract_from_url, extract_from_text
from fastapi import APIRouter, Depends, HTTPException
from models.recipe import LLMRecipe, Recipe, RecipeBase
from models.user import UserInDB
from routers.user_router import get_current_active_user

parser_router = APIRouter(tags=["Parser"])


async def process_llm_model(
    database: Database, user: UserInDB, recipe: LLMRecipe
) -> tuple[int, RecipeBase]:
    """
    Process the LLM model output and save it to the database.
    :param database: The database connection.
    :param recipe: The recipe object containing the extracted information.
    """
    recipe = RecipeBase.model_validate(recipe)

    return await database.create_recipe(recipe, user), recipe


@parser_router.post("/parse-external-recipe")
async def parse_external_recipe(
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

    id_, recipe = await process_llm_model(database, user, llm_recipe)

    return Recipe(id_=id_, **recipe.model_dump())


@parser_router.post("/parse-recipe-text")
async def parse_recipe_text(
    text: str,
    user: Annotated[UserInDB, Depends(get_current_active_user)],
    database: Annotated[Database, Depends(get_database_connection)],
) -> Recipe:
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    try:
        llm_recipe = extract_from_text(text)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    id_, recipe = await process_llm_model(database, user, llm_recipe)

    return Recipe(id_=id_, **recipe.model_dump())
