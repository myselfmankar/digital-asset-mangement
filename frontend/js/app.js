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
    const calendarGrid = document.getElementById('calendar-grid');
    
    // Search & Suggestions
    const searchInput = document.getElementById('ai-search-input');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const suggestionsGrid = document.getElementById('suggestions-grid');
    const searchResultsView = document.getElementById('search-results-view');
    const searchResultsGrid = document.getElementById('search-results-grid');
    const searchQueryDisplay = document.getElementById('search-query-display');

    // Upload Popup Elements
    const uploadPopup = document.getElementById('upload-popup');
    const closePopupButton = document.getElementById('close-popup-button');
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
    const uploadStatus = document.getElementById('upload-status');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const dropArea = document.getElementById('drop-area');
    const fileListDisplay = document.getElementById('file-list');
    
    let selectedFiles = []; // Array to store selected files

    // --- Drag & Drop Logic ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('drag-over'), false);
    });

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        // Convert FileList to Array and concat
        const newFiles = Array.from(files);
        
        // Filter mainly images
        const validFiles = newFiles.filter(file => file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic'));
        
        if (validFiles.length < newFiles.length) {
            showToast("Some files were skipped (only images allowed)", "info");
        }

        selectedFiles = [...selectedFiles, ...validFiles];
        updateFileList();
    }

    function updateFileList() {
        fileListDisplay.innerHTML = '';
        if (selectedFiles.length > 0) {
            selectedFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'file-item';
                item.innerHTML = `
                    <span>${file.name}</span>
                    <i class="fas fa-check-circle"></i>
                `;
                fileListDisplay.appendChild(item);
            });
            uploadButton.disabled = false;
            uploadButton.innerHTML = `<span>Upload ${selectedFiles.length} Photos</span> <i class="fas fa-arrow-right"></i>`;
        } else {
            uploadButton.disabled = true;
            uploadButton.innerHTML = `<span>Upload Now</span> <i class="fas fa-arrow-right"></i>`;
        }
    }
    
    // Popup Controls
    const openUploadPopup = () => {
        uploadPopup.classList.add('visible');
        // Reset state
        selectedFiles = [];
        updateFileList();
        fileInput.value = '';
    };

    const closeUploadPopup = () => {
        uploadPopup.classList.remove('visible');
    };

    // Attach to Upload Link in Sidebar
    document.querySelector('a[href="#upload"]').addEventListener('click', (e) => {
        e.preventDefault();
        openUploadPopup();
    });

    closePopupButton.addEventListener('click', closeUploadPopup);
    uploadPopup.addEventListener('click', (e) => {
        if (e.target === uploadPopup) closeUploadPopup();
    });

    // --- View Switching ---
            const showView = (viewId) => {
                const currentView = document.querySelector('.view.active');
                const nextView = document.getElementById(viewId);

                if (currentView === nextView) return;

                // Update active sidebar link immediately
                sidebarLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${viewId.replace('-view', '')}`) {
                        link.classList.add('active');
                    }
                });

                // GSAP Crossfade Transition
                if (currentView) {
                    gsap.to(currentView, {
                        opacity: 0,
                        duration: 0.3,
                        onComplete: () => {
                            currentView.classList.remove('active');
                            nextView.classList.add('active');
                            gsap.fromTo(nextView, 
                                { opacity: 0, y: 10 }, 
                                { opacity: 1, y: 0, duration: 0.4, clearProps: "all" }
                            );
                        }
                    });
                } else {
                    // First load
                    nextView.classList.add('active');
                }
            };
            
            // Helper for Toast Notifications
            const showToast = (message, type = "info") => {
                let bg = "#333";
                if (type === "success") bg = "linear-gradient(to right, #00b09b, #96c93d)";
                if (type === "error") bg = "linear-gradient(to right, #ff5f6d, #ffc371)";
                
                Toastify({
                    text: message,
                    duration: 3000,
                    gravity: "bottom", // `top` or `bottom`
                    position: "right", // `left`, `center` or `right`
                    backgroundColor: bg,
                    stopOnFocus: true, // Prevents dismissing of toast on hover
                }).showToast();
            };

            sidebarLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').substring(1) + '-view';
                    showView(targetId);
                    
                    if (targetId === 'dashboard-view') {
                        loadImages(dashboardImageGrid, 20, true);
                        loadSuggestions();
                        loadStats();
                    } else if (targetId === 'images-view') {
                        loadAllImages(allImagesGrid);
                    } else if (targetId === 'albums-view') {
                        loadAlbums();
                    } else if (targetId === 'map-view') {
                        loadMap();
                    } else if (targetId === 'calendar-view') {
                        loadCalendar();
                    }
                });
            });


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
                // Simple entry animation for lightbox
                gsap.fromTo(lightboxImg, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
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
                    
                    const cards = [];
                    images.forEach((image, index) => {
                        const card = createImageCard(image, index, images, enableDetailsPanel);
                        targetGrid.appendChild(card);
                        cards.push(card);
                    });
                    
                    // GSAP Stagger Animation for Images
                    gsap.fromTo(cards, 
                        { opacity: 0, y: 20 }, 
                        { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" }
                    );

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
                    
                    const cards = [];
                    allImages.forEach((image, index) => {
                        const card = createImageCard(image, index, allImages, true);
                        targetGrid.appendChild(card);
                        cards.push(card);
                    });

                     // GSAP Stagger Animation (Faster for large lists)
                     gsap.fromTo(cards, 
                        { opacity: 0, scale: 0.95 }, 
                        { opacity: 1, scale: 1, duration: 0.4, stagger: 0.03, ease: "power1.out" }
                    );

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
                    
                    const albumCards = [];
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
                        albumCards.push(albumCard);
                    });
                    
                    gsap.fromTo(albumCards, 
                        { opacity: 0, x: -20 }, 
                        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1 }
                    );

                } catch (error) {
                    console.error('Error loading albums:', error);
                    albumsGrid.innerHTML = '<p class="error-message">Error loading albums. Please try again.</p>';
                }
            };

            // Function to load calendar (reusing album summary data)
            const loadCalendar = async () => {
                calendarGrid.innerHTML = '<p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading calendar...</p>';
                try {
                    const albums = await api.getAlbumSummary();
                    calendarGrid.innerHTML = '';
                    if (albums.length === 0) {
                        calendarGrid.innerHTML = '<p class="info-message">No photos found.</p>';
                        return;
                    }
                    
                    const calendarCards = [];
                    albums.forEach(album => {
                        const card = document.createElement('div');
                        card.classList.add('album-card');
                        const fullPreviewUrl = `http://127.0.0.1:8000${album.preview_image_url}`;
                        card.innerHTML = `
                            <img src="${fullPreviewUrl}" alt="${album.month_name} ${album.year}" loading="lazy">
                            <div class="album-card-info">
                                <h3>${album.month_name} ${album.year}</h3>
                                <p>${album.image_count} Photos</p>
                            </div>
                        `;
                        card.addEventListener('click', () => {
                            loadAlbumImages(album.year, album.month, `${album.month_name} ${album.year}`);
                        });
                        calendarGrid.appendChild(card);
                        calendarCards.push(card);
                    });
                    
                    gsap.fromTo(calendarCards, 
                        { opacity: 0, scale: 0.9 }, 
                        { opacity: 1, scale: 1, duration: 0.4, stagger: 0.05, ease: "power1.out" }
                    );

                } catch (error) {
                    console.error('Error loading calendar:', error);
                    calendarGrid.innerHTML = '<p class="error-message">Error loading calendar. Please try again.</p>';
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
                    
                    const cards = [];
                    images.forEach((image, index) => {
                        const card = createImageCard(image, index, images, true);
                        albumImagesGrid.appendChild(card);
                        cards.push(card);
                    });
                    
                    gsap.fromTo(cards, 
                        { opacity: 0, y: 20 }, 
                        { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 }
                    );

                } catch (error) {
                    console.error('Error loading album images:', error);
                    albumImagesGrid.innerHTML = '<p class="error-message">Error loading album images. Please try again.</p>';
                }
            };

            // --- AI Suggestions ---
            const loadSuggestions = async () => {
                try {
                    const suggestions = await api.getAlbumSuggestions();
                    if (suggestions && suggestions.length > 0) {
                        suggestionsContainer.style.display = 'block';
                        suggestionsGrid.innerHTML = '';
                        
                        const suggestionCards = [];
                        suggestions.forEach(suggestion => {
                            const card = document.createElement('div');
                            card.className = 'suggestion-card';
                            card.textContent = suggestion;
                            card.addEventListener('click', () => {
                                // When clicked, search for this suggestion
                                searchInput.value = suggestion;
                                handleSearch(suggestion);
                            });
                            suggestionsGrid.appendChild(card);
                            suggestionCards.push(card);
                        });
                        
                        gsap.fromTo(suggestionCards,
                            { opacity: 0, scale: 0.8 },
                            { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(1.7)" }
                        );

                    } else {
                        suggestionsContainer.style.display = 'none';
                    }
                } catch (error) {
                    console.error("Error loading suggestions:", error);
                    suggestionsContainer.style.display = 'none';
                }
            };

            // --- AI Search ---
            const handleSearch = async (query) => {
                if (!query) return;
                
                showView('search-results-view');
                searchQueryDisplay.textContent = `Results for "${query}"`;
                searchResultsGrid.innerHTML = '<p class="loading-message"><i class="fas fa-spinner fa-spin"></i> AI is searching...</p>';
                
                try {
                    const images = await api.searchImages(query);
                    searchResultsGrid.innerHTML = '';
                    if (images.length === 0) {
                        searchResultsGrid.innerHTML = '<p class="info-message">No images found matching your query.</p>';
                        return;
                    }
                    
                    const cards = [];
                    images.forEach((image, index) => {
                        const card = createImageCard(image, index, images, true);
                        searchResultsGrid.appendChild(card);
                        cards.push(card);
                    });
                    
                    gsap.fromTo(cards, 
                        { opacity: 0, y: 20 }, 
                        { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 }
                    );

                } catch (error) {
                    console.error('Error searching images:', error);
                    searchResultsGrid.innerHTML = '<p class="error-message">Error searching images. Please try again.</p>';
                    showToast("Search failed. Please try again.", "error");
                }
            };

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSearch(searchInput.value);
                }
            });

            // Refresh Suggestions
            const refreshSuggestionsBtn = document.getElementById('refresh-suggestions');
            if (refreshSuggestionsBtn) {
                refreshSuggestionsBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    refreshSuggestionsBtn.classList.add('fa-spin');
                    try {
                        await loadSuggestions();
                    } catch (error) {
                        console.error(error);
                    } finally {
                        refreshSuggestionsBtn.classList.remove('fa-spin');
                    }
                });
            }
        
            // Function to load map with Leaflet
            let mapInstance = null;
            const loadMap = async () => {
                if (mapInstance) {
                    mapInstance.remove(); // Clean up previous instance
                    mapInstance = null;
                }
                
                mapContainer.innerHTML = ''; // Clear container
                
                try {
                    const mapData = await api.getMapData();
                    if (!mapData || mapData.length === 0) {
                         mapContainer.innerHTML = '<p class="info-message">No geotagged images found.</p>';
                         return;
                    }

                    // Initialize Leaflet Map
                    mapInstance = L.map('map-container').setView([20, 0], 2);
                    
                    // Add Dark Matter tiles
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                        subdomains: 'abcd',
                        maxZoom: 19
                    }).addTo(mapInstance);

                    // Add Markers
                    const bounds = [];
                    mapData.forEach(item => {
                        const icon = L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div style="width: 40px; height: 40px; background-image: url('http://127.0.0.1:8000${item.thumbnail_url}'); background-size: cover; border: 2px solid white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);"></div>`,
                            iconSize: [40, 40],
                            iconAnchor: [20, 40]
                        });
                        
                        L.marker([item.latitude, item.longitude], { icon: icon })
                            .addTo(mapInstance)
                            .bindPopup(`<b>${item.address || 'Unknown Location'}</b><br><img src="http://127.0.0.1:8000${item.thumbnail_url}" width="100">`);
                            
                        bounds.push([item.latitude, item.longitude]);
                    });

                    if (bounds.length > 0) {
                        mapInstance.fitBounds(bounds);
                    }

                } catch (error) {
                    console.error('Error loading map data:', error);
                    mapContainer.innerHTML = '<p class="error-message">Error loading map data. Please try again.</p>';
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
            if (selectedFiles.length === 0) {
                showToast('Please select files to upload.', "error");
                return;
            }
    
            const originalBtnText = uploadButton.innerHTML;
            uploadButton.disabled = true;
            uploadButton.innerHTML = `<span>Uploading...</span> <i class="fas fa-spinner fa-spin"></i>`;
    
            let successCount = 0;
            let errorCount = 0;

            for (const file of selectedFiles) {
                try {
                    await api.uploadImage(file);
                    successCount++;
                } catch (error) {
                    console.error('Error uploading image:', error);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                showToast(`Successfully uploaded ${successCount} images!`, "success");
                
                // Reload views
                loadImages(dashboardImageGrid, 20, true);
                loadAllImages(allImagesGrid);
                loadAlbums();
                loadStats();
                
                // Close popup
                setTimeout(() => {
                    closeUploadPopup();
                }, 1000);
            }

            if (errorCount > 0) {
                showToast(`Failed to upload ${errorCount} images.`, "error");
            }
            
            // Reset Button (if popup stays open)
            uploadButton.disabled = false;
            uploadButton.innerHTML = originalBtnText;
            
            // Clear selections if everything succeeded
            if (errorCount === 0) {
                selectedFiles = [];
                updateFileList();
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
        loadSuggestions();
    });
