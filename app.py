import streamlit as st
import requests
import folium
from streamlit_folium import st_folium
from PIL import Image
import os
import base64

st.set_page_config(layout="wide")

st.title("pyPhotoView")

menu = ["Gallery", "Albums", "Map"]
choice = st.sidebar.selectbox("Menu", menu)

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

if choice == "Gallery":
    st.header("Gallery")

    uploaded_file = st.file_uploader("Upload an image", type=["jpg", "jpeg", "png"])
    if uploaded_file is not None:
        files = {"file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
        try:
            response = requests.post(f"{API_URL}/api/v1/images", files=files)
            response.raise_for_status()
            st.success("Image uploaded successfully!")
        except requests.exceptions.RequestException as e:
            st.error(f"Error uploading image: {e}")


    images = get_images()
    if images:
        cols = st.columns(4)
        for i, image_data in enumerate(images):
            with cols[i % 4]:
                thumb_path = os.path.join("static/thumbnails", image_data["filename"])
                if os.path.exists(thumb_path):
                    image = Image.open(thumb_path)
                    st.image(image, caption=image_data["filename"], width='stretch')
                else:
                    st.warning(f"Thumbnail not found for {image_data['filename']}")

elif choice == "Albums":
    st.header("Albums")

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
                            image = Image.open(thumb_path)
                            st.image(image, caption=image_data["filename"], width='stretch')
                        else:
                            st.warning(f"Thumbnail not found for {image_data['filename']}")
            else:
                st.info("No images found for the selected filter.")
        except requests.exceptions.RequestException as e:
            st.error(f"Error fetching album images: {e}")


elif choice == "Map":
    st.header("Map View")
    try:
        res = requests.get(f"{API_URL}/api/v1/map-data")
        res.raise_for_status()
        map_data = res.json()

        geotagged_images = [
            img for img in map_data 
            if img.get("details") and img["details"].get("location")
        ]

        if geotagged_images:
            initial_location = [
                geotagged_images[0]["details"]["location"]["latitude"],
                geotagged_images[0]["details"]["location"]["longitude"]
            ]
            m = folium.Map(location=initial_location, zoom_start=10)

            for image_data in geotagged_images:
                loc = image_data["details"]["location"]
                lat = loc["latitude"]
                lon = loc["longitude"]
                
                # Create a path to the thumbnail
                thumb_path = os.path.join("static/thumbnails", image_data["filename"])
                
                if os.path.exists(thumb_path):
                    # Read the image and encode it in base64
                    with open(thumb_path, "rb") as f:
                        encoded = base64.b64encode(f.read()).decode()
                    
                    # Create the popup with the embedded image
                    html = f'<img src="data:image/jpeg;base64,{encoded}" width="200">'
                    popup = folium.Popup(folium.Html(html, script=True), max_width=220)
                    
                    folium.Marker([lat, lon], popup=popup).add_to(m)

            st_folium(m, width=1200, height=800)
        else:
            st.info("No geotagged images to display on the map.")
    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching map data: {e}")