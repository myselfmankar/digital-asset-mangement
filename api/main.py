from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from . import crud, models, schemas
from .database import SessionLocal, engine, get_db
from PIL import Image as PILImage
import exifread
from geopy.geocoders import Nominatim
import os
from typing import List
import datetime
from contextlib import asynccontextmanager

# Create all tables
models.Base.metadata.create_all(bind=engine)

def _convert_to_degrees(value):
    """Helper function to convert EXIF GPS coordinates to decimal degrees."""
    d = float(value[0].num) / float(value[0].den)
    m = float(value[1].num) / float(value[1].den)
    s = float(value[2].num) / float(value[2].den)
    return d + (m / 60.0) + (s / 3600.0)

def _get_date_taken(tags):
    """Helper to get the date taken from EXIF tags."""
    if 'EXIF DateTimeOriginal' in tags:
        try:
            return datetime.datetime.strptime(str(tags['EXIF DateTimeOriginal']), '%Y:%m:%d %H:%M:%S')
        except (ValueError, TypeError):
            return None
    return None

def process_image_file(filepath: str, db: Session):
    """
    Processes a single image file, extracts metadata, and stores it in the database.
    This function is used by both the startup scan and the file upload endpoint.
    """
    filename = os.path.basename(filepath)
    
    # 1. Basic Image Info
    try:
        with PILImage.open(filepath) as img:
            resolution = f"{img.width}x{img.height}"
        image_size = os.path.getsize(filepath)
    except Exception as e:
        print(f"Could not read basic info for {filename}: {e}")
        return

    # 2. EXIF and Metadata Info
    raw_exif_data = {}
    location_schema = None
    
    try:
        with open(filepath, "rb") as f:
            tags = exifread.process_file(f, details=False)
            for tag, value in tags.items():
                if tag not in ("JPEGThumbnail", "TIFFThumbnail"):
                    raw_exif_data[tag] = str(value)
    except Exception as e:
        print(f"Could not read EXIF data for {filename}: {e}")
        tags = {} # Ensure tags is a dict

    date_taken = _get_date_taken(tags)
    camera_model = str(tags.get('Image Model', 'Unknown'))

    # 3. GPS and Location Info
    if "GPS GPSLatitude" in tags and "GPS GPSLongitude" in tags:
        try:
            lat_ref = str(tags.get("GPS GPSLatitudeRef", "N"))
            lat = _convert_to_degrees(tags["GPS GPSLatitude"].values)
            if lat_ref != "N": lat = -lat

            lon_ref = str(tags.get("GPS GPSLongitudeRef", "W"))
            lon = _convert_to_degrees(tags["GPS GPSLongitude"].values)
            if lon_ref != "W": lon = -lon
            
            location_schema = schemas.LocationCreate(latitude=lat, longitude=lon)
            try:
                location_geo = geolocator.reverse((lat, lon), timeout=5)
                if location_geo and location_geo.raw.get("address"):
                    address = location_geo.raw["address"]
                    location_schema.city = address.get("city", address.get("town", address.get("village")))
                    location_schema.country = address.get("country")
                    location_schema.state = address.get("state")
            except Exception:
                pass # Ignore if reverse geocoding fails, we still have coords
        except Exception as e:
            print(f"Could not process GPS data for {filename}: {e}")

    # 4. Create Database Schemas
    image_schema = schemas.ImageCreate(
        filename=filename,
        filepath=filepath,
        upload_date=datetime.datetime.now(),
        resolution=resolution,
        image_size=image_size
    )
    metadata_schema = schemas.MetadataCreate(
        camera_model=camera_model,
        date_taken=date_taken,
        raw_exif=raw_exif_data
    )

    # 5. Save to Database
    crud.create_image_with_metadata(db, image=image_schema, metadata=metadata_schema, location=location_schema)

    # 6. Create Thumbnail
    thumb_path = os.path.join("static/thumbnails", filename)
    if not os.path.exists(thumb_path):
        try:
            with PILImage.open(filepath) as img:
                img.thumbnail((200, 200))
                img.save(thumb_path)
        except Exception as e:
            print(f"Could not create thumbnail for {filename}: {e}")


# --- FastAPI Lifespan (Startup Logic) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Running startup scan...")
    db = SessionLocal()
    try:
        if not os.path.exists("static/thumbnails"):
            os.makedirs("static/thumbnails")

        for filename in os.listdir("static"):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                # Check if image already exists in the DB
                if not crud.get_image_by_filename(db, filename=filename):
                    print(f"Found new image: {filename}. Processing...")
                    filepath = os.path.join("static", filename)
                    process_image_file(filepath, db)
    finally:
        db.close()
    print("Startup scan finished.")
    yield
    # Shutdown logic here if needed

# --- FastAPI App Instance ---
app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")
geolocator = Nominatim(user_agent="photoview_fastapi_app")


# --- API Endpoints ---
@app.post("/api/v1/images", response_model=schemas.Image)
def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Ensure static directories exist
    if not os.path.exists("static"): os.makedirs("static")
    
    filepath = os.path.join("static", file.filename)
    
    # Avoid overwriting existing files
    if os.path.exists(filepath):
        raise HTTPException(status_code=409, detail="File with this name already exists.")

    with open(filepath, "wb") as buffer:
        buffer.write(file.file.read())
    
    process_image_file(filepath, db)
    
    db_image = crud.get_image_by_filename(db, filename=file.filename)
    if db_image is None:
        raise HTTPException(status_code=500, detail="Failed to process and save image.")
        
    return db_image

@app.get("/api/v1/images", response_model=List[schemas.Image])
def read_images(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    images = crud.get_images(db, skip=skip, limit=limit)
    return images

@app.get("/api/v1/albums", response_model=List[schemas.Image])
def read_albums(year: int = None, month: int = None, db: Session = Depends(get_db)):
    images = crud.get_images_by_date(db, year=year, month=month)
    return images

@app.get("/api/v1/map-data", response_model=List[schemas.Image])
def read_map_data(db: Session = Depends(get_db)):
    images = crud.get_geotagged_images(db)
    return images
