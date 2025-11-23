from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/v1/albums",
    tags=["albums"],
)

@router.post("/", response_model=schemas.Album)
def create_album(album: schemas.AlbumCreate, db: Session = Depends(get_db)):
    return crud.create_album(db=db, album=album)

@router.get("/", response_model=List[schemas.Album])
def read_albums(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    albums = crud.get_albums(db, skip=skip, limit=limit)
    return albums

@router.get("/{album_id}", response_model=schemas.Album)
def read_album(album_id: int, db: Session = Depends(get_db)):
    db_album = crud.get_album(db, album_id=album_id)
    if db_album is None:
        raise HTTPException(status_code=404, detail="Album not found")
    return db_album

@router.post("/{album_id}/images/{image_id}", response_model=schemas.Album)
def add_image_to_album(album_id: int, image_id: int, db: Session = Depends(get_db)):
    db_album = crud.add_image_to_album(db, album_id=album_id, image_id=image_id)
    if db_album is None:
        raise HTTPException(status_code=404, detail="Album or image not found")
    return db_album