from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from extraction.extractor import extract_from_url
from models import RecipeBase, UserInDB
from user_router import get_current_active_user

parser_router = APIRouter(tags=["Parser"])


@parser_router.post("/parse-external-recipe")
async def parse_recipe(
    url: str,
    user: Annotated[UserInDB, Depends(get_current_active_user)],
) -> RecipeBase:
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    if url.startswith("http"):
        return extract_from_url(url)
