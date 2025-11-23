// frontend/js/app.js
import { api } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-links a');
    const views = document.querySelectorAll('.content .view');
    const dashboardImageGrid = document.getElementById('dashboard-image-grid');
    const allImagesGrid = document.getElementById('all-images-grid');
    const albumsGrid = document.getElementById('albums-grid');
    const mapContainer = document.getElementById('map-container');
    const albumImagesView = document.getElementById('album-images-view');
    const albumImagesTitle = document.getElementById('album-images-title');
    const albumImagesGrid = document.getElementById('album-images-grid');
    const showDatabaseView = document.getElementById('show-database-view');
    const databaseContent = document.getElementById('database-content');
    
    // Upload Popup Elements
    const uploadPopup = document.getElementById('upload-popup');
    const closePopupButton = document.getElementById('close-popup-button');
    const fileInput = document.getElementById('file-input');
            const uploadButton = document.getElementById('upload-button');
            const uploadStatus = document.getElementById('upload-status');
            const themeToggleButton = document.getElementById('theme-toggle-button');
        
                // --- Theme Toggler ---
                const applyTheme = () => {
                    if (document.body.classList.contains('light-theme')) {
                        themeToggleButton.classList.remove('fa-moon');
                        themeToggleButton.classList.add('fa-sun');
                    } else {
                        themeToggleButton.classList.remove('fa-sun');
                        themeToggleButton.classList.add('fa-moon');
                    }
                };
            
                themeToggleButton.addEventListener('click', () => {
                    document.body.classList.toggle('light-theme');
                    applyTheme();
                });
            
                // Apply theme on initial load
                applyTheme();
            
                const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightbox-img');
            const lightboxCaption = document.getElementById('lightbox-caption');
            const lightboxClose = document.querySelector('.lightbox-close');

            const openLightbox = (image) => {
                lightbox.style.display = 'block';
                lightboxImg.src = `http://127.0.0.1:8000${image.large_url}`;
                lightboxCaption.innerHTML = `
                    <h3>${image.filename}</h3>
                    <p>${image.details?.location?.address || 'Unknown Location'}</p>
                `;
            };

            const closeLightbox = () => {
                lightbox.style.display = 'none';
            };

            lightboxClose.addEventListener('click', closeLightbox);

            // Function to create an image card (from template)
            const createImageCard = (image) => {
                const card = document.createElement('div');
                card.className = 'image-card';
                card.id = `image-card-${image.id}`;
        
                const fullImageUrl = `http://127.0.0.1:8000${image.thumbnail_url}`;
        
                card.innerHTML = `<img src="${fullImageUrl}" alt="${image.filename}" loading="lazy">`;
                
                card.addEventListener('click', () => openLightbox(image));
                
                return card;
            };
    
            // Function to load a single page of images (for the dashboard)
            const loadImages = async (targetGrid, limit = 20, enableDetailsPanel = false) => {
                targetGrid.innerHTML = '<p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading images...</p>';
                try {
                    const images = await api.getImages(0, limit, 'filename');
                    targetGrid.innerHTML = '';
                    if (images.length === 0) {
                        targetGrid.innerHTML = '<p class="info-message">No images found.</p>';
                        return;
                    }
                    images.forEach((image, index) => {
                        targetGrid.appendChild(createImageCard(image, index, images, enableDetailsPanel));
                    });
                } catch (error) {
                    console.error('Error loading images:', error);
                    targetGrid.innerHTML = '<p class="error-message">Error loading images. Please try again.</p>';
                }
            };
        
            // Function to load ALL images by fetching in batches (for the "Images" view)
            const loadAllImages = async (targetGrid) => {
                targetGrid.innerHTML = '<p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading all images...</p>';
                let allImages = [];
                let skip = 0;
                const limit = 50; // Fetch in batches of 50
                let hasMore = true;
        
                try {
                    while(hasMore) {
                        const batch = await api.getImages(skip, limit, 'filename');
                        allImages = allImages.concat(batch);
                        if (batch.length < limit) {
                            hasMore = false;
                        }
                        skip += limit;
                    }
        
                    targetGrid.innerHTML = '';
                    if (allImages.length === 0) {
                        targetGrid.innerHTML = '<p class="info-message">No images found.</p>';
                        return;
                    }
                    allImages.forEach((image, index) => {
                        targetGrid.appendChild(createImageCard(image, index, allImages, true));
                    });
                } catch (error) {
                    console.error('Error loading all images:', error);
                    targetGrid.innerHTML = '<p class="error-message">Error loading all images. Please try again.</p>';
                }
            };
        
            // Function to load albums
            const loadAlbums = async () => {
                albumsGrid.innerHTML = '<p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading albums...</p>';
                try {
                    const albums = await api.getAlbumSummary();
                    albumsGrid.innerHTML = '';
                    if (albums.length === 0) {
                        albumsGrid.innerHTML = '<p class="info-message">No albums found.</p>';
                        return;
                    }
                    albums.forEach(album => {
                        const albumCard = document.createElement('div');
                        albumCard.classList.add('album-card');
                        const fullPreviewUrl = `http://127.0.0.1:8000${album.preview_image_url}`;
                        albumCard.innerHTML = `
                            <img src="${fullPreviewUrl}" alt="${album.month_name} ${album.year}" loading="lazy">
                            <div class="album-card-info">
                                <h3>${album.month_name} ${album.year}</h3>
                                <p>${album.image_count} Photos</p>
                            </div>
                        `;
                        albumCard.addEventListener('click', () => {
                            loadAlbumImages(album.year, album.month, `${album.month_name} ${album.year}`);
                        });
                        albumsGrid.appendChild(albumCard);
                    });
                } catch (error) {
                    console.error('Error loading albums:', error);
                    albumsGrid.innerHTML = '<p class="error-message">Error loading albums. Please try again.</p>';
                }
            };

            // Function to load images for a specific album
            const loadAlbumImages = async (year, month, albumTitle) => {
                showView('album-images-view');
                albumImagesTitle.textContent = albumTitle;
                albumImagesGrid.innerHTML = '<p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading images...</p>';
                try {
                    const images = await api.getAlbumImages(year, month);
                    albumImagesGrid.innerHTML = '';
                    if (images.length === 0) {
                        albumImagesGrid.innerHTML = '<p class="info-message">No images found in this album.</p>';
                        return;
                    }
                    images.forEach((image, index) => {
                        albumImagesGrid.appendChild(createImageCard(image, index, images, true));
                    });
                } catch (error) {
                    console.error('Error loading album images:', error);
                    albumImagesGrid.innerHTML = '<p class="error-message">Error loading album images. Please try again.</p>';
                }
            };
        
            // Function to load map
            const loadMap = async () => {
                mapContainer.innerHTML = '<p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading map...</p>';
                try {
                    const mapHtml = await api.getMapHtml();
                    mapContainer.innerHTML = mapHtml;
                } catch (error) {
                    console.error('Error loading map:', error);
                    mapContainer.innerHTML = '<p class="error-message">Error loading map. Please try again.</p>';
                }
            };        // Function to load stats and update sidebar
        const loadStats = async () => {
            try {
                const stats = await api.getStats();
                document.getElementById('dashboard-count').textContent = stats.images || 0;
                document.getElementById('images-count').textContent = stats.images || 0;
                document.getElementById('albums-count').textContent = stats.albums || 0;
                document.getElementById('places-count').textContent = stats.places || 0;
                // Update storage info (placeholder values for now)
                document.getElementById('storage-used').textContent = '1 GB';
                document.getElementById('storage-total').textContent = '25 GB';
                document.querySelector('.storage-fill').style.width = '4%'; // 1GB out of 25GB
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        };
    
        // Handle file upload
        uploadButton.addEventListener('click', async () => {
            const files = fileInput.files;
            if (files.length === 0) {
                uploadStatus.textContent = 'Please select files to upload.';
                uploadStatus.style.color = 'orange';
                return;
            }
    
            uploadStatus.textContent = 'Uploading...';
            uploadStatus.style.color = 'blue';
    
            const formData = new FormData();
            for (const file of files) {
                formData.append('file', file); // FastAPI expects 'file' as the field name
            }
    
            try {
                // Assuming single file upload for now based on API
                const uploadedImage = await api.uploadImage(files[0]); 
                uploadStatus.textContent = `Successfully uploaded ${uploadedImage.filename}!`;
                uploadStatus.style.color = 'green';
                // Reload images and stats after successful upload
                loadImages(dashboardImageGrid, 20, true);
                loadAllImages(allImagesGrid);
                loadAlbums();
                loadMap(); // Add this
                loadStats();
            } catch (error) {
                console.error('Error uploading image:', error);
                uploadStatus.textContent = `Upload failed: ${error.message || 'Unknown error'}`;
                uploadStatus.style.color = 'red';
            }
        });
    
        const loadFilters = async () => {
            try {
                const [cameras, locations, dates] = await Promise.all([
                    api.getCameraFilters(),
                    api.getLocationFilters(),
                    api.getDateFilters()
                ]);

                const cameraFilter = document.getElementById('camera-filter');
                cameras.forEach(camera => {
                    const option = document.createElement('option');
                    option.value = camera;
                    option.textContent = camera;
                    cameraFilter.appendChild(option);
                });

                const locationFilter = document.getElementById('location-filter');
                locations.forEach(location => {
                    const option = document.createElement('option');
                    option.value = location;
                    option.textContent = location;
                    locationFilter.appendChild(option);
                });

                const dateFilter = document.getElementById('date-filter');
                dates.forEach(date => {
                    const option = document.createElement('option');
                    option.value = date;
                    option.textContent = date;
                    dateFilter.appendChild(option);
                });

            } catch (error) {
                console.error('Error loading filters:', error);
            }
        };

        // Initial loads
        loadStats();
        loadFilters();
        showView('dashboard-view');
        loadImages(dashboardImageGrid, 20, true);
    });
