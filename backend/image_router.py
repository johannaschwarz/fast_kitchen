from fastapi.routing import APIRouter

image_router = APIRouter()


@image_router.get("/image/{image_id}")
def get_image(image_id: int): ...
