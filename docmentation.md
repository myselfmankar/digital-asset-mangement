# 📸 pyPhotoView — Developer Documentation (DBMS Project)

## 1. Project Overview

**pyPhotoView** is a local-only, Python-based **DBMS mini project** inspired by *PhotoView*.
It demonstrates how to manage structured (relational) and unstructured (JSONB, BLOB) data together using **FastAPI** and **PostgreSQL**.
The system extracts image metadata, stores images locally, and visualizes geotagged photos on an interactive map.

---

## 2. Objectives

1. Demonstrate DBMS concepts using a real-world photo dataset.
2. Handle both structured and semi-structured data (tables + JSONB).
3. Store and retrieve images and thumbnails in a local static folder.
4. Provide three key endpoints for image browsing, album filtering, and map visualization.

---

## 3. Architecture

pyPhotoView follows a simple **2-tier architecture**:

### Application Layer (Backend + Frontend)

*   A unified application built with **Streamlit** (for frontend components) and **FastAPI** (for backend logic).
*   **Folium** is used for map visualizations.
*   It handles:
    *   File uploads and user interface.
    *   Metadata extraction using **Pillow** and **exifread**.
    *   Reverse geocoding with **geopy**.
    *   Database operations via **SQLAlchemy** ORM.
    *   Static file serving for images and thumbnails.

### Data Layer

*   **PostgreSQL + PostGIS** (running in Docker) store metadata and relational data.
*   **Static folder** stores image files and thumbnails locally.
*   Database demonstrates:
    *   JSONB (for raw EXIF data)
    *   Normalized tables for relational storage.

---

## 4. Technology Stack

| Layer                  | Tool                          |
| ---------------------- | ----------------------------- |
| Application (UI+Logic) | FastAPI + Streamlit + Folium  |
| Database               | PostgreSQL + PostGIS          |
| File Storage           | Local static folder           |
| Metadata               | Pillow + Pillow.Exiftags or Exifread             |
| Geolocation            | geopy or geoalchemy                       |
| Service Containerization | Docker Compose                |

---

## 5. Core Features

1.  **Upload Image**

    *   User uploads an image from the frontend.
    *   Backend extracts EXIF metadata and stores it in JSONB.
    *   Thumbnail is created and stored in the static folder.
    *   Original image is saved to the static folder.
    *   If GPS data is found, it's reverse geocoded and stored.

2.  **View All Images**

    *   Returns a fixed number of recent uploads with thumbnails and metadata.

3.  **Album Filter**

    *   Filters images by Year, Month, or Year/Month combination using upload date.

4.  **Map View**

    *   Retrieves coordinates of all images with GPS data.
    *   Displays them on a **Folium map** with markers.

---

## 6. Database Schema (Conceptual)

*   **images**
    Stores:

    *   Filename
    *   File path (in static folder)
    *   Upload date
    *   JSONB EXIF data
    *   Boolean flag if a GPS is available

*   **image_locations**
    Stores:

    *   Latitude
    *   Longitude
    *   City
    *   Country
    *   Linked to the corresponding image

There is **no authentication system** or user table.

---

## 7. Data Flow

1.  User uploads an image from the frontend.
2.  Metadata is extracted immediately.
3.  All EXIF data is stored as JSONB in PostgreSQL.
4.  A thumbnail is created and stored in the static folder.
5.  The original image is saved to the static folder.
6.  GPS data (if any) is converted to coordinates and stored in a linked table.
7.  The frontend fetches and displays data via the three endpoints.

---

## 8. Endpoints

| Endpoint           | Purpose                                            |
| ------------------ | -------------------------------------------------- |
| `/api/v1/images`   | Shows a fixed number of recent images.             |
| `/api/v1/albums`   | Shows images inside albums Filters images by year/month/year+month.           |
| `/api/v1/map-data` | Provides coordinates for Folium map visualization. |

---

## 9. Local Docker Setup Summary

*   **PostgreSQL + PostGIS** and **FastAPI backend** run as containerized services using Docker Compose.
*   **Streamlit frontend** connects to the backend via the service name within the Docker network.

---

## 10. Database Initialization

*   The database schema is created directly from SQLAlchemy models using `Base.metadata.create_all(bind=engine)` when the backend service starts.

---

## 11. Testing & Evaluation

1.  Upload images with and without GPS data.
2.  Ensure JSONB metadata is always populated.
3.  Verify thumbnails are visible in the gallery.
4.  Check album filters (by month and year).
5.  Test the map view to ensure markers match stored coordinates.
6.  Include the images as already stored images in system. Folder: /examples
7.  Each table should show at least 10–12 entries for demonstration.
8.  Include screenshots of gallery, albums, and map view in your report.

## 12. DBMS Concepts Demonstrated

*   **Normalization** → Separate image and location tables.
*   **Unstructured data** → EXIF metadata in JSONB.
*   **Binary data** → Thumbnails in BYTEA.
*   **Relational joins** → Connecting images and locations.
*   **Query operations** → Filtering and grouping for albums.

---

## 13. Key Takeaways

pyPhotoView demonstrates how databases can efficiently combine structured and unstructured data for multimedia management.
It showcases the integration of Python and SQL with a strong emphasis on DBMS principles, utilizing containerization for data services.

## 14. Frontend view
- Images should be inside a card
- Albums should store all images that staisfy it's condition of s SQL EXTRACT(YEAR/MONTH)
( similar to google photos )

## 15. Remeber
- Keep endpoints simple and descriptive.
- Handle missing EXIF metadata gracefully.
- Add sample images in /examples for demo.
- Document all database entries clearly.
---

**Status:** Implementation Ready
**Version:** 1.1.0
**Updated:** October 2025
**Author:** Vaishnav

---