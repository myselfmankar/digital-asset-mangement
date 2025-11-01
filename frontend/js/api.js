// frontend/js/api.js

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const api = {
    getImages: async (skip = 0, limit = 20) => {
        const response = await fetch(`${API_BASE_URL}/images?skip=${skip}&limit=${limit}`);
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
        const response = await fetch(`http://127.0.0.1:8000/map`); // Direct call to HTML route
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text(); // Get raw HTML
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
};
