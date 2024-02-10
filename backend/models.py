from pydantic import BaseModel


class Recipe(BaseModel):
    """A recipe model."""

    id_: int = -1
    name: str
    description: str
    ingredients: list[str]
    steps: list[str]
    labels: list[str]


class Image(BaseModel):
    """An image model."""

    id_: int = -1
    image: bytes
