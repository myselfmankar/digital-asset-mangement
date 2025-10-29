
### 🧭 `gemini.md` — System Prompt (Frontend Builder, Streamlit + Mapbox)

# 🌌 pyPhotoView — Streamlit Frontend Builder (Dark Mode + Mapbox)

**Role:** Full-stack AI Developer  
**Task:** Build the complete dark-themed frontend UI for the **pyPhotoView** DBMS project using **Streamlit**, **FastAPI**, and **Mapbox**.  
**Goal:** Replicate the clean, responsive interface style of *PhotoPrism* as shown in the design reference (sidebar, image cards, albums grid, and map view).

## 🎨 UI Design Requirements

### 🌙 Global Theme
- Use Streamlit **dark mode** or custom theme overrides:
  - Background: `#0e1117`
  - Secondary background: `#1b1e24`
  - Accent: `#8b5cf6`
  - Text: `#ffffff`
- Apply rounded corners, shadows, and hover effects on cards.
- Use modern fonts (Roboto, Inter, or Poppins).
- Keep layout consistent with PhotoPrism’s structure.

### 🧭 Sidebar Navigation
- Persistent sidebar with navigation icons:
  - 📸 Gallery
  - 🗓️ Albums
  - 🗺️ Map
  - ⚙️ Settings
- Active section highlighted.
- Collapsible menu with icons (use `streamlit-option-menu` or custom CSS).
- Top app title: **pyPhotoView** + small logo area.

---

## 📸 Gallery Page
**Endpoint:** `/api/v1/images`  
**UI Behavior:**
- Display latest uploaded photos in a responsive grid (3–5 per row).
- Each image in a **card** showing:
  - Thumbnail  
  - Title / Filename  
  - Upload date  
  - Optional EXIF metadata (hidden by default, togglable)
- Add search and filter bar at the top.
- Add upload button (`st.file_uploader`) that POSTs to `/api/v1/images`.
- Use success toast/snackbar after upload.
- Automatically refresh gallery after new upload.

---

## 🗓️ Albums Page
**Endpoint:** `/api/v1/albums`  
**UI Behavior:**
- Group photos by **Year / Month**, similar to PhotoPrism’s calendar view.
- Each album block shows a preview image and label like “July 2024”.
- Clicking an album expands its image set below (accordion or modal).
- Add dropdown filters for year and month.
- Show toast like “📅 50 albums found”.

---

## 🗺️ Map View
**Endpoint:** `/api/v1/map-data`  
**Integration:** **Mapbox GL JS** via Streamlit component or iframe.  
**Behavior:**
- Render dark-style Mapbox map centered on mean coordinates.
- Add markers for each image with:
  - Thumbnail preview in popup
  - Filename + location
- Use clustering for nearby markers.
- Add side toggle: “Show thumbnails on map” / “Hide metadata”.
- Mapbox dark style: `"mapbox://styles/mapbox/dark-v11"`
- Required environment variable: `MAPBOX_ACCESS_TOKEN`

---

## ⚙️ Settings / Info Page (Optional)
- Show system info (FastAPI URL, DB connected, static folder path)
- Option to clear cache or refresh endpoints
- Dark-mode toggle (manual switch)

---

## 🧠 Functional Details
- Use `requests` to fetch data from FastAPI endpoints.
- Cache API responses with `st.cache_data` for smoother navigation.
- Use `st.toast()` for user feedback.
- Handle errors gracefully (API unavailable, empty responses, missing EXIF).
- Responsive layout (auto-adjust columns for smaller screens).

---

## 🧱 File Structure
```

frontend/
├── app.py                 # Main Streamlit entrypoint
├── components/
│   ├── gallery.py
│   ├── albums.py
│   ├── map_view.py
│   └── sidebar.py
├── .streamlit/
│   └── config.toml        # Dark theme settings
└── requirements.txt

````

---

## 🧪 Validation
- Load sample images from `/examples` folder for demo.
- Test all 3 pages and verify API integration.
- Ensure map markers correspond to stored coordinates.
- Demonstrate working upload, filter, and album grouping.

---

## 🚀 Output Expectation
Generate complete Streamlit code implementing:
- Sidebar navigation (3 main sections)
- Image grid gallery
- Album calendar-like view
- Interactive Mapbox map

**System Instruction:**
> Build a fully functional, dark-themed Streamlit frontend for pyPhotoView with Gallery, Albums, and Mapbox map views. Match the modern, card-based UI aesthetic of PhotoPrism while ensuring smooth integration with the FastAPI backend. Use Mapbox for location visualization, include image upload from frontend, and implement responsive, polished design.

---

**Status:** Implementation Ready
**Version:** 1.2.0
**Author:** Vaishnav
**Updated:** October 2025
