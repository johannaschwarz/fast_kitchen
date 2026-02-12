from enum import StrEnum

from pydantic import BaseModel, Field


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

    title: str
    description: str | None = None
    portions: int
    ingredients: list[Ingredient]
    cooking_time: int
    steps: list["RecipeStep"]
    categories: list[str]
    gallery_images: list[int] | None = None
    cover_image: int | None = None


class LLMRecipe(RecipeBase):
    description: str | None = Field(
        description="A short description of the recipe. Focus on the meal not original recipe text, keep it one sentence and describe it in the simplest way."
    )
    gallery_image_urls: list[str] = Field(
        description="A list of recipe image urls contained in the data that should be included in the recipe."
    )
    categories: list[str] = Field(
        description="A list of recipe categories that should be included in the recipe. Focus on the most important labels. Less is more!"
    )
    is_a_recipe: bool = Field(
        description="True if the data is a recipe for food or a drink, False otherwise."
    )


class Recipe(RecipeBase):
    """A recipe with all attributes."""

    id_: int = -1
    creator_name: str | None = None
    creator_id: int | None = None
    clicks: int | None = None


class RecipeListing(BaseModel):
    """A slimmer recipe model for listings."""

    id_: int = -1
    title: str
    creator: str | None = None
    description: str
    categories: list[str]
    cover_image: int | None = None
    rating: float | None = None
    clicks: int | None = None
    cooking_time: int


class RecipeStep(BaseModel):
    """A recipe step model."""

    order_id: int
    step: str
    images: list[int] | None = None


class ImageID(BaseModel):
    """An image model with an id."""

    id_: int = -1
