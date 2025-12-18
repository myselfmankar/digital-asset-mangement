from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas
from ..database import get_db
from ..utils import get_image_urls

router = APIRouter(
    prefix="/api/v1/duplicates",
    tags=["duplicates"],
)

@router.get("", response_model=List[List[schemas.Image]])
def get_duplicate_image_groups(db: Session = Depends(get_db)):
    """
    Returns groups of images that are considered duplicates (based on pHash).
    """
    duplicate_groups = crud.get_duplicate_images(db)
    for group in duplicate_groups:
        for img in group:
            urls = get_image_urls(img)
            img.thumbnail_url = urls["thumbnail_url"]
            img.medium_url = urls["medium_url"]
            img.large_url = urls["large_url"]
    return duplicate_groups
