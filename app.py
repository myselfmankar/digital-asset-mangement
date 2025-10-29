import streamlit as st

st.set_page_config(
    layout="wide",
    page_title="pyPhotoView",
    page_icon="📷"
)

def load_css(file_name):
    with open(file_name) as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)

load_css('styles.css')

st.sidebar.title("pyPhotoView")

st.write(
    """
    # Welcome to pyPhotoView!
    Select a view from the sidebar to get started.
    """
)
