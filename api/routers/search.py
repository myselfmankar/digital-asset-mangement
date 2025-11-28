from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List


from .. import schemas
from ..database import get_db
from ..services import ai_search
from ..utils import get_image_urls

router = APIRouter(
    prefix="/api/v1/search",
    tags=["search"],
)

class AIQuery(BaseModel):
    query: str

@router.post("/ai", response_model=List[schemas.Image])
def ai_search_endpoint(query: AIQuery, db: Session = Depends(get_db)):
    """
    Performs a natural language search for images.
    """
    try:
        images = ai_search.perform_ai_search(db, query.query)
        # Add computed URL fields to each image object before returning
        for img in images:
            urls = get_image_urls(img)
            img.thumbnail_url = urls["thumbnail_url"]
            img.medium_url = urls["medium_url"]
            img.large_url = urls["large_url"]
        return images
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
