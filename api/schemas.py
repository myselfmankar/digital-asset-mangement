from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import datetime

# --- Tag Schemas ---
class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int

    class Config:
        from_attributes = True

# --- Location Schemas ---
class LocationBase(BaseModel):
    latitude: float
    longitude: float
    city: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class Location(LocationBase):
    id: int

    class Config:
        from_attributes = True

# --- Metadata Schemas ---
class MetadataBase(BaseModel):
    camera_model: Optional[str] = None
    date_taken: Optional[datetime.datetime] = None
    raw_exif: Optional[Dict[str, Any]] = None

class MetadataCreate(MetadataBase):
    pass

class Metadata(MetadataBase):
    id: int
    location: Optional[Location] = None

    class Config:
        from_attributes = True

# --- Image Schemas ---
class ImageBase(BaseModel):
    filename: str
    filepath: str
    upload_date: datetime.datetime
    resolution: str
    image_size: int

class ImageCreate(ImageBase):
    pass

# This is the main schema for reading an image, includes nested data
class Image(ImageBase):
    id: int
    details: Optional[Metadata] = None
    tags: List[Tag] = []

    class Config:
        from_attributes = True