from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract, func, or_
from . import models, schemas
from typing import List, Optional
import datetime
import calendar

def search_images_by_filters(db: Session, filters: schemas.SearchQuery):
    """
    Searches for images using a combination of structured filters from the AI.
    """
    query = db.query(models.Image).options(joinedload(models.Image.tags), joinedload(models.Image.details).joinedload(models.Metadata.location))
    
    # We join details for most filters, so let's do it upfront if needed
    needs_details_join = filters.location or filters.camera_model or filters.date_query
    if needs_details_join:
        query = query.join(models.Image.details)

    if filters.tags:
        query = query.join(models.Image.tags).filter(models.Tag.name.in_(filters.tags))
    
    if filters.location:
        query = query.join(models.Metadata.location).filter(models.Location.address.ilike(f'%{filters.location}%'))
        
    if filters.camera_model:
        query = query.filter(models.Metadata.camera_model.ilike(f'%{filters.camera_model}%'))
        
    if filters.date_query:
        date_str = filters.date_query
        if " to " in date_str:
            start_date_str, end_date_str = date_str.split(" to ")
            start_date = datetime.datetime.strptime(start_date_str, "%Y-%m-%d")
            end_date = datetime.datetime.strptime(end_date_str, "%Y-%m-%d")
            query = query.filter(models.Metadata.date_taken.between(start_date, end_date))
        else:
            search_date = datetime.datetime.strptime(date_str, "%Y-%m-%d")
            query = query.filter(func.date(models.Metadata.date_taken) == search_date.date())

    return query.distinct().all()

def search_images_by_keywords(db: Session, query: str):
    """
    Performs a broad keyword search across tags and locations.
    """
    # Simple stop-word removal
    stop_words = {"in", "and", "the", "of", "show", "me", "find", "pictures", "images", "photos", "my", "from", "taken"}
    keywords = [word for word in query.lower().split() if word not in stop_words]
    
    if not keywords:
        return []

    search_query = db.query(models.Image).options(joinedload(models.Image.tags), joinedload(models.Image.details).joinedload(models.Metadata.location))
    
    # Build a list of OR conditions
    conditions = []
    for keyword in keywords:
        conditions.append(models.Tag.name.ilike(f'%{keyword}%'))
        conditions.append(models.Location.address.ilike(f'%{keyword}%'))
        
    search_query = search_query.join(models.Image.tags).outerjoin(models.Image.details).outerjoin(models.Metadata.location)
    search_query = search_query.filter(or_(*conditions))

    return search_query.distinct().all()


# --- Tag CRUD ---
def get_tag_by_name(db: Session, name: str):
    return db.query(models.Tag).filter(models.Tag.name == name).first()

def get_tag_counts(db: Session, limit: int = 20):
    """
    Gets a list of tags and the count of images associated with each,
    ordered by the most common tags.
    """
    return (
        db.query(models.Tag.name, func.count(models.Image.id).label("image_count"))
        .join(models.Tag.images)
        .group_by(models.Tag.name)
        .order_by(func.count(models.Image.id).desc())
        .limit(limit)
        .all()
    )
# --- Album CRUD ---

def get_album(db: Session, album_id: int):
    return db.query(models.Album).filter(models.Album.id == album_id).first()

def get_albums(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Album).offset(skip).limit(limit).all()

def create_album(db: Session, album: schemas.AlbumCreate):
    db_album = models.Album(name=album.name, description=album.description)
    db.add(db_album)
    db.commit()
    db.refresh(db_album)
    return db_album

def add_image_to_album(db: Session, album_id: int, image_id: int):
    db_album = get_album(db, album_id=album_id)
    db_image = get_image_by_id(db, image_id=image_id)
    if db_album and db_image:
        db_album.images.append(db_image)
        db.commit()
        db.refresh(db_album)
    return db_album

# --- Image CRUD ---
def toggle_image_favorite_status(db: Session, image_id: int):
    """
    Toggles the is_favorite status of a single image.
    """
    db_image = get_image_by_id(db, image_id=image_id)
    if not db_image:
        return None
    
    db_image.is_favorite = not db_image.is_favorite
    db.commit()
    db.refresh(db_image)
    return db_image


def get_or_create_tag(db: Session, tag_name: str) -> models.Tag:
    db_tag = get_tag_by_name(db, name=tag_name)
    if not db_tag:
        db_tag = models.Tag(name=tag_name)
        db.add(db_tag)
        db.commit()
        db.refresh(db_tag)
    return db_tag

# --- Image CRUD ---
def get_image_by_id(db: Session, image_id: int):
    return db.query(models.Image).filter(models.Image.id == image_id).first()

def get_image_by_filename(db: Session, filename: str):
    return db.query(models.Image).filter(models.Image.filename == filename).first()

def get_image_by_filename_and_status(db: Session, filename: str, status: str):
    """Returns an image if it matches the filename and has the specified status."""
    return db.query(models.Image).filter(models.Image.filename == filename, models.Image.status == status).first()

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

def create_placeholder_image(db: Session, filename: str, filepath: str) -> models.Image:
    """Creates a placeholder image entry with a 'processing' status."""
    db_image = models.Image(
        filename=filename,
        filepath=filepath,
        upload_date=datetime.datetime.now(),
        resolution="N/A",
        image_size=0,
        status="processing"
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image

def update_image_status(db: Session, image_id: int, status: str):
    """Updates the status of an image."""
    db.query(models.Image).filter(models.Image.id == image_id).update({"status": status})
    db.commit()

def create_image_with_metadata(db: Session, image: schemas.ImageCreate, metadata: schemas.MetadataCreate, location: Optional[schemas.LocationCreate] = None, tags: Optional[List[str]] = None):
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

    # Add tags to the image
    if tags:
        for tag_name in tags:
            db_tag = get_or_create_tag(db, tag_name=tag_name)
            db_image.tags.append(db_tag)
    
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image

def update_image_with_metadata(db: Session, image_id: int, image_update: schemas.ImageUpdate, metadata: schemas.MetadataCreate, location: Optional[schemas.LocationCreate] = None, tags: Optional[List[str]] = None):
    """
    Updates an image with its processed metadata, location, and tags.
    """
    db_image = get_image_by_id(db, image_id=image_id)
    if not db_image:
        return None

    # Update image fields
    for field, value in image_update.dict(exclude_unset=True).items():
        setattr(db_image, field, value)

    # Create and associate metadata
    db_metadata = models.Metadata(**metadata.dict())
    if location:
        db_location = models.Location(**location.dict())
        db_metadata.location = db_location
    db_image.details = db_metadata

    # Add tags
    if tags:
        for tag_name in tags:
            db_tag = get_or_create_tag(db, tag_name=tag_name)
            db_image.tags.append(db_tag)

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

def get_album_summary(db: Session) -> List[dict]:
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
    return db.query(models.Location).filter(models.Location.address.is_(None)).all()

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

# --- Filter CRUD ---
def get_unique_camera_models(db: Session) -> List[str]:
    """Returns a list of unique camera models."""
    return [model[0] for model in db.query(models.Metadata.camera_model).distinct().all() if model[0]]

def get_unique_locations(db: Session) -> List[str]:
    """Returns a list of unique locations."""
    return [loc[0] for loc in db.query(models.Location.address).distinct().all() if loc[0]]

def get_unique_dates(db: Session) -> List[str]:
    """Returns a list of unique year/month combinations."""
    dates = db.query(
        extract('year', models.Metadata.date_taken),
        extract('month', models.Metadata.date_taken)
    ).distinct().all()
    return [f"{int(year)}-{int(month):02d}" for year, month in dates if year and month]

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