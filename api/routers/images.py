from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os

from .. import crud, schemas
from ..database import get_db
from ..services import image_processing

router = APIRouter(
    prefix="/api/v1/images",
    tags=["images"],
)

@router.post("", response_model=schemas.Image, status_code=201)
def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload and synchronously process a new image file.
    """
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.heic', '.heif')):
        raise HTTPException(
            status_code=400,
            detail="File type not supported. Please upload PNG, JPG, JPEG, HEIC, or HEIF"
        )
    
    filepath = os.path.join("uploads", file.filename)
    filename = file.filename # Store filename for clarity

    # Check if image already exists and is completed
    existing_completed_image = crud.get_image_by_filename_and_status(db, filename=filename, status="completed")
    if existing_completed_image:
        # If it's already completed, return it. Status code 200 is acceptable for POST if resource already exists.
        return existing_completed_image

    # Check if a DB entry exists in a non-completed state
    existing_image_db_entry = crud.get_image_by_filename(db, filename=filename)

    try:
        # Save or overwrite the file on disk
        with open(filepath, 'wb') as out_file:
            content = file.file.read()
            out_file.write(content)
        
        db_image = None
        if existing_image_db_entry:
            # Image exists in DB but is not completed, so re-process it
            db_image = existing_image_db_entry
            crud.update_image_status(db, image_id=db_image.id, status="processing")
        else:
            # Create a new placeholder image in the database
            db_image = crud.create_placeholder_image(db, filename=filename, filepath=filepath)

        # Directly call the processing function and wait for it to complete
        image_processing.process_and_save_image_metadata_sync(filepath, db_image.id, db)
        
        # Fetch the fully processed image data to return to the client
        processed_image = crud.get_image_by_id(db, image_id=db_image.id)
        if not processed_image:
            raise HTTPException(status_code=500, detail="Failed to process and retrieve the image.")

        return processed_image
        
    except Exception as e:
        # Only remove the file on disk if it was a new file that failed to process.
        # If it was an existing file (reprocessing), we keep the (potentially updated) file.
        if os.path.exists(filepath) and not existing_image_db_entry:
            os.remove(filepath)
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@router.get("", response_model=List[schemas.Image])
def read_images(skip: int = 0, limit: int = 20, sort_by: str = "upload_date", db: Session = Depends(get_db)):
    images = crud.get_images(db, skip=skip, limit=limit, sort_by=sort_by)
    for img in images:
        img.thumbnail_url = f"/uploads/thumbnails/{img.filename}"
        img.medium_url = f"/uploads/{img.filename}"
        img.large_url = f"/uploads/{img.filename}"
    return images

@router.post("/{image_id}/favorite", response_model=schemas.Image)
def toggle_favorite(image_id: int, db: Session = Depends(get_db)):
    """
    Toggles the 'is_favorite' status of an image.
    """
    db_image = crud.toggle_image_favorite_status(db, image_id=image_id)
    if not db_image:
        raise HTTPException(status_code=4.04, detail="Image not found")
    return db_image

@router.delete("/{image_id}", status_code=204)
def delete_image(image_id: int, db: Session = Depends(get_db)):
    db_image = crud.get_image_by_id(db, image_id=image_id)
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")

    filepath = db_image.filepath
    thumb_path = os.path.join("uploads/thumbnails", db_image.filename)

    crud.delete_image(db, image_id=image_id)

    try:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        if thumb_path and os.path.exists(thumb_path):
            os.remove(thumb_path)
    except Exception as e:
        print(f"Error deleting files for image ID {image_id}: {e}")

    return {"status": "ok"}
