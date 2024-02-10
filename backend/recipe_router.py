from database import database
from fastapi.routing import APIRouter
from models import Recipe

recipe_router = APIRouter()


@recipe_router.post("/recipe/create")
def create_recipe(recipe: Recipe):
    """Create a new recipe."""
    database.create_recipe(recipe)


@recipe_router.get("/recipe/specific/{recipe_id}")
def get_recipe(recipe_id: int) -> Recipe: ...


@recipe_router.get("/recipe/all")
def get_all_recipes() -> list[Recipe]:
    """Get all recipes."""
    return database.get_all_recipes()


@recipe_router.put("/recipe/{recipe_id}")
def update_recipe(recipe_id: int, recipe: Recipe): ...


@recipe_router.delete("/recipe/{recipe_id}")
def delete_recipe(recipe_id: int): ...
