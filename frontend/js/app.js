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
            
                // Details Panel Elements
                const detailsPanelContainer = document.getElementById('details-panel-container');
                const detailsPanel = document.getElementById('details-panel');
                const detailsPanelBackdrop = document.getElementById('details-panel-backdrop');
                const detailsPanelClose = document.getElementById('details-panel-close');
                const detailsPanelImage = document.getElementById('details-panel-image');
                const detailsPanelTitle = document.getElementById('details-panel-title');
                const detailsPanelMetadata = document.getElementById('details-panel-metadata');

            const detailsPanelDelete = document.getElementById('details-panel-delete');

            let currentImage = null; // Variable to hold the current image context

            // --- Details Panel Functions ---
            const openDetailsPanel = (image) => {
                currentImage = image; // Set the context

                // Populate Image
                detailsPanelImage.src = `http://127.0.0.1:8000${image.large_url}`;

                // Populate Title
                const locationName = image.details?.location?.address?.split(',')[0] || 'Unknown Location';
                const year = image.details?.date_taken ? new Date(image.details.date_taken).getFullYear() : '';
                detailsPanelTitle.textContent = `${locationName} / ${year}`;

                // Populate Metadata
                detailsPanelMetadata.innerHTML = ''; // Clear previous metadata
                const metadataItems = [
                    { icon: 'fa-calendar-alt', text: image.details?.date_taken ? new Date(image.details.date_taken).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A' },
                    { icon: 'fa-camera', text: `${image.details?.camera_model || 'Unknown'}` },
                    { icon: 'fa-camera-retro', text: `ISO ${image.details?.iso || 'N/A'}, ƒ/${image.details?.f_number || 'N/A'}, ${image.details?.exposure_time || 'N/A'}s` },
                    { icon: 'fa-file-alt', text: `${image.mimetype?.split('/')[1].toUpperCase()}, ${image.resolution}, ${(image.image_size / (1024 * 1024)).toFixed(2)} MB` },
                    { icon: 'fa-file-code', text: image.filename },
                    { icon: 'fa-map-marker-alt', text: image.details?.location?.address || 'No Location Data' }
                ];

                metadataItems.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `<i class="fas ${item.icon}"></i> ${item.text}`;
                    detailsPanelMetadata.appendChild(li);
                });

                // Show the panel
                detailsPanel.classList.add('visible');
                detailsPanelBackdrop.classList.add('visible');
            };
            
            const closeDetailsPanel = () => {
                detailsPanel.classList.remove('visible');
                detailsPanelBackdrop.classList.remove('visible');
            };
    
        // Details Panel Event Listeners
        detailsPanelClose.addEventListener('click', closeDetailsPanel);
        detailsPanelBackdrop.addEventListener('click', closeDetailsPanel);

        detailsPanelDelete.addEventListener('click', async () => {
            if (!currentImage) return;

            if (confirm('Are you sure you want to delete this image?')) {
                try {
                    await api.deleteImage(currentImage.id);
                    closeDetailsPanel();
                    
                    const cardToRemove = document.getElementById(`image-card-${currentImage.id}`);
                    if (cardToRemove) {
                        cardToRemove.remove();
                    }
                    // Optionally, show a success notification
                } catch (error) {
                    console.error('Error deleting image:', error);
                    // Optionally, show an error notification
                    alert('Failed to delete image.');
                }
            }
        });
    
    
        // --- Main App Functions ---
    
        // Function to show a specific view
        const showView = (id) => {
            views.forEach(view => {
                view.classList.remove('active');
            });
            document.getElementById(id).classList.add('active');
    
            sidebarLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${id.replace('-view', '')}`) {
                    link.classList.add('active');
                }
            });
        };
    
        // Handle sidebar navigation
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                
                if (href === '#upload') {
                    uploadPopup.classList.add('visible');
                } else if (href === '#show-database') {
                    loadDatabaseContent();
                } else {
                    const viewId = `${href.substring(1)}-view`;
                    showView(viewId);
                    
                    // Load content dynamically based on viewId
                    if (viewId === 'dashboard-view') {
                        loadImages(dashboardImageGrid, 20, true); // Load just the first page for dashboard
                    } else if (viewId === 'images-view') {
                        loadAllImages(allImagesGrid); // Load all images for the main images view
                    } else if (viewId === 'albums-view') {
                        loadAlbums();
                    } else if (viewId === 'map-view') {
                        loadMap();
                    }
                }
            });
        });

        // Function to load database content
        const loadDatabaseContent = async () => {
            const password = prompt('Enter password to view database:');
            if (!password) return;

            showView('show-database-view');
            databaseContent.textContent = 'Loading...';

            try {
                const data = await api.showDatabase(password);
                databaseContent.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                console.error('Error loading database content:', error);
                databaseContent.textContent = 'Error loading database content. Check password and try again.';
            }
        };
    
        // Handle closing the popup
        closePopupButton.addEventListener('click', () => {
            uploadPopup.classList.remove('visible');
        });
        uploadPopup.addEventListener('click', (e) => {
            if (e.target === uploadPopup) { // Close if clicking on the backdrop
                uploadPopup.classList.remove('visible');
            }
        });
    
        // Function to create an image card (from template)
        const createImageCard = (image, index, imageList, enableDetailsPanel = false) => {
            const card = document.createElement('div');
            card.className = 'image-card';
            card.id = `image-card-${image.id}`;
    
            const locationName = image.details?.location?.address?.split(',')[0] || 'Unknown Location';
            const year = image.details?.date_taken ? new Date(image.details.date_taken).getFullYear() : '';
            const title = `${locationName} / ${year}`;
    
            const dateTaken = image.details?.date_taken ? new Date(image.details.date_taken).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';
            const camera = `${image.details?.camera_make || ''} ${image.details?.camera_model || 'Unknown'}`;
            const lens = `${image.details?.lens_model || 'N/A'}`;
            const settings = `ISO ${image.details?.iso || 'N/A'}, ${image.details?.exposure_time || 'N/A'}s`;
            const fileInfo = `${image.mimetype?.split('/')[1].toUpperCase()}, ${image.resolution}, ${(image.image_size / (1024 * 1024)).toFixed(2)} MB`;
            
            const fullImageUrl = `http://127.0.0.1:8000${image.medium_url}`;
    
            card.innerHTML = `
                <img src="${fullImageUrl}" alt="${image.filename}" loading="lazy">
                <div class="image-card-info">
                    <div class="image-card-header">
                        <h3>${title}</h3>
                        <i class="fas fa-trash-alt delete-icon" data-image-id="${image.id}"></i>
                    </div>
                    <ul>
                        <li><i class="fas fa-calendar-alt"></i> ${dateTaken}</li>
                        <li><i class="fas fa-camera"></i> ${camera}</li>
                        <li><i class="fas fa-camera-retro"></i> ${settings}</li>
                        <li><i class="far fa-file-alt"></i> ${fileInfo}</li>
                        <li><i class="fas fa-file-code"></i> ${image.filename}</li>
                        <li><i class="fas fa-map-marker-alt"></i> ${image.details?.location?.address || 'No Location Data'}</li>
                    </ul>
                </div>
            `;
            
            if (enableDetailsPanel) {
                card.querySelector('img').addEventListener('click', () => openDetailsPanel(image));
            }

            const deleteButton = card.querySelector('.delete-icon');
            deleteButton.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent the details panel from opening
                const imageId = e.target.dataset.imageId;
                if (confirm('Are you sure you want to delete this image?')) {
                    try {
                        await api.deleteImage(imageId);
                        card.remove(); // Remove the card from the DOM
                        // Optionally, show a success notification
                    } catch (error) {
                        console.error('Error deleting image:', error);
                        // Optionally, show an error notification
                        alert('Failed to delete image.');
                    }
                }
            });
            
            return card;
        };
    
            // Function to load a single page of images (for the dashboard)
            const loadImages = async (targetGrid, limit = 20, enableDetailsPanel = false) => {
                targetGrid.innerHTML = '<p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading images...</p>';
                try {
                    const images = await api.getImages(0, limit);
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
                            <h3>${album.month_name} ${album.year}</h3>
                            <p>${album.image_count} Photos</p>
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
                    // Fetch the list of geotagged images first
                    const mapImageList = await api.getMapData();
                    
                    // Then fetch the pre-rendered map HTML
                    const mapHtml = await api.getMapHtml();
                    mapContainer.innerHTML = mapHtml;

                    // Make the openDetailsPanel function globally accessible for the map markers
                    window.openMapMarkerDetails = (index) => {
                        if (mapImageList && mapImageList[index]) {
                            // The map data is simpler, so we need to fetch full details
                            // For now, we'll just show what we have. A better implementation
                            // would be to fetch the full image object.
                            // This is a placeholder for that functionality.
                            alert(`Showing details for marker ${index}. Full detail view from map not yet implemented.`);
                        }
                    };

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
    
        // Initial loads
        loadStats();
        showView('dashboard-view');
        loadImages(dashboardImageGrid, 20, true);
    });
