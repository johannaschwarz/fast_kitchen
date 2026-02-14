from typing import Annotated

from db.database import Database, SortByEnum, SortOrderEnum
from db.database_handler import AsyncDatabaseContextManager, get_database_connection
from exceptions import NotFoundException, UpdateFailedException
from fastapi import BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.routing import APIRouter
from fastapi.security import OAuth2PasswordBearer
from models.recipe import CategoryEnum, Recipe, RecipeBase, RecipeListing
from models.user import UserInDB
from pydantic import ValidationError
from routers.user_router import get_current_active_user

recipe_router = APIRouter(tags=["Recipe"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def remove_unused_images():
    async with AsyncDatabaseContextManager() as database:
        await database.delete_unused_images()


@recipe_router.post("/recipe/create")
async def create_recipe(
    recipe: RecipeBase,
    database: Annotated[Database, Depends(get_database_connection)],
    user: Annotated[UserInDB, Depends(get_current_active_user)],
    background_tasks: BackgroundTasks,
) -> Recipe:
    id_ = await database.create_recipe(recipe, user)

    background_tasks.add_task(remove_unused_images)

    return Recipe(id_=id_, **recipe.model_dump())


@recipe_router.get("/recipe/specific/{recipe_id}")
async def get_recipe(
    recipe_id: int, database: Annotated[Database, Depends(get_database_connection)]
) -> Recipe:
    try:
        return await database.get_recipe(recipe_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@recipe_router.get("/recipe/all")
async def get_all_recipes(
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
    sort_by: Annotated[
        SortByEnum,
        Query(
            title="Sort by",
            description="The field to sort by",
            example=SortByEnum.CLICKS,
        ),
    ] = SortByEnum.CLICKS,
    sort_order: Annotated[
        SortOrderEnum,
        Query(
            title="Sort order",
            description="The order to sort by",
            example=SortOrderEnum.DESC,
        ),
    ] = SortOrderEnum.DESC,
) -> list[RecipeListing]:
    return await database.get_all_recipes(
        limit=limit, page=page, sort_by=sort_by, sort_order=sort_order
    )


@recipe_router.get("/recipe/filtered")
async def get_filtered_recipes(
    database: Annotated[Database, Depends(get_database_connection)],
    categories: Annotated[
        list[CategoryEnum],
        Query(
            title="Categories",
            description="A list of categories to filter recipes by",
            example=[CategoryEnum.ASIAN, CategoryEnum.VEGETARIAN],
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
    sort_by: Annotated[
        SortByEnum,
        Query(
            title="Sort by",
            description="The field to sort by",
            example=SortByEnum.CLICKS,
        ),
    ] = SortByEnum.CLICKS,
    sort_order: Annotated[
        SortOrderEnum,
        Query(
            title="Sort order",
            description="The order to sort by",
            example=SortOrderEnum.DESC,
        ),
    ] = SortOrderEnum.DESC,
) -> list[RecipeListing]:
    return await database.get_all_recipes(
        limit=limit,
        page=page,
        search_string=search,
        filter_categories=categories,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@recipe_router.put("/recipe/{recipe_id}")
async def update_recipe(
    recipe: Recipe,
    database: Annotated[Database, Depends(get_database_connection)],
    user: Annotated[UserInDB, Depends(get_current_active_user)],
    background_tasks: BackgroundTasks,
) -> Recipe:
    if not await database.is_authorized(user.id_, recipe.id_):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is not authorized to update the recipe.",
        )

    try:
        await database.update_recipe(recipe)
    except UpdateFailedException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e

    background_tasks.add_task(remove_unused_images)
    return recipe


@recipe_router.delete("/recipe/{recipe_id}")
async def delete_recipe(
    recipe_id: int,
    database: Annotated[Database, Depends(get_database_connection)],
    user: Annotated[UserInDB, Depends(get_current_active_user)],
):
    if not await database.is_authorized(user.id_, recipe_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is not authorized to delete the recipe.",
        )
    try:
        await database.delete_recipe(recipe_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@recipe_router.get("/recipe/category/{category}")
async def get_recipes_by_category(
    category: CategoryEnum,
    database: Annotated[Database, Depends(get_database_connection)],
) -> list[int]:
    return await database.get_recipes_by_category(category)


@recipe_router.get("/category/all")
async def get_all_categories(
    database: Annotated[Database, Depends(get_database_connection)],
) -> list[CategoryEnum]:
    return await database.get_categories()
