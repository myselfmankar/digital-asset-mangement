import streamlit as st
import requests
import folium
from streamlit_folium import st_folium
import os
import base64

st.title("Map View")

API_URL = "http://localhost:8000"

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
