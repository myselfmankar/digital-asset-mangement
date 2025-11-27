from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os

from .. import crud, schemas
from ..database import get_db
from ..utils import get_image_urls

router = APIRouter(
    prefix="/api/v1/albums",
    tags=["albums"],
)

@router.get("/summary", response_model=List[dict])
def get_album_summary(db: Session = Depends(get_db)):
    """
    Returns a summary of albums grouped by year and month.
    """
    return crud.get_album_summary(db)

@router.get("/{year}/{month}", response_model=List[schemas.Image])
def get_album_images(year: int, month: int, db: Session = Depends(get_db)):
    """
    Returns all images for a specific album (year and month).
    """
    images = crud.get_album_images(db, year, month)
    for img in images:
        urls = get_image_urls(img)
        img.thumbnail_url = urls["thumbnail_url"]
        img.medium_url = urls["medium_url"]
        img.large_url = urls["large_url"]
    return images