import logging
import os
import datetime
import base64
from io import BytesIO
from PIL import Image as PILImage
import imagehash

from pillow_heif import register_heif_opener
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from typing import List
from .. import crud, schemas
from ..config import settings
from ..database import SessionLocal
import exifread


# Register HEIF opener with Pillow
register_heif_opener()

logger = logging.getLogger(__name__)

# Configure the LangChain Gemini API client
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=settings.GEMINI_API_KEY)

def _convert_to_degrees(value):
    """Helper function to convert EXIF GPS coordinates to decimal degrees."""
    d = float(value[0].num) / float(value[0].den)
    m = float(value[1].num) / float(value[1].den)
    s = float(value[2].num) / float(value[2].den)
        
    return d + (m / 60.0) + (s / 3600.0)

def _convert_image_to_base64(filepath: str) -> str:
    """
    Converts an image file to a base64 string.
    If the image is HEIC/HEIF, it converts it to JPEG in memory first.
    """
    try:
        if filepath.lower().endswith(('.heic', '.heif')):
            img = PILImage.open(filepath)
            buffered = BytesIO()
            img.save(buffered, format="JPEG")
            return base64.b64encode(buffered.getvalue()).decode("utf-8")
        else:
            with open(filepath, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode("utf-8")
    except Exception as e:
        logger.error(f"Error converting image to base64: {e}")
        raise

def generate_image_tags_sync(filepath: str) -> List[str]:
    """
    Generates descriptive tags for an image using Google's Gemini 1.5 Pro Vision model.
    """
    try:
        logger.info(f"Generating tags for {filepath} using Gemini model.")
        img_base64 = _convert_image_to_base64(filepath)
        prompt_message = HumanMessage(
            content=[
                {
                    "type": "text",
                    "text": "Describe this image with a comma-separated list of relevant tags. Focus on objects, scenes, actions, and general themes. Example: 'beach, sunset, person, ocean, warm colors'."
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{img_base64}"}
                },
            ]
        )
        response = llm.invoke([prompt_message])
        
        # Extract and clean tags from the response
        tags_raw = response.content.strip()
        tags = [tag.strip().lower() for tag in tags_raw.split(',') if tag.strip()]
        logger.debug(f"Generated tags for {filepath}: {tags}")
        return tags
    except Exception as e:
        logger.error(f"Error generating tags for {filepath}: {e}", exc_info=True)
        return []


def _get_date_taken(tags):
    """Helper to get the date taken from EXIF tags."""
    if 'EXIF DateTimeOriginal' in tags:
        try:
            return datetime.datetime.strptime(str(tags['EXIF DateTimeOriginal']), '%Y:%m:%d %H:%M:%S')
        except (ValueError, TypeError):
            logger.warning("Could not parse EXIF DateTimeOriginal.")
            return None
    return None

def process_image_background(filepath: str, image_id: int):
    """
    Background task wrapper for image processing.
    Creates a new database session for the task.
    """
    db = SessionLocal()
    try:
        process_and_save_image_metadata_sync(filepath, image_id, db)
    finally:
        db.close()

def process_and_save_image_metadata_sync(filepath: str, image_id: int, db: Session):
    """
    Extracts metadata from an image file, generates AI tags, and updates the
    corresponding Image record in the database.
    """
    logger.info(f"Starting metadata processing for image ID {image_id}: {filepath}")
    
    try:
        filename = os.path.basename(filepath)
        is_heic = filename.lower().endswith(('.heic', '.heif'))
        base_filename = os.path.splitext(filename)[0]

        # --- AI Tag Generation ---
        # We do this first or in parallel ideally, but serial is fine.
        ai_tags = generate_image_tags_sync(filepath)

        # --- Metadata & Preview Generation ---
        location_data = None
        raw_exif_data = {}
        date_taken = None
        camera_model = None
        f_number = None
        exposure_time = None
        iso = None
        focal_length = None
        lens_model = None
        
        # Open image with PIL (handles HEIC via registered opener)
        with PILImage.open(filepath) as img:
            resolution = f"{img.width}x{img.height}"
            image_size = os.path.getsize(filepath)
            
            # Generate pHash
            phash = str(imagehash.phash(img))

            # 1. Generate Thumbnail (WebP)
            thumb_filename = f"{base_filename}.webp"
            thumb_path = os.path.join(settings.THUMBNAILS_DIR, thumb_filename)
            if not os.path.exists(thumb_path):
                try:
                    logger.info(f"Creating thumbnail for {filename}")
                    img_thumb = img.copy()
                    img_thumb.thumbnail((400, 400))
                    img_thumb.save(thumb_path, "webp", quality=80)
                except Exception as e:
                    logger.error(f"Thumbnail generation failed: {e}")

            # 2. Generate Preview for HEIC (WebP)
            # Standard browsers can't show HEIC, so we need a full-size (or large) preview.
            if is_heic:
                preview_dir = os.path.join("uploads", "previews")
                os.makedirs(preview_dir, exist_ok=True)
                preview_path = os.path.join(preview_dir, f"{base_filename}.webp")
                
                if not os.path.exists(preview_path):
                    try:
                        logger.info(f"Creating preview for HEIC image {filename}")
                        # Max dimension 1920 to save space but keep quality
                        img.thumbnail((1920, 1920)) 
                        img.save(preview_path, "webp", quality=85)
                    except Exception as e:
                        logger.error(f"Preview generation failed: {e}")

        # 3. Extract EXIF
        # We try exifread first as it's robust for standard formats.
        # For HEIC, if exifread fails, we might need other parsing, but modern exifread handles it often.
        try:
            with open(filepath, 'rb') as f:
                exif_tags = exifread.process_file(f, details=True)
                
                if not exif_tags and is_heic:
                    logger.warning("ExifRead found no tags for HEIC. Attempting PIL metadata extraction...")
                    # Fallback logic could go here if needed, but keeping it simple for now.
                
                for tag, value in exif_tags.items():
                    if tag not in ("JPEGThumbnail", "TIFFThumbnail"):
                        raw_exif_data[tag] = str(value)

                # Location
                if "GPS GPSLatitude" in exif_tags:
                    lat = _convert_to_degrees(exif_tags['GPS GPSLatitude'].values)
                    lon = _convert_to_degrees(exif_tags['GPS GPSLongitude'].values)
                    if exif_tags['GPS GPSLatitudeRef'].values[0] != 'N':
                        lat = -lat
                    if exif_tags['GPS GPSLongitudeRef'].values[0] != 'E':
                        lon = -lon
                    location_data = schemas.LocationCreate(latitude=lat, longitude=lon)

                # Specific fields
                date_taken = _get_date_taken(exif_tags)
                camera_model = str(exif_tags.get('Image Model', 'Unknown'))
                
                f_number_raw = exif_tags.get('EXIF FNumber')
                if f_number_raw:
                    try:
                        f_number = float(f_number_raw.values[0].num) / float(f_number_raw.values[0].den)
                    except Exception: pass
                
                exposure_time = str(exif_tags.get('EXIF ExposureTime'))
                
                iso_tag = exif_tags.get('EXIF ISOSpeedRatings')
                if iso_tag:
                    try:
                        iso = int(str(iso_tag))
                    except Exception: pass
                
                focal_length = str(exif_tags.get('EXIF FocalLength'))
                lens_model = str(exif_tags.get('EXIF LensModel'))

        except Exception as e:
            logger.error(f"Error reading EXIF from {filename}: {e}")

        # --- Prepare Pydantic schemas ---
        image_update_schema = schemas.ImageUpdate(
            resolution=resolution,
            image_size=image_size,
            status="completed",
            filepath=filepath,
            filename=filename
        )
        metadata_schema = schemas.MetadataCreate(
            date_taken=date_taken,
            camera_model=camera_model,
            f_number=f_number,
            exposure_time=exposure_time,
            iso=iso,
            focal_length=focal_length,
            lens_model=lens_model,
            raw_exif=raw_exif_data
        )

        # --- Update DB ---
        crud.update_image_with_metadata(
            db, 
            image_id=image_id, 
            image_update=image_update_schema,
            metadata=metadata_schema,
            location=location_data,
            tags=ai_tags,
            phash=phash
        )
        
    except Exception as e:
        logger.error(f"Error processing image {filepath}: {e}", exc_info=True)
        crud.update_image_status(db, image_id=image_id, status="failed")
    logger.info(f"Finished metadata processing for image ID {image_id}: {filepath}")
