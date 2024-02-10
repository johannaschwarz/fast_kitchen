from fastapi.routing import APIRouter
from pydantic import BaseModel

recipe_router = APIRouter()


class Recipe(BaseModel):
    """A recipe model."""

    id_: int = -1
    name: str
    description: str
    ingredients: list[str]
    steps: list[str]
    labels: list[str]


@recipe_router.get("/recipe/{recipe_id}")
def get_recipe(recipe_id: int) -> Recipe: ...


@recipe_router.get("/recipe/all")
def get_all_recipes() -> list[Recipe]: ...


@recipe_router.post("/recipe/create")
def create_recipe(recipe: Recipe): ...


@recipe_router.put("/recipe/{recipe_id}")
def update_recipe(recipe_id: int, recipe: Recipe): ...


@recipe_router.delete("/recipe/{recipe_id}")
def delete_recipe(recipe_id: int): ...
