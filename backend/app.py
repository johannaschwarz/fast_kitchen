import image_router
import recipe_router
from fastapi import FastAPI

app = FastAPI(title="FastKitchen")

app.include_router(recipe_router.recipe_router)
app.include_router(image_router.image_router)
