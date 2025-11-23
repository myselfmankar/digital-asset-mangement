import logging
import os
import datetime
import base64
from PIL import Image as PILImage
import pillow_heif
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from typing import List
from .. import crud, schemas
from ..config import settings
import exifread

import piexif

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
    """Converts an image file to a base64 string."""
    with open(filepath, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
    return encoded_string


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

def process_and_save_image_metadata_sync(filepath: str, image_id: int, db: Session):
    """
    Extracts metadata from an image file, generates AI tags, and updates the
    corresponding Image record in the database.
    """
    logger.info(f"Starting metadata processing for image ID {image_id}: {filepath}")
    original_filepath = filepath
    
    try:
        filename = os.path.basename(filepath)
        
        # If the image is HEIC/HEIF, convert it to JPEG, preserving EXIF data
        if filename.lower().endswith(('.heic', '.heif')):
            logger.info(f"HEIC/HEIF file detected. Converting {filename} to JPG.")
            heif_file = pillow_heif.read_heif(filepath)
            image = PILImage.frombytes(
                heif_file.mode,
                heif_file.size,
                heif_file.data,
                "raw",
            )

            # Preserve EXIF data
            exif_dict = piexif.load(heif_file.info['exif']) if 'exif' in heif_file.info else None

            # Convert to JPG
            base, _ = os.path.splitext(filename)
            new_filename = f"{base}.jpg"
            new_filepath = os.path.join("uploads", new_filename)

            if exif_dict:
                exif_bytes = piexif.dump(exif_dict)
                image.save(new_filepath, "jpeg", exif=exif_bytes)
            else:
                image.save(new_filepath, "jpeg")
            
            logger.info(f"Successfully converted {filename} to {new_filename}, preserving EXIF data.")

            # Update variables to point to the new JPG file for the rest of the process
            filepath = new_filepath
            filename = new_filename
        
        # --- Metadata Extraction ---
        location_data = None
        raw_exif_data = {}
        with open(filepath, 'rb') as f:
            exif_tags = exifread.process_file(f, details=True)
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

            # Other metadata
            date_taken = _get_date_taken(exif_tags)
            camera_model = str(exif_tags.get('Image Model', 'Unknown'))
            f_number_raw = exif_tags.get('EXIF FNumber')
            f_number = float(f_number_raw.values[0].num) / float(f_number_raw.values[0].den) if f_number_raw else None

        # --- AI Tag Generation ---
        ai_tags = generate_image_tags_sync(filepath)

        # --- Image Details ---
        with PILImage.open(filepath) as img:
            resolution = f"{img.width}x{img.height}"
            image_size = os.path.getsize(filepath)

        # --- Prepare Pydantic schemas ---
        image_update_schema = schemas.ImageUpdate(
            resolution=resolution,
            image_size=image_size,
            status="completed"
        )
        metadata_schema = schemas.MetadataCreate(
            date_taken=date_taken,
            camera_model=camera_model,
            f_number=f_number,
            exposure_time=str(exif_tags.get('EXIF ExposureTime')),
            iso=int(str(exif_tags.get('EXIF ISOSpeedRatings', 0))),
            focal_length=str(exif_tags.get('EXIF FocalLength')),
            lens_model=str(exif_tags.get('EXIF LensModel')),
            raw_exif=raw_exif_data
        )

        # --- Update DB ---
        crud.update_image_with_metadata(
            db, 
            image_id=image_id, 
            image_update=image_update_schema,
            metadata=metadata_schema,
            location=location_data,
            tags=ai_tags
        )

        # Create Thumbnail
        base, _ = os.path.splitext(filename)
        thumb_filename = f"{base}.webp"
        thumb_path = os.path.join(settings.THUMBNAILS_DIR, thumb_filename)
        
        if not os.path.exists(thumb_path):
            try:
                logger.info(f"Creating thumbnail for {filename} at {thumb_path}")
                with PILImage.open(filepath) as img:
                    img.thumbnail((400, 400))  # Larger thumbnail for better quality
                    img.save(thumb_path, "webp", quality=80)
                logger.info(f"Thumbnail created for {filename}")
            except Exception as e:
                logger.error(f"Could not create thumbnail for {filename}: {e}", exc_info=True)
        
    except Exception as e:
        logger.error(f"Error processing image {original_filepath}: {e}", exc_info=True)
        crud.update_image_status(db, image_id=image_id, status="failed")
    logger.info(f"Finished metadata processing for image ID {image_id}: {original_filepath}")
