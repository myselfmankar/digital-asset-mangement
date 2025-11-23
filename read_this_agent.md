# Agent Technical Log: Current Codebase Description

**Objective:** This document provides a comprehensive overview of the PhotoStack codebase's current architecture and features, designed for a coding agent to quickly understand its structure and functionality.

---

## 1. AI Engine: LangChain Integration with Google Gemini Pro

The PhotoStack application integrates with the Google Gemini Pro Vision model via the LangChain framework to provide intelligent image analysis capabilities.

*   **Dependencies:** The project utilizes `langchain` and `langchain-google-genai` for AI interactions.
*   **Client Initialization (`api/services/image_processing.py`):** The LangChain `ChatGoogleGenerativeAI` wrapper is initialized with the `gemini-1.5-pro-latest` model and the `GEMINI_API_KEY` from application settings.
    ```python
    from langchain_google_genai import ChatGoogleGenerativeAI
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest", google_api_key=settings.GEMINI_API_KEY)
    ```
*   **Prompt Construction and Invocation (`api/services/image_processing.py`):**
    *   Image files are converted to Base64 encoded strings using the `_convert_image_to_base64` helper function.
    *   A structured, multi-part `HumanMessage` object is constructed, containing both a text instruction for tagging and the Base64-encoded image as a `data:` URI.
    *   The `llm.invoke()` method is used to send this `HumanMessage` to the Gemini model for tag generation.

---

## 2. Asynchronous Image Processing Pipeline

The application handles potentially long-running image processing operations in the background to maintain a responsive user interface during uploads and startup scans.

*   **Upload Workflow (`api/routers/images.py`):**
    *   Upon image upload, a placeholder `Image` record is created in the database with a `status` of "processing" using `crud.create_placeholder_image`.
    *   The core processing function, `process_and_save_image_metadata_sync`, is scheduled to run as a FastAPI `BackgroundTasks`.
    *   The API immediately returns a `202 Accepted` response with the initial image data.
*   **Core Processing Logic (`api/services/image_processing.py`):**
    *   The `process_and_save_image_metadata_sync` function is a synchronous function that performs:
        *   HEIC/HEIF image conversion to JPEG.
        *   Extraction of EXIF metadata (camera model, date taken, etc.).
        *   Calling `generate_image_tags_sync` to obtain AI-generated tags.
        *   Thumbnail generation (saved in WebP format).
        *   Updates the corresponding `Image` record in the database using `crud.update_image_with_metadata` with all collected data, setting the `status` to "completed".
        *   If any error occurs during processing, the image's status is updated to "failed" using `crud.update_image_status`.
*   **Startup Scan (`api/main.py`):**
    *   During application startup, the `lifespan` function scans the `uploads/` directory for any image files not yet present in the database.
    *   For new images, it initiates the same background processing workflow: creates a placeholder `Image` and schedules `process_and_save_image_metadata_sync`.
*   **Reverse Geocoding (`api/services/geocoding.py`):** Geocoding missing addresses is also handled as a background task, leveraging `geopy.geocoders.Nominatim`.

---

## 3. Database Schema and CRUD Operations

The application uses SQLAlchemy for ORM with a PostgreSQL database, managing Image, Metadata, Location, and Tag entities.

*   **`api/models.py`:**
    *   The `Image` model includes `id`, `filename`, `filepath`, `upload_date`, `resolution`, `image_size`, `mimetype`, and a `status` field (string, default "processing").
    *   Relationships are defined for one-to-one (`Image` to `Metadata` and `Metadata` to `Location`) and many-to-many (`Image` to `Tag`).
*   **`api/schemas.py`:** Pydantic schemas are defined for data validation and serialization:
    *   `ImageCreate`: For creating new image records.
    *   `ImageUpdate`: For updating existing image records (e.g., after background processing).
    *   `Image`: The full schema for reading image data, including nested `Metadata`, `Location`, and `Tag` information.
*   **`api/crud.py`:** Contains functions for common database operations:
    *   Image lifecycle management: `get_image_by_id`, `get_image_by_filename`, `create_placeholder_image`, `update_image_with_metadata`, `update_image_status`, `delete_image`.
    *   Tag management: `get_tag_by_name`, `get_or_create_tag`.
    *   Album views: `get_images_by_date`, `get_album_summary`, `get_album_images`.
    *   Map data: `get_locations_without_address`, `update_location_address`, `get_map_data`.
    *   Statistics: `get_stats`.
    *   Filter options: `get_unique_camera_models`, `get_unique_locations`, `get_unique_dates`.

---

## 4. Frontend (Vanilla JS, HTML, CSS) Features

The user interface is a responsive single-page application built with vanilla JavaScript, HTML5, and CSS3, interacting with the FastAPI backend via an `api.js` module.

*   **Dynamic Views:** Supports switching between Dashboard, All Images, Albums, Album Images, Map, and Upload views.
*   **Image Gallery:** Displays images in a responsive grid layout with lazy loading.
*   **Album View:** Organizes photos chronologically by year and month, with preview images.
*   **Interactive Filters:** A sidebar features dropdowns to filter images by camera model, location, and date.
*   **Lightbox:** Clicking on an image opens a full-screen lightbox for detailed viewing.
*   **Map Integration:** Displays geotagged photos on an interactive Folium map, embedded as HTML directly into the frontend.
*   **Theme Toggling:** Supports switching between a dark and light theme.
*   **Upload Functionality:** Provides a modal for uploading images, which are then processed in the background.

---

## 5. Backend API Endpoints

The FastAPI backend exposes a set of RESTful endpoints:

*   `/api/v1/images`: Handles image upload (POST) and retrieval (GET), and deletion (DELETE).
*   `/api/v1/albums/summary`: Provides a summary of albums grouped by year and month.
*   `/api/v1/albums/{year}/{month}`: Retrieves images for a specific album.
*   `/api/v1/stats`: Returns various counts for sidebar statistics.
*   `/api/v1/map/data`: Provides raw geographic data for images.
*   `/api/v1/map/map`: Returns a pre-rendered HTML Folium map.
*   `/api/v1/suggestions/albums`: Offers AI-powered album suggestions (currently with placeholder data).
*   `/api/v1/filters/cameras`, `/api/v1/filters/locations`, `/api/v1/filters/dates`: Provide unique filter options.

---

## 6. Containerization

The entire application is designed for containerized deployment using Docker.

*   `Dockerfile`: Defines the build process for the FastAPI backend.
*   `docker-compose.yml`: Orchestrates the `db` (PostgreSQL) and potentially `backend` and `frontend` services (depending on full deployment configuration).