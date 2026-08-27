import axios from 'axios';

// HARDCODED BYPASS: We are forcing React to use this exact clean URL.
const api = axios.create({
    baseURL: 'https://breathe-esg-backend-p7qt.onrender.com/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;