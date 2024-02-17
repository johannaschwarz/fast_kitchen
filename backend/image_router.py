from typing import Annotated

from database import database
from exceptions import NotFoundException
from fastapi import HTTPException, UploadFile, status
from fastapi.routing import APIRouter
from models import Image, ImageBase
from pydantic import ValidationError

image_router = APIRouter()


@image_router.post("/image/create")
def create_image(recipe_id: int, image: UploadFile):
    image_data = ImageBase(recipe_id=recipe_id, image=image.file.read())
    id_ = database.create_image(image_data)
    image_data.image = ""
    return image_data


@image_router.get("/image/{image_id}")
def get_image(image_id: int):
    try:
        return database.get_image(image_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@image_router.get("/image/recipe/{recipe_id}")
def get_images_by_recipe(recipe_id: int):

    return database.get_images_by_recipe(recipe_id)


@image_router.delete("/image/{image_id}")
def delete_image(image_id: int):
    try:
        database.delete_image(image_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
