from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract
from . import models, schemas
from typing import List, Optional
import datetime

# --- Image CRUD ---
def get_image_by_filename(db: Session, filename: str):
    return db.query(models.Image).filter(models.Image.filename == filename).first()

def get_images(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Image).options(joinedload(models.Image.details).joinedload(models.Metadata.location)).offset(skip).limit(limit).all()

def create_image_with_metadata(db: Session, image: schemas.ImageCreate, metadata: schemas.MetadataCreate, location: Optional[schemas.LocationCreate] = None):
    # Create the main image object
    db_image = models.Image(**image.dict())
    
    # Create the metadata object
    db_metadata = models.Metadata(**metadata.dict())
    
    # If location data is provided, create the location object
    if location:
        db_location = models.Location(**location.dict())
        db_metadata.location = db_location
        
    # Link metadata to the image's 'details' attribute
    db_image.details = db_metadata
    
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image

# --- Album/Date CRUD ---
def get_images_by_date(db: Session, year: Optional[int] = None, month: Optional[int] = None):
    query = db.query(models.Image).join(models.Metadata)
    if year:
        query = query.filter(extract('year', models.Metadata.date_taken) == year)
    if month:
        query = query.filter(extract('month', models.Metadata.date_taken) == month)
    return query.all()

# --- Map Data CRUD ---
def get_geotagged_images(db: Session):
    return db.query(models.Image).join(models.Metadata).join(models.Location).all()