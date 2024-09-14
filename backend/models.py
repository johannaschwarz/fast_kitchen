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


class User(BaseModel):
    """Model for a user."""

    username: str
    disabled: bool | None = None


class UserInDB(User):
    """Model for a user in the database."""

    id_: int
    is_admin: bool
    hashed_password: str


class NewUser(BaseModel):
    username: str
    password: str
    is_admin: bool


class Authorization(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    is_admin: bool
    disabled: bool


class TokenData(BaseModel):
    user_id: int
