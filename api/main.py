import logging
import logging.config
from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from . import crud
from .database import SessionLocal, engine, Base
from .services import geocoding, image_processing
from .config import settings
from .routers import images, albums, map, stats, suggestions, filters, search

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup logging
    logging.config.dictConfig(settings.LOGGING_CONFIG)
    logger.info("Application startup...")
    
    db = SessionLocal()
    try:
        # --- Startup Scan for New Images (Sequential & Blocking) ---
        uploads_dir = "uploads"
        logger.info("Running startup scan for new images...")
        for filename in os.listdir(uploads_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.heic', '.heif')):
                existing_image = crud.get_image_by_filename(db, filename=filename)

                if existing_image and existing_image.status == "completed":
                    logger.info(f"Image {filename} already processed and completed. Skipping.")
                    continue
                
                filepath = os.path.join(uploads_dir, filename)
                
                if existing_image: # Exists but not completed (processing or failed)
                    logger.info(f"Image {filename} found with status '{existing_image.status}'. Reprocessing...")
                    db_image = existing_image
                    # Ensure status is set to processing before reprocessing, in case it was 'failed'
                    crud.update_image_status(db, image_id=db_image.id, status="processing")
                else: # New image
                    logger.info(f"Found new image: {filename}. Creating placeholder and processing...")
                    db_image = crud.create_placeholder_image(db, filename=filename, filepath=filepath)
                
                image_processing.process_and_save_image_metadata_sync(filepath, db_image.id, db)
        logger.info("Image scan finished.")

        # --- Initial Scan for Reverse Geocoding ---
        logger.info("Starting reverse geocoding scan...")
        geocoding.reverse_geocode_missing_addresses(db)
        logger.info("Reverse geocoding scan finished.")
        
        logger.info("Application startup finished.")
        yield
    finally:
        db.close()
        logger.info("Application shutdown...")

app = FastAPI(lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = "uploads"
THUMBNAILS_DIR = os.path.join(UPLOADS_DIR, "thumbnails")
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(THUMBNAILS_DIR, exist_ok=True)

# Mount static files directories
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Include API routers
app.include_router(images.router)
app.include_router(albums.router)
app.include_router(map.router)
app.include_router(stats.router)
app.include_router(suggestions.router)
app.include_router(filters.router)
app.include_router(search.router)

@app.get("/")

def health_check():

    return {"status": "ok"}



@app.get("/api/v1/config")

def get_config():

    """Returns the base API URL to the frontend."""

    return {"api_base_url": settings.API_BASE_URL}
