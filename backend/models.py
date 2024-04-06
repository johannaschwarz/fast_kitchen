from enum import StrEnum

from pydantic import BaseModel


class UnitEnum(StrEnum):
    """Enum for units of measurement."""

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
    description: str | None = None
    portions: int
    ingredients: list[Ingredient]
    cooking_time: int
    steps: list["RecipeStep"]
    categories: list[str]
    gallery_images: list[int] | None = None
    cover_image: int | None = None


class Recipe(RecipeBase):
    """A recipe with all attributes."""

    id_: int = -1


class RecipeListing(BaseModel):
    """A slimmer recipe model for listings."""

    id_: int = -1
    title: str
    description: str
    categories: list[str]
    cover_image: int | None = None
    rating: float | None = None


class RecipeStep(BaseModel):
    """A recipe step model."""

    order_id: int
    step: str
    images: list[int] | None = None


class ImageID(BaseModel):
    """An image model with an id."""

    id_: int = -1
