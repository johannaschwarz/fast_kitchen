from fastapi.routing import APIRouter

image_router = APIRouter()


@image_router.post("/image/create")
def create_image(image: dict): ...


@image_router.get("/image/{image_id}")
def get_image(image_id: int): ...


@image_router.delete("/image/{image_id}")
def delete_image(image_id: int): ...
