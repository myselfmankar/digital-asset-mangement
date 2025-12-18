import os

def get_image_urls(image):
    """
    Returns a dictionary containing the thumbnail, medium, and large URLs for a given image object.
    Handles HEIC files by pointing to the converted WebP preview.
    """
    base_filename = os.path.splitext(image.filename)[0]
    ext = os.path.splitext(image.filename)[1].lower()
    
    # Thumbnail is always a WebP generated in thumbnails/
    thumbnail_url = f"/uploads/thumbnails/{base_filename}.webp"
    
    # Medium/Large URL handling
    if ext in ('.heic', '.heif'):
        # For HEIC, we use the generated preview in uploads/previews/
        # We use .webp for previews as well for better compression/compatibility
        large_url = f"/uploads/previews/{base_filename}.webp"
        medium_url = f"/uploads/previews/{base_filename}.webp" # Medium is same as large for now
    else:
        # For browser-compatible images (JPG, PNG, WebP), serve directly
        large_url = f"/uploads/{image.filename}"
        medium_url = f"/uploads/{image.filename}"

    return {
        "thumbnail_url": thumbnail_url,
        "medium_url": medium_url,
        "large_url": large_url
    }
