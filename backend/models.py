from enum import StrEnum

from pydantic import BaseModel


class UnitEnum(StrEnum):
    g = "g"
    kg = "kg"
    ml = "ml"
    l = "l"
    pcs = "pcs"


class Ingredient(BaseModel):
    """An ingredient model."""

    name: str
    unit: UnitEnum
    amount: float


class Step(BaseModel):
    """A step model."""

    instructions: str


class RecipeBase(BaseModel):
    """A recipe model."""

    # TODO: add user/creator

    title: str
    description: str
    portions: int
    ingredients: list[Ingredient]
    steps: list[str]
    categories: list[str]


class RecipeStored(RecipeBase):
    """A recipe model with an id."""

    id_: int = -1


class Recipe(RecipeStored):
    """A complete recipe model with images."""

    images: list[int]


class RecipeListing(BaseModel):
    """A slimmer recipe model for listings."""

    id_: int = -1
    title: str
    description: str
    cover_image: int
    rating: float


class ImageBase(BaseModel):
    """An image model."""

    recipe_id: int
    image: bytes


class Image(ImageBase):
    """An image model."""

    id_: int = -1
