from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract, func, case
from . import models, schemas
from typing import List, Optional
import datetime
import calendar

# --- Image CRUD ---
def get_image_by_id(db: Session, image_id: int):
    return db.query(models.Image).filter(models.Image.id == image_id).first()

def get_image_by_filename(db: Session, filename: str):
    return db.query(models.Image).filter(models.Image.filename == filename).first()

def get_images(db: Session, skip: int = 0, limit: int = 100, sort_by: str = "upload_date"):
    """
    Gets a paginated list of images, eagerly loading all necessary nested data
    for the API schema.
    """
    query = (
        db.query(models.Image)
        .options(
            joinedload(models.Image.details)
            .joinedload(models.Metadata.location),
            joinedload(models.Image.tags)
        )
        .join(models.Metadata)
    )

    if sort_by == "filename":
        query = query.order_by(models.Image.filename.asc())
    else:  # Default to upload_date
        query = query.order_by(models.Image.upload_date.desc())

    return query.offset(skip).limit(limit).all()

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

def delete_image(db: Session, image_id: int):
    """Deletes an image and its related data from the database."""
    db_image = db.query(models.Image).filter(models.Image.id == image_id).first()
    if db_image:
        # The cascade delete in models.py will handle associated metadata and location
        db.delete(db_image)
        db.commit()
    return db_image

# --- Album/Date CRUD ---
def get_images_by_date(db: Session, year: Optional[int] = None, month: Optional[int] = None):
    query = db.query(models.Image).join(models.Metadata)
    if year:
        query = query.filter(extract('year', models.Metadata.date_taken) == year)
    if month:
        query = query.filter(extract('month', models.Metadata.date_taken) == month)
    return query.all()

def get_album_summary(db: Session):
    """
    Returns a summary for the albums page, grouped by year and month.
    """
    # Subquery to find the filename of the first image for each month
    first_image_subquery = (
        db.query(
            models.Image.filename,
            extract("year", models.Metadata.date_taken).label("year"),
            extract("month", models.Metadata.date_taken).label("month"),
            func.row_number().over(
                partition_by=(
                    extract("year", models.Metadata.date_taken),
                    extract("month", models.Metadata.date_taken)
                ),
                order_by=models.Metadata.date_taken.asc()
            ).label("rn")
        )
        .join(models.Metadata)
        .subquery()
    )

    # Main query to get the summary
    result = (
        db.query(
            extract("year", models.Metadata.date_taken).label("year"),
            extract("month", models.Metadata.date_taken).label("month"),
            func.count(models.Image.id).label("image_count"),
            first_image_subquery.c.filename.label("preview_image_filename")
        )
        .join(models.Metadata)
        .join(
            first_image_subquery,
            (
                extract("year", models.Metadata.date_taken) == first_image_subquery.c.year
            ) &
            (
                extract("month", models.Metadata.date_taken) == first_image_subquery.c.month
            ) &
            (first_image_subquery.c.rn == 1)
        )
        .group_by(
            extract("year", models.Metadata.date_taken),
            extract("month", models.Metadata.date_taken),
            first_image_subquery.c.filename
        )
        .order_by(
            extract("year", models.Metadata.date_taken).desc(),
            extract("month", models.Metadata.date_taken).desc()
        )
        .all()
    )
    
    # Format the result
    return [
        {
            "year": r.year,
            "month": r.month,
            "month_name": calendar.month_name[int(r.month)],
            "image_count": r.image_count,
            "preview_image_url": f"/uploads/thumbnails/{r.preview_image_filename}"
        }
        for r in result
    ]


def get_album_images(db: Session, year: int, month: int):
    """
    Gets all images for a specific album (year and month).
    """
    return (
        db.query(models.Image)
        .options(
            joinedload(models.Image.details)
            .joinedload(models.Metadata.location),
            joinedload(models.Image.tags)
        )
        .join(models.Metadata)
        .filter(
            extract('year', models.Metadata.date_taken) == year,
            extract('month', models.Metadata.date_taken) == month
        )
        .order_by(models.Metadata.date_taken.asc())
        .all()
    )


# --- Map Data CRUD ---
def get_locations_without_address(db: Session):
    """Returns all Location records where the address is NULL."""
    return db.query(models.Location).filter(models.Location.address == None).all()

def update_location_address(db: Session, location_id: int, address: str):
    """Updates the address for a given location ID."""
    db.query(models.Location).filter(models.Location.id == location_id).update({"address": address})
    db.commit()

def get_map_data(db: Session):
    """
    Returns a list of all geotagged images with the data needed for the map.
    """
    images = db.query(models.Image).join(models.Metadata).join(models.Location).all()
    return [
        {
            "latitude": img.details.location.latitude,
            "longitude": img.details.location.longitude,
            "address": img.details.location.address,
            "thumbnail_url": f"/uploads/thumbnails/{img.filename}"
        }
        for img in images
    ]

# --- Stats CRUD ---
def get_stats(db: Session):
    """
    Returns a dictionary of various counts for the sidebar.
    """
    image_count = db.query(func.count(models.Image.id)).scalar()
    
    album_count_query = db.query(
        func.count(
            func.distinct(
                func.concat(
                    extract("year", models.Metadata.date_taken),
                    "-",
                    extract("month", models.Metadata.date_taken)
                )
            )
        )
    ).select_from(models.Metadata).scalar()

    places_count = db.query(func.count(models.Location.id)).scalar()
    
    # Placeholder for favorites count
    favorites_count = 0 

    return {
        "images": image_count,
        "albums": album_count_query,
        "places": places_count,
        "favorites": favorites_count,
        # Add other stats as needed, defaulting to 0
        "media": 0,
        "people": 0,
        "calendar": 0,
        "moments": 0,
        "labels": 0,
        "folders": 0,
        "library": 0
    }

def show_database(db: Session):
    """
    Returns all tables and their content from the database.
    """
    from sqlalchemy import inspect, text
    inspector = inspect(db.bind)
    data = {}
    for table_name in inspector.get_table_names():
        # Use the text() construct for raw SQL
        rows = db.execute(text(f"SELECT * FROM {table_name}")).fetchall()
        # Convert rows to dictionaries
        if rows:
            # Get column names from the first row's keys
            column_names = rows[0]._fields
            data[table_name] = [dict(zip(column_names, row)) for row in rows]
        else:
            data[table_name] = []
    return data