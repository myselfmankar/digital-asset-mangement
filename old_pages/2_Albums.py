import streamlit as st
import requests
from PIL import Image
import os

st.title("Albums")

API_URL = "http://localhost:8000"

@st.cache_data
def get_images():
    try:
        res = requests.get(f"{API_URL}/api/v1/images")
        res.raise_for_status()
        return res.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching images: {e}")
        return []

images = get_images()
if images:
    # Filter out images that might not have a date_taken in details
    dated_images = [img for img in images if img.get("details") and img["details"].get("date_taken")]
    
    years = sorted(list(set([img["details"]["date_taken"][:4] for img in dated_images])))
    months = sorted(list(set([img["details"]["date_taken"][5:7] for img in dated_images])))

    selected_year = st.selectbox("Filter by Year", ["All"] + years)
    selected_month = st.selectbox("Filter by Month", ["All"] + months)

    params = {}
    if selected_year != "All":
        params["year"] = selected_year
    if selected_month != "All":
        params["month"] = selected_month

    try:
        res = requests.get(f"{API_URL}/api/v1/albums", params=params)
        res.raise_for_status()
        album_images = res.json()
        if album_images:
            cols = st.columns(4)
            for i, image_data in enumerate(album_images):
                with cols[i % 4]:
                    thumb_path = os.path.join("static/thumbnails", image_data["filename"])
                    if os.path.exists(thumb_path):
                        st.image(thumb_path, caption=image_data["filename"], width='stretch')
                    else:
                        st.warning(f"Thumbnail not found for {image_data['filename']}")
        else:
            st.info("No images found for the selected filter.")
    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching album images: {e}")
