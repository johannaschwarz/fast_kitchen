import io
from typing import Annotated

from database import Database, MySQLDatabase
from exceptions import NotFoundException
from fastapi import Depends, HTTPException, Response, UploadFile, status
from fastapi.routing import APIRouter
from models import ImageID
from pi_heif import register_heif_opener
from PIL import Image as PILImage
from pydantic import ValidationError
from utils import resize_image

register_heif_opener()

image_router = APIRouter()


async def get_database_connection():
    db = MySQLDatabase()
    try:
        yield db
    finally:
        db.close()


@image_router.post("/image/create")
def create_image(
    image: UploadFile,
    database: Annotated[Database, Depends(get_database_connection)],
) -> ImageID:
    image = PILImage.open(image.file)
    image = resize_image(image)

    with io.BytesIO() as output:
        image.save(output, format="PNG", optimize=True, quality=80)
        contents = output.getvalue()

    id_ = database.create_image(contents)

    return ImageID(id_=id_)


@image_router.get("/image/{image_id}")
def get_image(
    image_id: int, database: Annotated[Database, Depends(get_database_connection)]
) -> Response:

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
def get_images_by_recipe(
    recipe_id: int, database: Annotated[Database, Depends(get_database_connection)]
) -> list[int]:

    return database.get_images_by_recipe(recipe_id)
