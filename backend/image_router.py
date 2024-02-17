from database import database
from exceptions import NotFoundException
from fastapi import HTTPException, status
from fastapi.routing import APIRouter
from models import Image, ImageBase
from pydantic import ValidationError

image_router = APIRouter()


@image_router.post("/image/create")
def create_image(image: ImageBase):
    id_ = database.create_image(image)

    return Image(id_=id_, **image.model_dump())


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


@image_router.delete("/image/{image_id}")
def delete_image(image_id: int):
    try:
        database.delete_image(image_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
