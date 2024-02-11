from database import database
from exceptions import NotFoundException
from fastapi import HTTPException, status
from fastapi.routing import APIRouter
from models import Recipe, RecipeBase
from pydantic import ValidationError

recipe_router = APIRouter()


@recipe_router.post("/recipe/create")
def create_recipe(recipe: RecipeBase) -> Recipe:
    id_ = database.create_recipe(recipe)

    return Recipe(id_=id_, **recipe.model_dump())


@recipe_router.get("/recipe/specific/{recipe_id}")
def get_recipe(recipe_id: int) -> Recipe:
    try:
        return database.get_recipe(recipe_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@recipe_router.get("/recipe/all")
def get_all_recipes() -> list[Recipe]:
    return database.get_all_recipes()


@recipe_router.put("/recipe/{recipe_id}")
def update_recipe(recipe_id: int, recipe: Recipe): ...


@recipe_router.delete("/recipe/{recipe_id}")
def delete_recipe(recipe_id: int): ...
