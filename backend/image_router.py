import io

from database import database
from exceptions import NotFoundException
from fastapi import HTTPException, Response, UploadFile, status
from fastapi.routing import APIRouter
from models import ImageBase
from PIL import Image as PILImage
from pydantic import ValidationError

image_router = APIRouter()


@image_router.post("/image/create")
def create_image(recipe_id: int, image: UploadFile) -> int:

    image = PILImage.open(image.file)

    with io.BytesIO() as output:
        image.save(output, format="PNG")
        contents = output.getvalue()

    image_model = ImageBase(recipe_id=recipe_id, image=contents)
    id_ = database.create_image(image_model)

    return id_


@image_router.get("/image/{image_id}")
def get_image(image_id: int) -> Response:

    try:
        image = database.get_image(image_id)
        return Response(content=image, media_type="image/png")
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@image_router.get("/image/recipe/{recipe_id}")
def get_images_by_recipe(recipe_id: int) -> list[int]:

    return database.get_images_by_recipe(recipe_id)


@image_router.delete("/image/{image_id}")
def delete_image(image_id: int):

    try:
        database.delete_image(image_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
