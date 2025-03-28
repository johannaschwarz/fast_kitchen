import io
from typing import Annotated

from database import Database
from database_handler import get_database_connection
from exceptions import NotFoundException
from fastapi import Depends, HTTPException, Response, UploadFile, status
from fastapi.routing import APIRouter
from models import ImageID, UserInDB
from pi_heif import register_heif_opener
from PIL import Image as PILImage
from user_router import get_current_active_user
from utils import resize_image

register_heif_opener()

image_router = APIRouter(tags=["Image"])


@image_router.post("/image/create")
def create_image(
    image: UploadFile,
    database: Annotated[Database, Depends(get_database_connection)],
    _: Annotated[UserInDB, Depends(get_current_active_user)],
) -> ImageID:
    image = PILImage.open(image.file)
    image = resize_image(image)

    with io.BytesIO() as output:
        image.save(output, format="webp", optimize=True, quality=80)
        contents = output.getvalue()

    id_ = database.create_image(contents)

    return ImageID(id_=id_)


@image_router.get("/image/{image_id}")
def get_image(
    image_id: int, database: Annotated[Database, Depends(get_database_connection)]
) -> Response:

    try:
        data = database.get_image(image_id)
        img = PILImage.open(io.BytesIO(data))
        return Response(content=data, media_type=f"image/{img.format.lower()}")
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@image_router.get("/image/recipe/{recipe_id}")
def get_images_by_recipe(
    recipe_id: int, database: Annotated[Database, Depends(get_database_connection)]
) -> list[int]:

    return database.get_images_by_recipe(recipe_id)


@image_router.delete("/image/{image_id}")
def delete_image(
    image_id: int,
    database: Annotated[Database, Depends(get_database_connection)],
    _: Annotated[UserInDB, Depends(get_current_active_user)],
) -> None:

    try:
        database.delete_image(image_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
