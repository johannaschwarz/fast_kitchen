from typing import Annotated

from database import Database, MySQLDatabase
from exceptions import NotFoundException, UpdateFailedException
from fastapi import Depends, HTTPException, status
from fastapi.routing import APIRouter
from models import Recipe, RecipeBase, RecipeListing
from pydantic import ValidationError

recipe_router = APIRouter()


async def get_database_connection():
    db = MySQLDatabase()
    try:
        yield db
    finally:
        db.close()


@recipe_router.post("/recipe/create")
def create_recipe(
    recipe: RecipeBase, database: Annotated[Database, Depends(get_database_connection)]
) -> Recipe:
    id_ = database.create_recipe(recipe)

    return Recipe(id_=id_, **recipe.model_dump())


@recipe_router.get("/recipe/specific/{recipe_id}")
def get_recipe(
    recipe_id: int, database: Annotated[Database, Depends(get_database_connection)]
) -> Recipe:
    try:
        return database.get_recipe(recipe_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@recipe_router.get("/recipe/all")
def get_all_recipes(
    database: Annotated[Database, Depends(get_database_connection)]
) -> list[RecipeListing]:
    return database.get_all_recipes()


@recipe_router.put("/recipe/{recipe_id}")
def update_recipe(
    recipe: Recipe,
    database: Annotated[Database, Depends(get_database_connection)],
) -> Recipe:
    try:
        database.update_recipe(recipe)
    except UpdateFailedException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e
    return recipe


@recipe_router.delete("/recipe/{recipe_id}")
def delete_recipe(
    recipe_id: int, database: Annotated[Database, Depends(get_database_connection)]
):
    try:
        database.delete_recipe(recipe_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@recipe_router.get("/recipe/category/{category}")
def get_recipes_by_category(
    category: str, database: Annotated[Database, Depends(get_database_connection)]
) -> list[int]:
    return database.get_recipes_by_category(category)
