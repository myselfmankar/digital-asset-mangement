import streamlit as st
import requests
from PIL import Image
import os

st.title("Gallery")

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

uploaded_file = st.file_uploader("Upload an image", type=["jpg", "jpeg", "png"])
if uploaded_file is not None:
    files = {"file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
    try:
        response = requests.post(f"{API_URL}/api/v1/images", files=files)
        response.raise_for_status()
        st.success("Image uploaded successfully!")
        st.cache_data.clear() # Clear cache to show new image
    except requests.exceptions.RequestException as e:
        st.error(f"Error uploading image: {e}")


images = get_images()
if images:
    cols = st.columns(4)
    for i, image_data in enumerate(images):
        with cols[i % 4]:
            thumb_path = os.path.join("static/thumbnails", image_data["filename"])
            if os.path.exists(thumb_path):
                st.image(thumb_path, caption=image_data["filename"], width='stretch')
            else:
                st.warning(f"Thumbnail not found for {image_data['filename']}")
