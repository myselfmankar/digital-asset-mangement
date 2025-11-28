from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/v1/batch",
    tags=["batch"],
)

@router.post("/images/delete", status_code=204)
def batch_delete_images(image_ids: List[int], db: Session = Depends(get_db)):
    """
    Deletes multiple images by their IDs.
    """
    deleted_count = crud.batch_delete_images(db, image_ids)
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="No images found for deletion")
    return {"status": "ok", "deleted_count": deleted_count}

@router.post("/images/favorite", response_model=List[schemas.Image])
def batch_toggle_favorite_status(image_ids: List[int], db: Session = Depends(get_db)):
    """
    Toggles the favorite status for multiple images by their IDs.
    Returns the updated list of images.
    """
    updated_images = crud.batch_toggle_favorite_status(db, image_ids)
    if not updated_images:
        raise HTTPException(status_code=404, detail="No images found for status toggle")
    # Manually attach URLs as pydantic won't call get_image_urls implicitly for a list
    for img in updated_images:
        urls = crud.get_image_urls(img) # Assuming get_image_urls is accessible from crud or re-import
        img.thumbnail_url = urls["thumbnail_url"]
        img.medium_url = urls["medium_url"]
        img.large_url = urls["large_url"]
    return updated_images
