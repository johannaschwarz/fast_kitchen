from pydantic import BaseModel


class RecipeBase(BaseModel):
    """A recipe model."""

    # TODO: add rating
    # TODO: add user/creator

    title: str
    description: str
    # TODO: add ingredient model with name, unit and amount
    ingredients: list[str]
    steps: list[str]
    categories: list[str]


class RecipeStored(RecipeBase):
    """A recipe model."""

    id_: int = -1


class Recipe(RecipeStored):
    """A recipe model."""

    images: list[int]


class ImageBase(BaseModel):
    """An image model."""

    recipe_id: int
    image: bytes


class Image(ImageBase):
    """An image model."""

    id_: int = -1
