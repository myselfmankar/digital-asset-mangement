import logging
import time
from sqlalchemy.orm import Session
from geopy.geocoders import Nominatim
from .. import crud

logger = logging.getLogger(__name__)

def reverse_geocode_missing_addresses(db: Session):
    """
    Scans the database for locations without an address and performs reverse geocoding.
    """
    logger.info("Starting reverse geocoding scan for locations with missing addresses...")
    locations_to_geocode = crud.get_locations_without_address(db)
    
    if not locations_to_geocode:
        logger.info("No locations found needing reverse geocoding.")
        return

    logger.info(f"Found {len(locations_to_geocode)} locations to geocode.")
    geolocator = Nominatim(user_agent="photostack_fastapi_app")

    for i, location in enumerate(locations_to_geocode):
        try:
            logger.debug(f"({i+1}/{len(locations_to_geocode)}) Geocoding location ID: {location.id} ({location.latitude}, {location.longitude})...")
            location_geo = geolocator.reverse((location.latitude, location.longitude), exactly_one=True, timeout=10)
            address = location_geo.address if location_geo else "Unknown Location"
            crud.update_location_address(db, location_id=location.id, address=address)
            logger.info(f" -> Success: {address}")
            time.sleep(1)  # Respect Nominatim's rate limit
        except Exception as e:
            logger.error(f" -> Error geocoding location ID {location.id}: {e}", exc_info=True)
            crud.update_location_address(db, location_id=location.id, address="Geocoding Failed")

    logger.info("Reverse geocoding scan finished.")
