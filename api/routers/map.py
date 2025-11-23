from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.responses import HTMLResponse
from .. import crud
from ..database import get_db
import folium
from folium import plugins

router = APIRouter(
    prefix="/api/v1/map",
    tags=["map"],
)

@router.get("/map", response_class=HTMLResponse)
def get_map_html(db: Session = Depends(get_db)):
    """
    Generates and returns an HTML page with a Folium map, including marker clustering.
    """
    map_data = crud.get_map_data(db)
    
    if not map_data:
        # Return a simple map if no data is available
        m = folium.Map(location=[20, 0], zoom_start=2, tiles="CartoDB dark_matter")
        return m._repr_html_()

    # Create base map with dark theme
    m = folium.Map(location=[map_data[0]['latitude'], map_data[0]['longitude']], zoom_start=5, tiles="CartoDB dark_matter")
    
    # Create MarkerCluster
    marker_cluster = plugins.MarkerCluster().add_to(m)
    
    # Add markers for each image
    for i, item in enumerate(map_data):
        icon_url = item['thumbnail_url'] # Assuming thumbnail_url is already correct
        
        icon_html = f"""
            <div style="cursor: pointer; width: 54px; height: 54px; background-image: url({icon_url}); background-size: cover; border: 2px solid white; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
            </div>
        """
        icon = folium.DivIcon(html=icon_html, icon_size=(54, 54), icon_anchor=(27, 54))

        folium.Marker(
            location=[item['latitude'], item['longitude']],
            icon=icon,
            tooltip=item['address']
        ).add_to(marker_cluster)
        
    return m._repr_html_()

@router.get("/data")
def get_map_data_json(db: Session = Depends(get_db)):
    """
    Returns a JSON list of all geotagged images with the data needed for the map.
    """
    return crud.get_map_data(db)
