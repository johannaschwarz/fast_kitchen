from enum import StrEnum

from pydantic import BaseModel


class UnitEnum(StrEnum):
    G = "g"
    KG = "kg"
    ML = "ml"
    L = "l"
    PCS = "pcs"
    TBSP = "tbsp"
    TSP = "tsp"


class Ingredient(BaseModel):
    """An ingredient model."""

    name: str
    unit: UnitEnum
    amount: float
    group: str | None = None


class Step(BaseModel):
    """A step model."""

    instructions: str


class RecipeBase(BaseModel):
    """The base recipe model (used when creating a recipe)."""

    # TODO: add user/creator

    title: str
    description: str
    portions: int
    ingredients: list[Ingredient]
    cooking_time: int
    steps: list[str]
    categories: list[str]


class RecipeStored(RecipeBase):
    """A recipe how it is represented in the database."""

    id_: int = -1
    cover_image: int | None = None


class Recipe(RecipeStored):
    """A complete recipe model with images."""

    images: list[int] | None = None


class RecipeListing(BaseModel):
    """A slimmer recipe model for listings."""

    id_: int = -1
    title: str
    description: str
    categories: list[str]
    cover_image: int | None = None
    rating: float | None = None


class ImageBase(BaseModel):
    """An image model."""

    recipe_id: int
    image: bytes
