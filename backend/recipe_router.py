from typing import Annotated

from database import Database, MySQLDatabase
from exceptions import NotFoundException, UpdateFailedException
from fastapi import BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.routing import APIRouter
from models import Recipe, RecipeBase, RecipeListing
from pydantic import ValidationError

recipe_router = APIRouter()


class DatabaseContextManager:
    """A context manager for the database connection."""

    def __init__(self):
        self.db = MySQLDatabase()

    def __enter__(self):
        return self.db

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db.close()


async def get_database_connection():
    with DatabaseContextManager() as database:
        yield database


def remove_unused_images():
    with DatabaseContextManager() as database:
        database.delete_unused_images()


@recipe_router.post("/recipe/create")
def create_recipe(
    recipe: RecipeBase,
    database: Annotated[Database, Depends(get_database_connection)],
    background_tasks: BackgroundTasks,
) -> Recipe:
    id_ = database.create_recipe(recipe)

    background_tasks.add_task(remove_unused_images)

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
    database: Annotated[Database, Depends(get_database_connection)],
    limit: Annotated[
        int,
        Query(
            title="Limit",
            description="The maximum number of recipes to return",
            example=10,
        ),
    ] = None,
    page: Annotated[
        int, Query(title="Page", description="The page number", example=1)
    ] = None,
) -> list[RecipeListing]:
    return database.get_all_recipes(limit=limit, page=page)


@recipe_router.get("/recipe/filtered")
def get_filtered_recipes(
    database: Annotated[Database, Depends(get_database_connection)],
    categories: Annotated[
        list[str],
        Query(
            title="Categories",
            description="A list of categories to filter recipes by",
            example=["Asian", "Breakfast"],
        ),
    ] = None,
    search: Annotated[
        str,
        Query(
            title="Search string",
            description="A custom search string to filter recipes by",
            example="Spaghetti",
        ),
    ] = None,
    limit: Annotated[
        int,
        Query(
            title="Limit",
            description="The maximum number of recipes to return",
            example=10,
        ),
    ] = None,
    page: Annotated[
        int, Query(title="Page", description="The page number", example=1)
    ] = None,
) -> list[RecipeListing]:
    return database.get_all_recipes(
        limit=limit, page=page, search_string=search, filter_categories=categories
    )


@recipe_router.put("/recipe/{recipe_id}")
def update_recipe(
    recipe: Recipe,
    database: Annotated[Database, Depends(get_database_connection)],
    background_tasks: BackgroundTasks,
) -> Recipe:
    try:
        database.update_recipe(recipe)
    except UpdateFailedException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e

    background_tasks.add_task(remove_unused_images)
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


@recipe_router.get("/category/all")
def get_all_categories(
    database: Annotated[Database, Depends(get_database_connection)]
) -> list[str]:
    return database.get_categories()
