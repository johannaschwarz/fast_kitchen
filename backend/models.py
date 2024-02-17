from pydantic import BaseModel


class RecipeBase(BaseModel):
    """A recipe model."""

    name: str
    description: str
    ingredients: list[str]
    steps: list[str]
    categories: list[str]


class Recipe(RecipeBase):
    """A recipe model."""

    id_: int = -1


class ImageBase(BaseModel):
    """An image model."""

    recipe_id: int
    image: bytes


class Image(ImageBase):
    """An image model."""

    id_: int = -1
