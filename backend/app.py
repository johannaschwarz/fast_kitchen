import image_router
import parser_router
import recipe_router
import user_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="FastKitchen",
    version="0.3.3",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recipe_router.recipe_router)
app.include_router(image_router.image_router)
app.include_router(user_router.user_router)
app.include_router(parser_router.parser_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
