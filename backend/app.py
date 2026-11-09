import os
from contextlib import asynccontextmanager

from db.database_handler import init_database, shutdown_database
from routers import gate_router
from routers import image_router
from routers import parser_router
from routers import recipe_router
from routers import user_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

__version__ = "0.6.0"


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_database()
    yield
    await shutdown_database()


app = FastAPI(
    title="FastKitchen",
    version=__version__,
    lifespan=lifespan,
)

frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        (
            "https://flottekueche.de,"
            "https://www.flottekueche.de,"
            "http://localhost:5173,"
            "http://127.0.0.1:5173"
        ),
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    # Credentialed cookies require an explicit origin, not "*".
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Gate-Required"],
)

app.include_router(gate_router.gate_router)
app.include_router(recipe_router.recipe_router)
app.include_router(image_router.image_router)
app.include_router(user_router.user_router)
app.include_router(parser_router.parser_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
