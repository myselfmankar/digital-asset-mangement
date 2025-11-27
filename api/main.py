import logging
import logging.config
from contextlib import asynccontextmanager
import os
import threading
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

def run_background_startup_tasks():
    """
    Runs startup maintenance tasks (image scan, geocoding) in a separate thread
    so the API remains responsive during startup.
    """
    logger.info("Starting background startup tasks...")
    db = SessionLocal()
    try:
        # --- Startup Scan for New Images ---
        uploads_dir = "uploads"
        logger.info("Running startup scan for new images...")
        if os.path.exists(uploads_dir):
            for filename in os.listdir(uploads_dir):
                if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.heic', '.heif')):
                    try:
                        existing_image = crud.get_image_by_filename(db, filename=filename)

                        if existing_image and existing_image.status == "completed":
                            continue
                        
                        filepath = os.path.join(uploads_dir, filename)
                        
                        if existing_image: # Exists but not completed
                            logger.info(f"Image {filename} found with status '{existing_image.status}'. Reprocessing...")
                            db_image = existing_image
                            crud.update_image_status(db, image_id=db_image.id, status="processing")
                        else: # New image
                            logger.info(f"Found new image: {filename}. Creating placeholder and processing...")
                            db_image = crud.create_placeholder_image(db, filename=filename, filepath=filepath)
                        
                        image_processing.process_and_save_image_metadata_sync(filepath, db_image.id, db)
                    except Exception as e:
                        logger.error(f"Error processing {filename} during startup scan: {e}")
        logger.info("Image scan finished.")

        # --- Initial Scan for Reverse Geocoding ---
        logger.info("Starting reverse geocoding scan...")
        geocoding.reverse_geocode_missing_addresses(db)
        logger.info("Reverse geocoding scan finished.")
        logger.info("All background startup tasks finished successfully.")

    except Exception as e:
        logger.error(f"Error during background startup tasks: {e}", exc_info=True)
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup logging
    logging.config.dictConfig(settings.LOGGING_CONFIG)
    logger.info("Application startup...")
    
    # Start background tasks in a separate thread
    task_thread = threading.Thread(target=run_background_startup_tasks, daemon=True)
    task_thread.start()
        
    logger.info("Application startup finished. Background tasks running.")
    yield
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
os.makedirs(os.path.join(UPLOADS_DIR, "previews"), exist_ok=True)

# Include API routers
app.include_router(images.router)
app.include_router(albums.router)
app.include_router(map.router)
app.include_router(stats.router)
app.include_router(suggestions.router)
app.include_router(filters.router)
app.include_router(search.router)

@app.get("/api/v1/config")
def get_config():
    """Returns the base API URL to the frontend."""
    return {"api_base_url": settings.API_BASE_URL}

# Mount static files directories
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")