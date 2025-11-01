from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
from . import crud, models, schemas
from .database import SessionLocal, engine, get_db
from PIL import Image as PILImage
import exifread
from geopy.geocoders import Nominatim
from typing import List
import datetime
from contextlib import asynccontextmanager
import folium
from folium import plugins
import aiofiles
import calendar
import time

# Create all tables
models.Base.metadata.create_all(bind=engine)

def drop_all_tables(db_engine):
    """Drops all tables defined in Base.metadata."""
    print("Dropping all existing database tables...")
    models.Base.metadata.drop_all(bind=db_engine)
    print("All tables dropped.")

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

def extract_and_save_initial_data(filepath: str, db: Session):
    """
    Performs the fast, local-only processing of an image file.
    It extracts all metadata and saves it to the DB, but does NOT perform
    the network-dependent reverse geocoding.
    """
    try:
        filename = os.path.basename(filepath)
        
        # Validate file exists
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File {filepath} not found")
            
        # Validate file is an image
        if not filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            raise ValueError(f"File {filename} is not a supported image type")
        
        # 1. Basic Image Info
        with PILImage.open(filepath) as img:
            resolution = f"{img.width}x{img.height}"
            image_size = os.path.getsize(filepath)
    except Exception as e:
        print(f"Error in basic image info: {e}")


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

    # 3. GPS and Location Info (without geocoding)
    if "GPS GPSLatitude" in tags and "GPS GPSLongitude" in tags:
        try:
            lat_ref = str(tags.get("GPS GPSLatitudeRef", "N"))
            lat = _convert_to_degrees(tags["GPS GPSLatitude"].values)
            if lat_ref == "S": lat = -lat

            lon_ref = str(tags.get("GPS GPSLongitudeRef", "E"))
            lon = _convert_to_degrees(tags["GPS GPSLongitude"].values)
            if lon_ref == "W": lon = -lon
            
            location_schema = schemas.LocationCreate(latitude=lat, longitude=lon, address=None)

        except Exception as e:
            print(f"Could not process GPS data for {filename}: {e}")

    # 4. Create Database Schemas
    image_schema = schemas.ImageCreate(
        filename=filename,
        filepath=filepath,
        upload_date=datetime.datetime.now(),
        resolution=resolution,
        image_size=image_size,
        mimetype=f"image/{filename.split('.')[-1].lower()}"
    )
    
    # Safely extract all EXIF data with defaults
    date_taken = _get_date_taken(tags)
    camera_model = str(tags.get('Image Model', 'Unknown'))
    f_number_raw = tags.get('EXIF FNumber')
    f_number = float(f_number_raw.values[0].num) / float(f_number_raw.values[0].den) if f_number_raw else None

    metadata_schema = schemas.MetadataCreate(
        camera_model=camera_model,
        date_taken=date_taken,
        f_number=f_number,
        exposure_time=str(tags.get('EXIF ExposureTime')),
        iso=int(str(tags.get('EXIF ISOSpeedRatings', 0))),
        focal_length=str(tags.get('EXIF FocalLength')),
        lens_model=str(tags.get('EXIF LensModel')),
        raw_exif=raw_exif_data
    )

    # 5. Save to Database
    crud.create_image_with_metadata(db, image=image_schema, metadata=metadata_schema, location=location_schema)

    # 6. Create Thumbnail
    thumb_path = os.path.join("uploads/thumbnails", filename)
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
        # Drop all tables and recreate them for development purposes
        drop_all_tables(engine)
        models.Base.metadata.create_all(bind=engine)

        if not os.path.exists("uploads/thumbnails"):
            os.makedirs("uploads/thumbnails")

        for filename in os.listdir("uploads"):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                # Check if image already exists in the DB
                if not crud.get_image_by_filename(db, filename=filename):
                    print(f"Found new image: {filename}. Processing...")
                    filepath = os.path.join("uploads", filename)
                    extract_and_save_initial_data(filepath, db)
        
        # After processing all files, run the reverse geocoding for missing addresses
        reverse_geocode_missing_addresses(db)
    finally:
        db.close()
    print("Startup scan finished.")
    yield
    # Shutdown logic here if needed

