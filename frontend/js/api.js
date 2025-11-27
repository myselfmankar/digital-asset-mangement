// frontend/js/api.js

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const api = {
    getImages: async (skip = 0, limit = 20, sortBy = 'upload_date') => {
        const response = await fetch(`${API_BASE_URL}/images?skip=${skip}&limit=${limit}&sort_by=${sortBy}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    searchImages: async (query) => {
        const response = await fetch(`${API_BASE_URL}/search/ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    getAlbumSuggestions: async () => {
        const response = await fetch(`${API_BASE_URL}/suggestions/albums`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    getAlbumSummary: async () => {
        const response = await fetch(`${API_BASE_URL}/albums/summary`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    getAlbumImages: async (year, month) => {
        const response = await fetch(`${API_BASE_URL}/albums/${year}/${month}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    getStats: async () => {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    getMapData: async () => {
        const response = await fetch(`${API_BASE_URL}/map/data`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    // Note: The backend /map endpoint directly returns HTML, so we fetch it differently
    getMapHtml: async () => {
        const response = await fetch(`${API_BASE_URL}/map/map`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    },

    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/images`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },
    
    getCameraFilters: async () => {
        const response = await fetch(`${API_BASE_URL}/filters/cameras`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    getLocationFilters: async () => {
        const response = await fetch(`${API_BASE_URL}/filters/locations`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    getDateFilters: async () => {
        const response = await fetch(`${API_BASE_URL}/filters/dates`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    deleteImage: async (imageId) => {
        const response = await fetch(`${API_BASE_URL}/images/${imageId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // No content to return on success (204)
        return;
    },
};