def reverse_geocode_missing_addresses(db: Session):
    """
    Scans the database for locations without an address and performs reverse geocoding.
    """
    print("Starting reverse geocoding scan for locations with missing addresses...")
    locations_to_geocode = crud.get_locations_without_address(db)
    
    if not locations_to_geocode:
        print("No locations found needing reverse geocoding.")
        return

    print(f"Found {len(locations_to_geocode)} locations to geocode.")
    geolocator = Nominatim(user_agent="photostack_fastapi_app")

    for i, location in enumerate(locations_to_geocode):
        try:
            print(f"({i+1}/{len(locations_to_geocode)}) Geocoding location ID: {location.id} ({location.latitude}, {location.longitude})...")
            location_geo = geolocator.reverse((location.latitude, location.longitude), exactly_one=True, timeout=10)
            address = location_geo.address if location_geo else "Unknown Location"
            crud.update_location_address(db, location_id=location.id, address=address)
            print(f" -> Success: {address}")
            time.sleep(1)  # Respect Nominatim's rate limit
        except Exception as e:
            print(f" -> Error geocoding location ID {location.id}: {e}")
            # Optionally update with a default error message
            crud.update_location_address(db, location_id=location.id, address="Geocoding Failed")

    print("Reverse geocoding scan finished.")

# --- FastAPI App Instance ---

app = FastAPI(lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for simplicity in local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images 
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- Health Check Route ---
@app.get("/")
def health_check():
    return {"status": "ok"}

# --- Special HTML Route for Folium Map ---
@app.get("/map", response_class=HTMLResponse)
def get_map_page(db: Session = Depends(get_db)):
    """
    This special route generates and returns the Folium map as a full HTML page.
    """
    map_data = crud.get_map_data(db)
    
    # Create base map with dark theme
    m = folium.Map(location=[20, 0], zoom_start=2, tiles="CartoDB dark_matter")
    
    # Create MarkerCluster
    marker_cluster = plugins.MarkerCluster().add_to(m)
    
    # Add markers for each image
    for i, item in enumerate(map_data):
        icon_url = f"http://127.0.0.1:8000{item['thumbnail_url']}"
        
        # Custom HTML for the marker icon, now with an onclick event
        icon_html = f"""
            <div style="
                cursor: pointer;
                width: 54px;
                height: 54px;
                background-image: url({icon_url});
                background-size: cover;
                border: 2px solid white;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.5);
            " onclick="onMarkerClick({i})">
                <div style="
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 8px solid white;
                    position: absolute;
                    bottom: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                "></div>
            </div>
        """
        
        icon = folium.DivIcon(html=icon_html, icon_size=(54, 64), icon_anchor=(27, 64))

        folium.Marker(
            location=[item['latitude'], item['longitude']],
            icon=icon
        ).add_to(marker_cluster)
        
    return m._repr_html_()

# --- API Endpoints ---
@app.post("/api/v1/images", response_model=schemas.Image)
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload and process a new image file.
    Returns 409 if file exists, 400 if invalid file type, 500 for processing errors.
    """
    # Validate file type
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(
            status_code=400,
            detail="File type not supported. Please upload PNG, JPG, or JPEG"
        )
        
    # Ensure static directories exist
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("uploads/thumbnails", exist_ok=True)
    
    filepath = os.path.join("uploads", file.filename)
    
    # Avoid overwriting existing files
    if crud.get_image_by_filename(db, filename=file.filename):
        raise HTTPException(
            status_code=409,
            detail=f"Image with filename '{file.filename}' already exists."
        )

    try:
        # Save uploaded file
        async with aiofiles.open(filepath, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        # Process the saved file
        extract_and_save_initial_data(filepath, db)
        
        # After a new image is uploaded, trigger a geocoding scan for any missing addresses
        reverse_geocode_missing_addresses(db)

        db_image = crud.get_image_by_filename(db, filename=file.filename)
        if db_image is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to process and save image"
            )
        
        # Use the same response model as the GET endpoint for consistency
        db_image.thumbnail_url = f"/uploads/thumbnails/{db_image.filename}"
        db_image.medium_url = f"/uploads/{db_image.filename}"
        db_image.large_url = f"/uploads/{db_image.filename}"
        return db_image
        
    except Exception as e:
        # Clean up file if upload fails
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing upload: {str(e)}"
        )

@app.get("/api/v1/images", response_model=List[schemas.Image])
def read_images(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    images = crud.get_images(db, skip=skip, limit=limit)
    # Add computed URL fields to each image object before returning
    for img in images:
        img.thumbnail_url = f"/uploads/thumbnails/{img.filename}"
        img.medium_url = f"/uploads/{img.filename}"
        img.large_url = f"/uploads/{img.filename}"
    return images

@app.get("/api/v1/albums/summary")
def get_album_summary(db: Session = Depends(get_db)):
    return crud.get_album_summary(db)

@app.get("/api/v1/stats")
def get_stats(db: Session = Depends(get_db)):
    return crud.get_stats(db)

@app.get("/api/v1/map/data")
def get_map_data(db: Session = Depends(get_db)):
    return crud.get_map_data(db)
